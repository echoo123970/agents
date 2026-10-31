# Describe it: drawing helper

The Mosaic Designer's **Describe it** option turns a customer's words into a black & white
design. The drawing is made by OpenAI's image model. The OpenAI key must stay secret, so it lives
in this small Cloudflare Worker (`worker.js`), never in the website's code.

Until the helper is set up, the website falls back to a free public image service, which is often busy.

## Set it up (about 10 minutes)

1. **OpenAI key:** at platform.openai.com, add billing, then create an API key under *API keys*.
   Set a monthly budget limit under *Settings → Limits* so costs can never run away.
2. **Cloudflare:** create a free account at dash.cloudflare.com.
   Go to *Workers & Pages → Create → Create Worker*, name it `imosaic-draw` and deploy.
3. Press *Edit code*, replace everything with the contents of `worker.js`, and press *Deploy*.
4. In the worker's *Settings → Variables and secrets*, add a **Secret** named `OPENAI_API_KEY`
   with your OpenAI key.
5. Copy the worker's address, for example `https://imosaic-draw.<your-name>.workers.dev`.
6. Save that address in the shop metafield `imosaic.ai_url`; the Mosaic Designer page reads it.

## Cost

Each drawing is one OpenAI image at low quality, about 1–2 US cents (check OpenAI's pricing page).
Cloudflare's free plan covers 100,000 calls a day. Only pages on imosaicart.com can use the helper.
