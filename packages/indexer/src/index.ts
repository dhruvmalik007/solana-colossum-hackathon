import { Connection, PublicKey } from "@solana/web3.js";
import WebSocket from "ws";
import { putMarket, putTrade, type Market, type Order, type Trade } from "@repo/database";
import { startDefiLlamaCron } from "./jobs/defillamaCron";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const WS_URL = process.env.WS_URL || "wss://api.devnet.solana.com";
const PROGRAM_ID = process.env.PROGRAM_ID || "";

// Event discriminators (first 8 bytes of sha256("event:" + name))
/**
 * Compute Anchor event discriminator bytes.
 */
function anchorEventDiscriminator(name: string): Buffer {
  const digest = createHash("sha256").update(`event:${name}`).digest();
  return digest.subarray(0, 8);
}

type AnchorIdlEvent = { name: string };
type AnchorIdl = { events?: AnchorIdlEvent[] };

/**
 * Attempt to load IDL events from a JSON file. Use env SOLANA_PREDICTION_IDL to override path.
 */
function loadIdlEventNames(): string[] {
  try {
    const explicit = process.env.SOLANA_PREDICTION_IDL;
    // From compiled dist directory, resolve up to the solana_prediction package target idl
    const defaultPath = path.resolve(__dirname, "../../solana_prediction/target/idl/solana_prediction.json");
    const idlPath = explicit ?? defaultPath;
    const raw = fs.readFileSync(idlPath, "utf8");
    const idl = JSON.parse(raw) as AnchorIdl;
    return Array.isArray(idl.events) ? idl.events.map((e) => e.name) : [];
  } catch {
    return [];
  }
}

const DEFAULT_EVENT_NAMES = [
  "PmAmmInitialized",
  "MarketCreated",
  "OrderPlaced",
  "TradeExecuted",
  "OrderCancelled",
  "MarketResolved",
] as const;

const EVENT_DISCRIMINATORS: Record<string, Buffer> = Object.fromEntries(
  (loadIdlEventNames().length ? loadIdlEventNames() : DEFAULT_EVENT_NAMES).map((n) => [
    n,
    anchorEventDiscriminator(n),
  ])
);

type EventLog = {
  txSig: string;
  slot: number;
  ixIndex: number;
  eventName: string;
  data: Record<string, string | number | boolean>;
};

function decodeEvent(log: string, txSig: string, slot: number, ixIndex: number): EventLog | null {
  // Anchor logs are prefixed with "Program log: "; strip and parse our lightweight IDX format
  const line = log.replace(/^Program log: /, "").trim();
  if (!line.startsWith("IDX:")) return null;
  const rest = line.slice(4); // after 'IDX:'
  const sep = rest.indexOf("|");
  const eventName = sep === -1 ? rest : rest.slice(0, sep);
  const kvStr = sep === -1 ? "" : rest.slice(sep + 1);
  const data: Record<string, string | number | boolean> = {};
  if (kvStr) {
    for (const part of kvStr.split("|")) {
      const [k, v] = part.split("=");
      if (!k) continue;
      const key = k.trim();
      const valRaw = (v ?? "").trim();
      const numKeys = new Set([
        "order_id",
        "price_bps",
        "size",
        "ts",
        "l0",
        "dynamic_on",
        "fee_bps",
        "expiry_ts",
      ]);
      data[key] = numKeys.has(key) ? Number(valRaw) : valRaw;
    }
  }
  return { txSig, slot, ixIndex, eventName, data };
}

async function upsertEvent(event: EventLog) {
  const idemp = `${event.txSig}:${event.ixIndex}:${event.eventName}`;
  
  try {
    switch (event.eventName) {
      case "PmAmmInitialized": {
        const id = String((event.data.market as string | number | boolean | undefined) ?? `${event.txSig}:${event.ixIndex}`);
        const tsNum = Number((event.data.ts as string | number | boolean | undefined) ?? 0);
        const m: Market = {
          id,
          slug: id,
          title: id,
          description: undefined,
          category: undefined,
          createdAt: new Date(tsNum * 1000).toISOString(),
          resolutionTime: undefined,
          status: "Active",
        };
        await putMarket(m);
        console.log(`[indexer] PmAmmInitialized: ${m.id}`);
        break;
      }
      case "MarketCreated": {
        const id = String((event.data.market as string | number | boolean | undefined) ?? idemp);
        const tsNum = Number((event.data.ts as string | number | boolean | undefined) ?? 0);
        const m: Market = {
          id,
          slug: id,
          title: id,
          description: undefined,
          category: undefined,
          createdAt: new Date(tsNum * 1000).toISOString(),
          resolutionTime: undefined,
          status: "Active",
        };
        await putMarket(m);
        console.log(`[indexer] MarketCreated: ${m.id}`);
        break;
      }
      case "OrderPlaced": {
        // Represent an order placement as a synthetic trade snapshot for analytics (no DB order table here)
        const market = String((event.data.market as string | number | boolean | undefined) ?? "");
        const orderId = String((event.data.order_id as string | number | boolean | undefined) ?? `${event.txSig}:${event.ixIndex}`);
        const side = Number((event.data.side as string | number | boolean | undefined) ?? 0) === 0 ? "Buy" : "Sell";
        const priceBps = Number((event.data.price_bps as string | number | boolean | undefined) ?? 0);
        const sizeNum = Number((event.data.size as string | number | boolean | undefined) ?? 0);
        const tsNum = Number((event.data.ts as string | number | boolean | undefined) ?? 0);
        const t: Trade = {
          id: `${market}:${orderId}`,
          marketId: market,
          positionId: `${market}:order`,
          side,
          size: sizeNum,
          avgPrice: priceBps / 10000,
          feesPaid: 0,
          createdAt: new Date(tsNum * 1000).toISOString(),
        };
        await putTrade(t);
        console.log(`[indexer] OrderPlaced: ${t.id}`);
        break;
      }
      case "TradeExecuted": {
        const market = String((event.data.market as string | number | boolean | undefined) ?? "");
        const taker = String((event.data.taker as string | number | boolean | undefined) ?? "taker");
        const side = Number((event.data.side as string | number | boolean | undefined) ?? 0) === 0 ? "Buy" : "Sell";
        const sizeNum = Number((event.data.size as string | number | boolean | undefined) ?? 0);
        const priceBps = Number((event.data.price_bps as string | number | boolean | undefined) ?? 0);
        const tsNum = Number((event.data.ts as string | number | boolean | undefined) ?? 0);
        const t: Trade = {
          id: `${event.txSig}:${event.ixIndex}`,
          marketId: market,
          positionId: `${market}:${taker}`,
          side,
          size: sizeNum,
          avgPrice: priceBps / 10000,
          feesPaid: 0,
          createdAt: new Date(tsNum * 1000).toISOString(),
        };
        await putTrade(t);
        console.log(`[indexer] TradeExecuted: ${t.id}`);
        break;
      }
    }
  } catch (e: any) {
    if (e?.code === "ConditionalCheckFailedException") {
      console.log(`[indexer] Duplicate event ${idemp}, skipping`);
    } else {
      console.error(`[indexer] Upsert error:`, e);
    }
  }
}

async function subscribeToLogs() {
  const ws = new WebSocket(WS_URL);
  
  ws.on("open", () => {
    console.log(`[indexer] Connected to ${WS_URL}`);
    ws.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",
      params: [
        { mentions: [PROGRAM_ID] },
        { commitment: "confirmed" }
      ]
    }));
  });
  
  ws.on("message", async (data: Buffer) => {
    const msg = JSON.parse(data.toString());
    if (msg.method === "logsNotification") {
      const { signature, slot, logs } = msg.params.result.value;
      // Parse logs for events (simplified)
      for (let i = 0; i < logs.length; i++) {
        const event = decodeEvent(logs[i], signature, slot, i);
        if (event) {
          await upsertEvent(event);
        }
      }
    }
  });
  
  ws.on("error", (err) => {
    console.error("[indexer] WebSocket error:", err);
  });
  
  ws.on("close", () => {
    console.log("[indexer] WebSocket closed, reconnecting in 5s...");
    setTimeout(subscribeToLogs, 5000);
  });
}

async function backfill(programId: string, startSlot?: number) {
  const connection = new Connection(RPC_URL, "confirmed");
  const pubkey = new PublicKey(programId);
  
  console.log(`[indexer] Backfill from slot ${startSlot || "latest"}`);
  
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 100 });
  for (const sig of sigs) {
    const tx = await connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
    if (!tx?.meta?.logMessages) continue;
    
    for (let i = 0; i < tx.meta.logMessages.length; i++) {
      const event = decodeEvent(tx.meta.logMessages[i]!, sig.signature, sig.slot, i);
      if (event) {
        await upsertEvent(event);
      }
    }
  }
  
  console.log(`[indexer] Backfill complete`);
}

async function main() {
  console.log("[indexer] Starting Solana event indexer");
  console.log(`[indexer] RPC: ${RPC_URL}`);
  console.log(`[indexer] Program: ${PROGRAM_ID}`);

  // Optional: backfill historical events
  // await backfill(PROGRAM_ID);

  // Subscribe to live logs
  await subscribeToLogs();

  // Start DefiLlama offchain oracle cron -> writes structured snapshots to Vercel Blob
  const _defillamaCron = startDefiLlamaCron({
    prefix: process.env.BLOB_PREFIX,
    intervalMs: process.env.DEFI_LLAMA_CRON_MS ? Number(process.env.DEFI_LLAMA_CRON_MS) : undefined,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

main().catch(console.error);

export { runDefiLlamaOnce } from "./jobs/defillamaCron";
