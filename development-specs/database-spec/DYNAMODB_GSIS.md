# DynamoDB GSIs and Table Design

Applies to AWS DynamoDB in dev/prod.

## Tables

- `markets` (PK: `id` string)
- `orders` (PK: `id` string)
- `trades` (PK: `id` string)
- `positions` (PK: `id` string)
- `control` (PK: `name` string) — indexer checkpoints, locks

## Access Patterns

- List markets by status and recency → homepage
- Orderbook top-of-book: best N bids (highest price), best N asks (lowest price) by market
- User order history → by owner
- Trades by market (latest), and by position
- Positions by owner, and per market
- Indexer checkpoints and idempotency

## GSIs

### markets
- GSI `markets_by_status`:
  - PK: `gsi1pk = status`
  - SK: `gsi1sk = createdAt`
  - Query: list recent active markets: `status = 'Active'` ORDER BY createdAt DESC

### orders
- Two GSIs to efficiently query top-of-book per side.
- GSI `orders_by_market_buy`:
  - PK: `gsi1pk = marketSide = `${marketId}#Buy``
  - SK: `gsi1sk = sort = -price` (number)
  - Query: `marketSide = `${marketId}#Buy`` LIMIT N → highest bids first
- GSI `orders_by_market_sell`:
  - PK: `gsi2pk = marketSide = `${marketId}#Sell``
  - SK: `gsi2sk = sort = price` (number)
  - Query: `marketSide = `${marketId}#Sell`` LIMIT N → lowest asks first
- Optional GSI `orders_by_owner`:
  - PK: `gsi3pk = owner`
  - SK: `gsi3sk = createdAt`

Item attributes to persist for GSIs: `marketId`, `side`, `price` (number), `owner`, `createdAt`, `status`.

### trades
- GSI `trades_by_market`:
  - PK: `gsi1pk = marketId`
  - SK: `gsi1sk = createdAt`
- GSI `trades_by_position`:
  - PK: `gsi2pk = positionId`
  - SK: `gsi2sk = createdAt`

### positions
- GSI `positions_by_owner`:
  - PK: `gsi1pk = owner`
  - SK: `gsi1sk = marketId`
- GSI `positions_by_market`:
  - PK: `gsi2pk = marketId`
  - SK: `gsi2sk = owner`

### control (indexer)
- No GSI initially; rows:
  - `name = 'indexer:checkpoint'`, attributes: `lastSlot`, `lastSig`
  - `name = 'indexer:lock'`, attributes: `lockedBy`, `ttl`

## Example Item Shapes

```json
// orders
{
  "id": "mkt123:order:...",
  "marketId": "mkt123",
  "side": "Buy",
  "price": 101.25,
  "size": 500,
  "remaining": 200,
  "status": "Open",
  "createdAt": "2025-10-14T10:00:00.000Z",
  "marketSide": "mkt123#Buy",
  "sort": -101.25,
  "owner": "<pubkey>"
}
```

## Migration Note

- Current code uses `ScanCommand` as an MVP. After GSIs are created, update web/API to `QueryCommand` with the above GSIs to avoid scans.
