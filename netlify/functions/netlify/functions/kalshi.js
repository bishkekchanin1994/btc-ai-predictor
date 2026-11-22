// Netlify serverless proxy for public Kalshi market data.
const BASE = "https://external-api.kalshi.com/trade-api/v2";

exports.handler = async (event) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  };

  try {
    const p = event.queryStringParameters || {};

    if (p.action === "market" && p.ticker) {
      const r = await fetch(
        `${BASE}/markets/${encodeURIComponent(p.ticker)}`
      );
      const body = await r.text();
      return { statusCode: r.status, headers, body };
    }

    if (p.action === "markets") {
      const url = `${BASE}/markets?series_ticker=KXBTC15M&status=open&limit=100`;
      const r = await fetch(url);

      if (!r.ok) {
        return {
          statusCode: r.status,
          headers,
          body: await r.text()
        };
      }

      const data = await r.json();
      const markets = (data.markets || []).sort(
        (a, b) =>
          new Date(a.close_time || 0) - new Date(b.close_time || 0)
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ markets })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Use action=markets or action=market&ticker=..."
      })
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Kalshi request failed",
        detail: String(e)
      })
    };
  }
};
