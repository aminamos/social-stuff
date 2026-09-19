import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Allow health checks and static assets through regardless
  if (url.pathname.startsWith("/_astro/") || url.pathname === "/health") {
    return next();
  }

  // In local development, request.cf won't exist — allow all traffic
  const country = (context.request as any).cf?.country;

  if (country === undefined) {
    // Likely local dev; allow
    return next();
  }

  if (country === "US") {
    return next();
  }

  // Block non-US traffic
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Not Available — Social Housing Info</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fefdfb;color:#1a1a1a}
div{max-width:30rem;padding:2rem;text-align:center}
h1{font-size:1.5rem;color:#1b4f72}
p{line-height:1.6;color:#5c5c5c}
</style></head>
<body>
<div><h1>Not available in your region</h1><p>This site provides information about housing policy in the United States and is only available to US visitors.</p></div>
</body></html>`,
    {
      status: 451,
      headers: { "Content-Type": "text/html" },
    }
  );
});
