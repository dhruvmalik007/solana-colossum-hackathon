Findings
[indexer state] 
packages/indexer/src/index.ts
 is a Solana logs subscriber for your prediction program, not yet modularized for multi‑protocol data fetching.
[protocol list anchor] 
apps/web/lib/server/defillama.ts
 already fetches all Solana protocols from DefiLlama; fallback list includes jupiter, raydium, orca, meteora, marginfi, kamino, jito, marinade.
[config updated] I added verified API bases to 
packages/indexer/src/config.ts
 in endpoints without extra comments:
jupiter: https://lite-api.jup.ag/ (free), https://api.jup.ag/ (paid)
raydium: swapHost: https://transaction-v1.raydium.io
meteora: https://dlmm-api.meteora.ag/ (DLMM)
solend: https://api.solend.fi/
parcl: https://api.parcllabs.com/ (API key required)
Integration Matrix (SDKs and endpoints)
Jupiter (DEX Aggregator)
SDK: @jup-ag/core
REST: https://lite-api.jup.ag/swap/v1/quote, .../swap/v1/swap, .../price/v3/price, .../tokens/v2/*
Notes: Free vs Pro host split; breaking changes documented in https://dev.jup.ag/docs/
Raydium (DEX)
SDK: @raydium-io/raydium-sdk-v2
REST: https://transaction-v1.raydium.io (compute/swap, transaction/swap)
Docs: https://docs.raydium.io/raydium/traders/trade-api
Orca Whirlpools (CLMM DEX)
SDK: Preferred @orca-so/whirlpools (new), Legacy @orca-so/whirlpools-sdk
Docs: https://docs.orca.so/
Meteora DLMM (DEX)
SDK: @meteora-ag/dlmm
REST: https://dlmm-api.meteora.ag/pair/all
Docs: https://docs.meteora.ag/.../dlmm/typescript-sdk/getting-started
Solend (Lending)
SDK: @solendprotocol/solend-sdk
REST: https://api.solend.fi/
marginfi (Lending)
SDK: @mrgnlabs/marginfi-client-v2, @mrgnlabs/mrgn-common
Docs: https://docs.marginfi.com/ts-sdk
Kamino (Lending / Liquidity / Vaults)
SDK (Lend): @hubbleprotocol/kamino-lending-sdk
SDK (Liquidity): kamino-sdk-beta (liquidity; beta naming)
Program IDs (docs):
Lend: GzFgdRJX...kzkW
Liquidity: E35i5qn7...QNNv
Vaults: Cyjb5r4P...9xE
Docs: https://docs.kamino.finance/build-on-kamino/sdk-and-smart-contracts
Drift (Perps)
SDK: @drift-labs/sdk
Docs: https://docs.drift.trade/sdk-documentation
Mango v4 (Perps + Lending)
SDK: TS client in monorepo (GitHub): https://github.com/blockworks-foundation/mango-v4
Note: No single verified npm name for v4 client; use monorepo or generated client.
Zeta Markets (Derivatives)
SDK: @zetamarkets/sdk
Docs: https://docs.zeta.markets/build-with-zeta/sdks/typescript-sdk
Phoenix (CLOB DEX)
SDK: @ellipsis-labs/phoenix-sdk
Docs: https://github.com/Ellipsis-Labs/phoenix-sdk
OpenBook v2 (CLOB DEX)
SDK: @openbook-dex/openbook-v2
Docs: https://github.com/openbook-dex/openbook-ts
Marinade (Liquid Staking)
SDK: @marinade.finance/marinade-ts-sdk
Docs: https://docs.marinade.finance/developers/marinade-ts-js-sdk
Jito (Staking / Infra APIs)
SDK: jito-js-rpc (JSON-RPC client for Jito infra)
Docs: Low-latency/MEV endpoints: https://docs.jito.wtf/lowlatencytxnsend/
Sanctum (LST aggregator)
SDK: none official published yet
Docs: https://learn.sanctum.so/docs/for-developers/resources (trading/API references)
Parcl (RWA / Price feeds)
SDK: @parcl-oss/v3-sdk
REST: https://api.parcllabs.com/ (API key)
Docs: https://docs.parcllabs.com/
Tip: DefiLlama’s https://api.llama.fi/protocols + filter chains.includes('Solana') && category !== 'CEX' yields the live top list (your 
getSolanaProtocolsCached()
 already does this in 
apps/web/lib/server/defillama.ts
).

Modular Indexer Design (proposed)
Create a protocol-agnostic indexer layer inside packages/indexer/:

Types (src/types.ts)
ProtocolId union of slugs (e.g., 'jupiter' | 'raydium' | ...').
MarketSummary, PoolSummary, LendingMarket, PerpMarket, LSTInfo.
FetchOptions with pagination/time ranges.
Base interface (src/protocols/base.ts)
interface ProtocolConnector { id: ProtocolId; init(connection: Connection, opts?: any): Promise<void>; fetchMarkets(opts?: FetchOptions): Promise<MarketSummary[]>; fetchPositions(owner: PublicKey, opts?: FetchOptions): Promise<any[]>; fetchStats?(opts?: FetchOptions): Promise<any>; }
Optional category-specific interfaces:
DexConnectorBase (markets, pools, volumes)
LendingConnectorBase (assets, reserves, rates)
PerpsConnectorBase (OI, funding, positions)
LSTConnectorBase (stake, unstake quotes/APR)
Connectors (src/protocols/*)
jupiter.connector.ts (REST quote/price; no on-chain events)
raydium.connector.ts, orca.connector.ts, meteora.connector.ts
solend.connector.ts, marginfi.connector.ts, kamino-lend.connector.ts
drift.connector.ts, zeta.connector.ts, mango.connector.ts
marinade.connector.ts, jito.connector.ts, parcl.connector.ts
Each uses endpoints from 
src/config.ts
 and their SDK when beneficial.
Registry (src/protocols/registry.ts)
const registry: Record<ProtocolId, () => ProtocolConnector> = { jupiter: () => new JupiterConnector(), ... }
Allows dynamic enable/disable via config.
Config (
src/config.ts
)
Already extended with endpoints constants (Jupiter, Raydium, Meteora, Solend, Parcl).
Execution (src/run.ts)
Loop through enabled connectors (top N from DefiLlama or curated set).
Persist to @repo/database using existing put* helpers or new summaries.
I will scaffold this only after your go-ahead to avoid cluttering the workspace.

Proposed Dependencies (for @repo/indexer)
Non-destructive; will only install after approval.

Core Solana
@solana/web3.js (already present), may add @solana/spl-token
DEX/Lending/Perps SDKs
@jup-ag/core
@raydium-io/raydium-sdk-v2
@orca-so/whirlpools
@meteora-ag/dlmm
@solendprotocol/solend-sdk
@mrgnlabs/marginfi-client-v2
@drift-labs/sdk
@zetamarkets/sdk
@ellipsis-labs/phoenix-sdk
@openbook-dex/openbook-v2
@marinade.finance/marinade-ts-sdk
jito-js-rpc
Optional Kamino: @hubbleprotocol/kamino-lending-sdk and/or kamino-sdk-beta
Example command (to run inside packages/indexer/):

Recommended Actions
Approve package installs for the SDKs listed above (or choose a subset to start).
Confirm the initial protocol subset to scaffold (suggest: Jupiter, Raydium, Orca, Meteora, Solend, marginfi, Kamino Lend).
Provide API keys (if available) for:
Parcl Labs (PARCL_API_KEY in .env)
Jupiter Pro (if you want api.jup.ag higher limits)
Approve scaffolding of:
src/types.ts, src/protocols/base.ts, src/protocols/registry.ts
Two starter connectors: jupiter.connector.ts (REST), kamino-lend.connector.ts (SDK)
A simple src/run.ts to exercise connectors and log outputs
Task Status
Collected/verified SDKs and endpoints for Jupiter, Kamino, and other top Solana protocols; updated 
packages/indexer/src/config.ts
 with key API bases.
Proposed a modular connector architecture and dependency list.
Pending your approval to install SDKs and scaffold connector classes and types.

