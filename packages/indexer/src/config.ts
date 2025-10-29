// This file stores the configurration of the various RPC /offchain providers
// in order to fetch necessary context data from the protocols.

export const jupiterNotebookFreetier = "https://lite-api.jup.ag/"
export const jupiterNotebookPaid = "https://api.jup.ag/"

export const endpoints = {
  jupiter: {
    free: "https://lite-api.jup.ag/",
    pro: "https://api.jup.ag/",
    paths: {
      swapQuoteV1: "swap/v1/quote",
      swapBuildV1: "swap/v1/swap",
      priceV3: "price/v3/price",
      tokensV2List: "tokens/v2/list",
    },
  },
  raydium: {
    swapHost: "https://transaction-v1.raydium.io",
  },
  meteora: {
    dlmmApi: "https://dlmm-api.meteora.ag/",
    paths: {
      pairsAll: "pair/all",
    },
  },
  solend: {
    api: "https://api.solend.fi/",
  },
  parcl: {
    api: "https://api.parcllabs.com/",
  },
} as const;
