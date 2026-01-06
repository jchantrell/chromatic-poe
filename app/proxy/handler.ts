const ALLOWED_ORIGINS = [
  "https://jchantrell.github.io",
  /^http:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^tauri:\/\/localhost$/,
  /^https?:\/\/tauri\.localhost$/,
];

const ALLOWED_DOMAINS = [
  /^https?:\/\/patch\.poecdn\.com\/.+/,
  /^https?:\/\/patch-poe2\.poecdn\.com\/.+/,
  /^https:\/\/www\.poewiki\.net\/w\/api\.php\?.+/,
  /^https:\/\/www\.poe2wiki\.net\/w\/api\.php\?.+/,
  /^https:\/\/poe-versions\.obsoleet\.org\/.*/,
  /^https:\/\/github\.com\/poe-tool-dev\/dat-schema\/releases\/download\/.+/,
];

export default {
  async fetch(request: Request) {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);

    if (!["GET", "OPTIONS"].includes(request.method)) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const isValidOrigin = ALLOWED_ORIGINS.some((allowed) => {
      if (typeof allowed === "string") {
        return origin === allowed;
      }
      return allowed.test(origin || "");
    });

    if (!isValidOrigin) {
      return new Response("Forbidden: Invalid origin", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return new Response("Bad Request: Missing url parameter", {
        status: 400,
      });
    }

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return new Response("Bad Request: Invalid target URL", { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedTarget.protocol)) {
      return new Response("Bad Request: Only HTTP/HTTPS allowed", {
        status: 400,
      });
    }

    if (!ALLOWED_DOMAINS.some((pattern) => pattern.test(targetUrl))) {
      return new Response("Forbidden: Invalid target URL", { status: 403 });
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "User-Agent": "Chromatic-POE-Proxy/1.0",
      },
    });

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
