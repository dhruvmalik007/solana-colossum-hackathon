export const DEFILLAMA_PROTOCOLS_URL = "https://api.llama.fi/protocols" as const;
export const DEFILLAMA_PROTOCOL_URL = (slug: string) => `https://api.llama.fi/protocol/${slug}` as const;
