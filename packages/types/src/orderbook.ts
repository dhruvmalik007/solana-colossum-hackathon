export interface BookLevel { price: number; size: number; cumulative?: number }
export interface Trade { side: 'buy' | 'sell'; price: number; size: number; ts: number }
export interface Order { id: string; market: string; owner: string; side: 'buy' | 'sell'; price: number; size: number; ts: number }
export interface OrderBook { bids: BookLevel[]; asks: BookLevel[] }
