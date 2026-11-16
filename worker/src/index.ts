interface ProviderConfig { referer?: string; origin?: string; allowedHosts: string[]; }
interface Env { PROVIDERS_JSON?: string; }

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,HEAD,OPTIONS", "access-control-allow-headers": "Range,Content-Type", "access-control-max-age": "86400" } });
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Method not allowed" }, 405);
    if (!url.pathname.startsWith("/proxy/")) return json({ error: "Not found" }, 404);
    let configs: Record<string, ProviderConfig>;
    try { configs = JSON.parse(env.PROVIDERS_JSON ?? "{}"); } catch { return json({ error: "Worker configuration is invalid" }, 500); }
    const providerId = url.pathname.slice("/proxy/".length);
    const config = configs[providerId];
    if (!config || !Array.isArray(config.allowedHosts)) return json({ error: "Unknown provider" }, 404);
    const raw = url.searchParams.get("url");
    if (!raw) return json({ error: "Missing URL" }, 400);
    let target: URL;
    try { target = new URL(raw); } catch { return json({ error: "Invalid URL" }, 400); }
    if (target.protocol !== "https:" || !config.allowedHosts.includes(target.hostname)) return json({ error: "Destination is not allowlisted" }, 403);
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("range", range);
    if (config.referer) headers.set("referer", config.referer);
    if (config.origin) headers.set("origin", config.origin);
    let upstream: Response;
    try { upstream = await fetch(target, { method: request.method, headers, redirect: "manual" }); }
    catch { return json({ error: "Upstream request failed" }, 502); }
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) return json({ error: "Invalid upstream redirect" }, 502);
      const redirected = new URL(location, target);
      if (redirected.protocol !== "https:" || !config.allowedHosts.includes(redirected.hostname)) return json({ error: "Redirect destination is not allowlisted" }, 403);
      try { upstream = await fetch(redirected, { method: request.method, headers, redirect: "manual" }); }
      catch { return json({ error: "Redirect request failed" }, 502); }
    }
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("access-control-allow-origin", "*");
    responseHeaders.set("access-control-expose-headers", "Content-Length,Content-Range,Accept-Ranges");
    responseHeaders.set("cache-control", "public, max-age=60");
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
  }
};
