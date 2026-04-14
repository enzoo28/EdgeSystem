/**
 * Vercel Edge Function — FlashAlpha GEX Proxy
 * 
 * Place this file at: /api/gex.js in your GitHub repo
 * (same folder level as index.html, inside an /api subfolder)
 * 
 * This runs on Vercel's servers — no CORS restrictions.
 * The browser calls /api/gex, this calls FlashAlpha, returns the result.
 * 
 * Usage: GET /api/gex?symbol=SPY&key=YOUR_FLASHALPHA_KEY
 */

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') || 'SPY';
  const apiKey = url.searchParams.get('key') || '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Whitelist symbols to prevent abuse
  const allowed = /^[A-Z0-9]{1,10}$/;
  if (!allowed.test(symbol)) {
    return new Response(JSON.stringify({ error: 'Invalid symbol' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const flashalphaUrl = `https://lab.flashalpha.com/v1/exposure/gex/${encodeURIComponent(symbol)}`;

    const upstream = await fetch(flashalphaUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'EdgeSystem/1.0'
      }
    });

    const data = await upstream.text();

    return new Response(data, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
