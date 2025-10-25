export const API_BASE = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL not set");
  return url.replace(/\/$/, "");
})();
