import { Connection, PublicKey } from "@solana/web3.js";
import WebSocket from "ws";
import { putMarket, putOrder, putTrade, type Market, type Order, type Trade } from "@repo/database";

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const WS_URL = process.env.WS_URL || "wss://api.devnet.solana.com";
const PROGRAM_ID = process.env.PROGRAM_ID || "";

// Event discriminators (8-byte hash of event name)
const EVENT_DISCRIMINATORS = {
  MarketCreated: Buffer.from([/* 8 bytes from anchor IDL */]),
  OrderPlaced: Buffer.from([/* 8 bytes */]),
  TradeExecuted: Buffer.from([/* 8 bytes */]),
  OrderCancelled: Buffer.from([/* 8 bytes */]),
  MarketResolved: Buffer.from([/* 8 bytes */]),
};

type EventLog = {
  txSig: string;
  slot: number;
  ixIndex: number;
  eventName: string;
  data: any;
};

function decodeEvent(log: string, txSig: string, slot: number, ixIndex: number): EventLog | null {
  // Anchor logs are prefixed with "Program log: "; strip and parse our lightweight IDX format
  const line = log.replace(/^Program log: /, "").trim();
  if (!line.startsWith("IDX:")) return null;
  const rest = line.slice(4); // after 'IDX:'
  const sep = rest.indexOf("|");
  const eventName = sep === -1 ? rest : rest.slice(0, sep);
  const kvStr = sep === -1 ? "" : rest.slice(sep + 1);
  const data: Record<string, any> = {};
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
        const id = String(event.data.market || `${event.txSig}:${event.ixIndex}`);
        const m: Market = {
          id,
          slug: id,
          title: id,
          description: undefined,
          category: undefined,
          createdAt: new Date((event.data.ts || 0) * 1000).toISOString(),
          resolutionTime: undefined,
          status: "Active",
        };
        await putMarket(m);
        console.log(`[indexer] PmAmmInitialized: ${m.id} l0=${event.data.l0} fee_bps=${event.data.fee_bps}`);
        break;
      }
      case "MarketCreated": {
        const id = String(event.data.market || idemp);
        const m: Market = {
          id,
          slug: id,
          title: id,
          description: undefined,
          category: undefined,
          createdAt: new Date((event.data.ts || 0) * 1000).toISOString(),
          resolutionTime: undefined,
          status: "Active",
        };
        await putMarket(m);
        console.log(`[indexer] MarketCreated: ${m.id}`);
        break;
      }
      case "OrderPlaced": {
        const o: Order = {
          id: `${event.data.market}:${event.data.order_id}`,
          marketId: event.data.market,
          side: event.data.side === 0 ? "Buy" : "Sell",
          price: event.data.price_bps / 10000,
          size: event.data.size,
          remaining: event.data.size,
          status: "Open",
          createdAt: new Date(event.data.ts * 1000).toISOString(),
        };
        await putOrder(o);
        console.log(`[indexer] OrderPlaced: ${o.id}`);
        break;
      }
      case "TradeExecuted": {
        const t: Trade = {
          id: `${event.txSig}:${event.ixIndex}`,
          marketId: event.data.market,
          positionId: `${event.data.market}:${event.data.taker}`,
          side: event.data.side === 0 ? "Buy" : "Sell",
          size: event.data.size,
          avgPrice: event.data.price_bps / 10000,
          feesPaid: 0,
          createdAt: new Date(event.data.ts * 1000).toISOString(),
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
}

main().catch(console.error);
