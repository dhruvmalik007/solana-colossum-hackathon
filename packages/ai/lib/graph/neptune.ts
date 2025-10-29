import axios, { AxiosInstance } from "axios";
import { SignatureV4 } from "@smithy/signature-v4";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import type { GraphEdgeRef, GraphFilters, GraphNodeRef, GraphStore, GraphTriple, Properties } from "./types";

/**
 * Configuration for connecting to an Amazon Neptune instance using the
 * openCypher HTTPS endpoint (port 8182).
 */
export interface NeptuneConfig {
  readonly endpoint: string; // without protocol, e.g. cluster-xyz.amazonaws.com
  readonly region: string;   // e.g. "us-east-1"
  readonly useIamAuth?: boolean; // if IAM auth is enabled on the cluster
  readonly datasetDefault?: string; // default dataset tag for nodes/edges
}

function assertSafeIdent(ident: string): string {
  const ok = /^[A-Za-z_][A-Za-z0-9_]*$/.test(ident);
  if (!ok) throw new Error(`Unsafe identifier: ${ident}`);
  return ident;
}

function rowExtract<T>(payload: unknown): readonly T[] {
  const out: T[] = [];
  const obj = payload as { results?: Array<{ data?: Array<{ row?: unknown[] }> }>; errors?: unknown[] };
  const results = obj?.results ?? [];
  for (const r of results) {
    const data = r?.data ?? [];
    for (const d of data) {
      const row = d?.row ?? [];
      if (row.length === 1) out.push(row[0] as T);
      else out.push((row as unknown) as T);
    }
  }
  return out;
}

/**
 * NeptuneGraphStore implements GraphStore backed by Neptune openCypher REST.
 * Notes:
 * - Must run within the same VPC (or via VPN/PrivateLink) — Neptune has no public IPs.
 * - If IAM auth is enabled, requests must be SigV4-signed with service "neptune-db".
 */
export class NeptuneGraphStore implements GraphStore {
  private readonly cfg: NeptuneConfig;
  private readonly http: AxiosInstance;
  private readonly signer?: SignatureV4;

  constructor(cfg: NeptuneConfig) {
    this.cfg = cfg;
    this.http = axios.create({ baseURL: `https://${cfg.endpoint}:8182`, timeout: 15000 });
    if (cfg.useIamAuth) {
      // Build Cognito Identity Pool credentials provider
      const identityPoolId = process.env.NEPTUNE_COGNITO_IDENTITY_POOL_ID;
      if (!identityPoolId) {
        throw new Error("NEPTUNE_COGNITO_IDENTITY_POOL_ID is required when useIamAuth is true");
      }
      const loginsEnv = process.env.NEPTUNE_COGNITO_LOGINS_JSON;
      let logins: Record<string, string> | undefined;
      if (loginsEnv) {
        try { logins = JSON.parse(loginsEnv) as Record<string, string>; } catch { /* ignore malformed */ }
      }
      const credentials = fromCognitoIdentityPool({
        clientConfig: { region: cfg.region },
        identityPoolId,
        logins,
      });
      this.signer = new SignatureV4({ service: "neptune-db", region: cfg.region, credentials, sha256: Sha256 });
    } else {
      this.signer = undefined;
    }
  }

  private async postCypher<T = unknown>(query: string, params?: Readonly<Record<string, unknown>>): Promise<readonly T[]> {
    const path = "/opencypher";
    const body = JSON.stringify({ query, parameters: params ?? {} });

    if (this.signer) {
      const req = new HttpRequest({
        method: "POST",
        protocol: "https:",
        hostname: this.cfg.endpoint,
        path,
        headers: { "content-type": "application/json" },
        body,
      });
      const signed = await this.signer.sign(req);
      const url = `https://${this.cfg.endpoint}:8182${path}`;
      const res = await this.http.post(url, body, { headers: signed.headers as Record<string, string> });
      return rowExtract<T>(res.data);
    }

    const res = await this.http.post(path, body, { headers: { "content-type": "application/json" } });
    return rowExtract<T>(res.data);
  }

  async upsertNode(label: string, key: string, props: Properties, filters?: GraphFilters): Promise<GraphNodeRef> {
    const lbl = assertSafeIdent(label);
    const dataset = filters?.dataset ?? this.cfg.datasetDefault ?? null;
    const query = `
      MERGE (n:${lbl} { key: $key })
      SET n += $props
      SET n.dataset = coalesce($dataset, n.dataset)
      RETURN { label: labels(n)[0], key: n.key } AS node
    `;
    const rows = await this.postCypher<{ label: string; key: string }>(query, { key, props, dataset });
    const row = rows[0] ?? { label: lbl, key };
    return { label: row.label, key: row.key };
  }

  async upsertEdge(
    from: GraphNodeRef,
    type: string,
    to: GraphNodeRef,
    props?: Properties,
    filters?: GraphFilters
  ): Promise<GraphEdgeRef> {
    
    
    const fromLbl = assertSafeIdent(from.label);
    const toLbl = assertSafeIdent(to.label);
    const relType = assertSafeIdent(type);
    const dataset = filters?.dataset ?? this.cfg.datasetDefault ?? null;
    const query = `
      MATCH (a:${fromLbl} { key: $fromKey }), (b:${toLbl} { key: $toKey })
      MERGE (a)-[r:${relType}]->(b)
      SET r += coalesce($props, {})
      SET r.dataset = coalesce($dataset, r.dataset)
      RETURN type(r) AS type
    `;
    const rows = await this.postCypher<string>(query, { fromKey: from.key, toKey: to.key, props: props ?? {}, dataset });
    const rType = rows[0] ?? relType;
    return { type: rType };
  }

  async queryCypher<T = unknown>(query: string, params?: Readonly<Record<string, unknown>>): Promise<readonly T[]> {
    return this.postCypher<T>(query, params);
  }

  async getAllEdges(filters?: GraphFilters, limit = 100): Promise<readonly GraphTriple[]> {
    const dataset = filters?.dataset ?? this.cfg.datasetDefault ?? null;
    const query = `
      MATCH (a)-[r]->(b)
      WHERE $dataset IS NULL OR r.dataset = $dataset OR a.dataset = $dataset OR b.dataset = $dataset
      RETURN {
        source: { label: labels(a)[0], key: a.key },
        relationship: { type: type(r) },
        target: { label: labels(b)[0], key: b.key }
      } AS triple
      LIMIT $limit
    `;
    const rows = await this.postCypher<{ source: GraphNodeRef; relationship: GraphEdgeRef; target: GraphNodeRef }>(query, { dataset, limit });
    return rows.map(r => ({ source: r.source, relationship: r.relationship, target: r.target }));
  }

  async deleteAll(filters?: GraphFilters): Promise<number> {
    const dataset = filters?.dataset ?? this.cfg.datasetDefault ?? null;
    const countQuery = `
      MATCH (n)
      WHERE $dataset IS NULL OR n.dataset = $dataset
      RETURN count(n) AS c
    `;
    const rows = await this.postCypher<number>(countQuery, { dataset });
    const count = (rows[0] ?? 0) as number;

    const delQuery = `
      MATCH (n)
      WHERE $dataset IS NULL OR n.dataset = $dataset
      DETACH DELETE n
    `;
    await this.postCypher(delQuery, { dataset });
    return count;
  }
}
