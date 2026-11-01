export function allowedMutation(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const supplied = new URL(origin);
    if (supplied.origin !== origin) return false;
    const target = new URL(request.url);
    // Next.js can normalize the internal URL to localhost. Host remains the
    // authority the browser addressed; never use X-Forwarded-Host here.
    const host = request.headers.get("host");
    if (host) {
      const external = new URL(`${target.protocol}//${host}`);
      if (external.username || external.password || external.pathname !== "/" || external.search || external.hash) return false;
      target.host = external.host;
      target.port = external.port;
    }
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    if (forwardedProtocol) {
      const protocol = forwardedProtocol.split(",")[0].trim();
      if (protocol !== "http" && protocol !== "https") return false;
      target.protocol = protocol + ":";
    }
    return supplied.origin === target.origin;
  }
  catch { return false; }
}
