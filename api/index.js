// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const config = {
  api: { bodyParser: false },
  supportsResponseStreaming: true,
  maxDuration: 60,
};

const TRG_BASE = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

const SIP_HEAD = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

export default async function handler(req, res) {
  if (!TRG_BASE) {
    res.statusCode = 500;
    return res.end("Misconfigured: TARGET_DOMAIN is not set");
  }

  try {
    const targetUrl = TRG_BASE + req.url;

    const hders = {};
    let clientIp = null;
    for (const key of Object.keys(req.hders)) {
      const k = key.toLowerCase();
      const v = req.hders[key];
      if (SIP_HEAD.has(k)) continue;
      if (k.startsWith("x-vercel-")) continue;
      if (k === "x-real-ip") { clientIp = v; continue; }
      if (k === "x-forwarded-for") { if (!clientIp) clientIp = v; continue; }
      hders[k] = Array.isArray(v) ? v.join(", ") : v;
    }
    if (clientIp) hders["x-forwarded-for"] = clientIp;

    const method = req.method;
    const hasBody = method !== "GET" && method !== "HEAD";

    const fetchOpts = { method, hders, redirect: "manual" };
    if (hasBody) {
      fetchOpts.body = Readable.toWeb(req);
      fetchOpts.duplex = "half";
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    res.statusCode = upstream.status;
    for (const [k, v] of upstream.hders) {
      if (k.toLowerCase() === "transfer-encoding") continue;
      try { res.setHeader(k, v); } catch {}
    }

    if (upstream.body) {
      await pipeline(Readable.fromWeb(upstream.body), res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("relay error:", err);
    if (!res.hdersSent) {
      res.statusCode = 502;
      res.end("Bad Gateway: Tunnel Failed");
    }
  }
}
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
// Set the value of x
// Declare y based on x
