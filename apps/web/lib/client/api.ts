export const API_BASE = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Fallback to Next.js rewrite proxy when not provided
  const base = url && url.trim().length > 0 ? url : "/api";
  return base.replace(/\/$/, "");
})();
