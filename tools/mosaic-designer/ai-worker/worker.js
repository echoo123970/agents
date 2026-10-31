// iMosaicArt Mosaic Designer: "Describe it" drawing helper (Cloudflare Worker).
//
// The website sends a customer's idea; this worker asks OpenAI's image model for black & white
// coloring-page line art and returns the PNG. The OpenAI key lives only here, as a secret, never in
// the website's code. Only pages on imosaicart.com may call it.
//
// Settings (Cloudflare dashboard -> Worker -> Settings -> Variables and secrets):
//   OPENAI_API_KEY        secret, required
//   OPENAI_IMAGE_MODEL    optional, default "gpt-image-1"
//   OPENAI_IMAGE_QUALITY  optional, "low" (default, cheapest), "medium" or "high"
//   ALLOWED_ORIGINS       optional, default "https://www.imosaicart.com,https://imosaicart.com"

const SIZES = ['1536x1024', '1024x1536', '1024x1024'];

export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://www.imosaicart.com,https://imosaicart.com').split(',').map(s => s.trim());
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return fail(405, 'Use POST');
    if (!allowed.includes(origin)) return fail(403, 'Not allowed');
    if (!env.OPENAI_API_KEY) return fail(500, 'The OpenAI key is not set');

    let body;
    try { body = await req.json(); } catch { return fail(400, 'Bad request'); }
    const idea = String(body.prompt || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!idea) return fail(400, 'Describe the design first');
    const size = SIZES.includes(body.size) ? body.size : '1536x1024';

    const prompt = `Simple coloring book page for a stone mosaic: ${idea}. `
      + 'Thick bold continuous black outlines of even width, every shape fully closed, flat line art, large simple shapes, '
      + 'no shading, no hatching, no fur or grass texture, no gray, no text or letters, pure white background, centered.';

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size, quality: env.OPENAI_IMAGE_QUALITY || 'low', n: 1 }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      const busy = r.status === 429 || r.status >= 500;
      return fail(busy ? 503 : 502, busy ? 'busy' : (detail.error?.message || 'The drawing could not be made'));
    }
    const data = await r.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return fail(502, 'No drawing came back');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Response(bytes, { headers: { ...cors, 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  },
};
