/**
 * Minimal Cloudflare Worker for SPA static hosting.
 * Static assets are served via [assets] config in wrangler.toml.
 * This worker handles SPA fallback: non-file routes → index.html.
 */
export default {
  async fetch(request: Request, env: { ASSETS: { fetch: typeof fetch } }): Promise<Response> {
    const url = new URL(request.url);
    const hasExtension = /\.\w+$/.test(url.pathname);

    // If the path looks like a file, let [assets] handle it
    if (hasExtension) {
      return env.ASSETS.fetch(request);
    }

    // SPA fallback: serve index.html for client-side routing
    const indexUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  },
};
