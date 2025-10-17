import { Connection } from "@solana/web3.js";
import type { ProtocolConnector, ProtocolId } from "../types";
import { JupiterConnector } from "./jupiter.connector";
import { RaydiumConnector } from "./raydium.connector";
import { MeteoraConnector } from "./meteora.connector";
import { SolendConnector } from "./solend.connector";
import { MarinadeConnector } from "./marinade.connector";

type Factory = () => ProtocolConnector;

const factories: Partial<Record<ProtocolId, Factory>> = {
  jupiter: () => new JupiterConnector(),
  raydium: () => new RaydiumConnector(),
  meteora: () => new MeteoraConnector(),
  solend: () => new SolendConnector(),
  marinade: () => new MarinadeConnector(),
};

export function createConnector(id: ProtocolId): ProtocolConnector | null {
  const f = factories[id];
  return f ? f() : null;
}

export async function initConnector(conn: ProtocolConnector, connection: Connection): Promise<ProtocolConnector> {
  await conn.init(connection);
  return conn;
}
