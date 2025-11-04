import { Connection, Logs, PublicKey, Commitment, Context } from "@solana/web3.js";

/**
 * Configuration for a resilient Solana logs subscriber.
 */
export type LogSubscriberConfig = {
  endpoints: { http: string; ws?: string }[];
  programId: string;
  commitment?: Commitment;
  livenessTimeoutMs?: number; // if no logs within this window, reconnect
  maxBackoffMs?: number;      // cap for exponential backoff
};

/**
 * Resilient Solana onLogs subscriber with endpoint failover, exponential backoff, and liveness watchdog.
 * It avoids touching private Connection fields and relies on rebuilding the Connection when needed.
 */
export class SolanaLogSubscriber {
  private readonly cfg: Required<LogSubscriberConfig>;
  private endpointIdx = 0;
  private connection: Connection | null = null;
  private subscriptionId: number | null = null;
  private lastMessageTs = 0;
  private reconnectAttempts = 0;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  /**
   * Initialize with configuration. Call start() to begin.
   */
  /**
   * Create a new subscriber. Requires at least one endpoint.
   */
  constructor(cfg: LogSubscriberConfig) {
    this.cfg = {
      commitment: cfg.commitment ?? "confirmed",
      livenessTimeoutMs: cfg.livenessTimeoutMs ?? 30_000,
      maxBackoffMs: cfg.maxBackoffMs ?? 60_000,
      endpoints: cfg.endpoints,
      programId: cfg.programId,
    };
    if (!this.cfg.endpoints.length) {
      throw new Error("SolanaLogSubscriber requires at least one endpoint");
    }
  }

  /**
   * Start subscription to logs. Returns a disposer to stop.
   */
  start(onLogs: (entry: Logs, ctx: Context) => void): () => void {
    this.stopped = false;
    void this.connectAndSubscribe(onLogs);
    return () => this.stop();
  }

  /** Stop subscription and timers. */
  stop() {
    this.stopped = true;
    if (this.watchdogTimer) { clearInterval(this.watchdogTimer); this.watchdogTimer = null; }
    if (this.subscriptionId != null && this.connection) {
      void this.connection.removeOnLogsListener(this.subscriptionId).catch(() => {});
    }
    this.subscriptionId = null;
    this.connection = null;
  }

  /**
   * Build a new Connection using the current endpoint.
   */
  private buildConnection(): Connection {
    const idx = this.endpointIdx % this.cfg.endpoints.length;
    const ep = this.cfg.endpoints[idx]!;
    const conn = new Connection(ep.http, { commitment: this.cfg.commitment, wsEndpoint: ep.ws });
    return conn;
  }

  /**
   * Pick next endpoint for failover.
   */
  private rotateEndpoint() {
    this.endpointIdx = (this.endpointIdx + 1) % this.cfg.endpoints.length;
  }

  /**
   * Exponential backoff with jitter.
   */
  private backoffDelayMs(): number {
    this.reconnectAttempts += 1;
    const base = 2 ** Math.min(8, this.reconnectAttempts); // cap exponent growth
    const jitter = Math.floor(Math.random() * 1000);
    return Math.min(base * 1000 + jitter, this.cfg.maxBackoffMs);
  }

  /**
   * Reconnect flow with backoff and endpoint rotation.
   */
  private async reconnect(onLogs: (entry: Logs, ctx: Context) => void) {
    if (this.stopped) return;
    const delay = this.backoffDelayMs();
    console.warn(`[indexer] Reconnecting in ${delay}ms...`);
    await new Promise((r) => setTimeout(r, delay));
    this.rotateEndpoint();
    await this.connectAndSubscribe(onLogs);
  }

  /**
   * Connect and subscribe to program logs. Resets watchdog and attempts on success.
   */
  private async connectAndSubscribe(onLogs: (entry: Logs, ctx: Context) => void) {
    try {
      const programKey = new PublicKey(this.cfg.programId);
      this.connection = this.buildConnection();
      const cur = this.cfg.endpoints[this.endpointIdx % this.cfg.endpoints.length]!;
      console.log(`[indexer] Connected RPC=${cur.http} WS=${cur.ws ?? "(derived)"}`);

      // Subscribe
      this.subscriptionId = this.connection.onLogs(programKey, (entry, ctx) => {
        this.lastMessageTs = Date.now();
        this.reconnectAttempts = 0; // healthy
        onLogs(entry, ctx);
      }, this.cfg.commitment);

      // Watchdog: if no logs for livenessTimeout, rebuild connection
      if (this.watchdogTimer) clearInterval(this.watchdogTimer);
      this.watchdogTimer = setInterval(() => {
        if (this.stopped) return;
        const idle = Date.now() - this.lastMessageTs;
        if (idle > this.cfg.livenessTimeoutMs) {
          console.warn(`[indexer] Logs idle for ${idle}ms (>${this.cfg.livenessTimeoutMs}), triggering reconnect`);
          // teardown existing and reconnect
          if (this.subscriptionId != null && this.connection) { void this.connection.removeOnLogsListener(this.subscriptionId).catch(() => {}); }
          this.subscriptionId = null;
          void this.reconnect(onLogs);
        }
      }, Math.max(5_000, Math.floor(this.cfg.livenessTimeoutMs / 2)));
    } catch (e) {
      console.error(`[indexer] connectAndSubscribe error`, e);
      await this.reconnect(onLogs);
    }
  }
}
