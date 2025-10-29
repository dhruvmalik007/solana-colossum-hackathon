# Debugging the Blank Home Page

## Current Status

The home page shows blank content (no protocol cards). I've added extensive console logging to trace the data flow.

## Steps to Debug

### 1. Install Missing Dependencies

The AI insights feature requires packages that aren't installed yet:

```bash
cd apps/web
pnpm add ai @ai-sdk/openai
```

**Note:** The AI insights won't work without `OPENAI_API_KEY` in `apps/web/.env.local`, but the home page should still load.

### 2. Start Dev Server

```bash
cd apps/web
pnpm run dev
```

### 3. Check Console Logs

Open the browser at `http://localhost:3000` and check:

**Browser Console (F12):**
- Look for `[useDailyJSON]` logs showing cache hit/miss and fetch status
- Look for `[HomeProtocolsClient]` logs showing loading state and data
- Check for any JavaScript errors

**Terminal (where `pnpm run dev` is running):**
- Look for `[/api/protocols]` logs showing API requests
- Look for `[getSolanaProtocolsCached]` logs showing cache behavior
- Check for any server-side errors

### 4. Test API Route Directly

Open `http://localhost:3000/api/protocols` in your browser. You should see JSON like:

```json
{
  "data": [
    {
      "slug": "jito",
      "name": "Jito",
      "category": "Liquid Staking",
      "chains": ["Solana"],
      "tvl": 2500000000,
      "change_1d": 1.23,
      "logo": "https://icons.llama.fi/jito.png"
    },
    ...
  ]
}
```

If you see an error or empty array, the issue is in the server cache or DefiLlama fetch.

### 5. Check File Cache

The server caches data in `apps/web/.cache/`:

```bash
ls -lh apps/web/.cache/
cat apps/web/.cache/protocols-solana.min.json | head -n 20
```

If the file doesn't exist or is empty, the cache isn't working.

### 6. Clear Caches (if needed)

If you suspect stale data:

```bash
# Clear server file cache
rm -rf apps/web/.cache/

# Clear browser localStorage
# In browser console:
localStorage.clear()
```

Then reload the page.

## Expected Console Output

**Browser Console:**
```
[useDailyJSON] home:protocols:v1 cache miss, fetching /api/protocols
[useDailyJSON] home:protocols:v1 fetch response: 200 true
[useDailyJSON] home:protocols:v1 body: {data: Array(50)}
[useDailyJSON] home:protocols:v1 cached to localStorage
[HomeProtocolsClient] loading: false error: null data: {data: Array(50)} list length: 50
```

**Terminal:**
```
[/api/protocols] GET request received
[getSolanaProtocolsCached] called
[getSolanaProtocolsCached] cache miss, fetching from DefiLlama
[getSolanaProtocolsCached] fetched 3000 protocols
[getSolanaProtocolsCached] trimmed to 50 Solana protocols
[/api/protocols] data length: 50
```

## Common Issues

### Issue: API route returns empty array

**Cause:** DefiLlama API is down or returns unexpected data.

**Fix:** Check `https://api.llama.fi/protocols` directly in your browser. If it's down, wait or mock the data.

### Issue: Browser shows "No protocols found"

**Cause:** Client fetch failed or returned wrong format.

**Fix:** Check browser console for fetch errors. Verify `/api/protocols` returns `{data: [...]}`.

### Issue: Page stays in loading state forever

**Cause:** `useDailyJSON` hook isn't completing (fetch hangs or errors silently).

**Fix:** Check browser console for errors. Add breakpoints in `useDailyJSON`.

### Issue: "Cannot find module 'ai'" error

**Cause:** AI SDK packages not installed.

**Fix:** Run `pnpm add ai @ai-sdk/openai` in `apps/web`.

## Next Steps After Fixing

Once the home page loads:

1. Test market detail page: `http://localhost:3000/markets/jito`
2. Add `OPENAI_API_KEY` to `apps/web/.env.local` to enable AI insights
3. Polish UI with remaining shadcn components and MagicUI effects
4. Add news generation endpoint and client component

## Contact

If you see unexpected behavior, share:
- Browser console logs
- Terminal logs
- Output of `curl http://localhost:3000/api/protocols`
