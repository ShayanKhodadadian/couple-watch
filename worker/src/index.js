export { RoomDO } from "./room.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
};

// ---------------------------------------------------------------------------
// /video-proxy?url=<any video URL>
//
// Fetches the given URL from the Worker (server-side, so no CORS applies to
// that hop) and streams it back to the browser with permissive CORS headers
// and Range-request passthrough. This lets the client point <video> /
// VideoTexture at ANY source — including ones that don't send their own
// Access-Control-Allow-Origin header — because the browser only ever talks
// to our own Worker origin, which always adds the header.
//
// Google Drive share links get special handling: Drive doesn't expose a
// stable "direct file" URL, and for files it can't virus-scan (roughly
// >100MB) it serves an HTML "confirm" interstitial instead of the file the
// first time around. We detect that and retry with the confirm token.
// ---------------------------------------------------------------------------

function extractDriveId(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!/(^|\.)drive\.google\.com$/.test(u.hostname) && !/(^|\.)docs\.google\.com$/.test(u.hostname)) {
      return null;
    }
    const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];
    const idParam = u.searchParams.get("id");
    if (idParam) return idParam;
    return null;
  } catch {
    return null;
  }
}

function fetchUpstream(url, range) {
  const headers = {};
  if (range) headers["Range"] = range;
  return fetch(url, { headers, redirect: "follow" });
}

async function resolveGoogleDriveStream(id, range) {
  let target = `https://drive.google.com/uc?export=download&id=${id}`;
  let upstream = await fetchUpstream(target, range);

  const contentType = upstream.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    // Large-file interstitial — pull the confirm token out of the page and retry.
    const html = await upstream.text();
    const match =
      html.match(/confirm=([0-9A-Za-z_-]+)/) ||
      html.match(/name="confirm"\s+value="([0-9A-Za-z_-]+)"/);
    if (match) {
      target = `https://drive.google.com/uc?export=download&confirm=${match[1]}&id=${id}`;
      upstream = await fetchUpstream(target, range);
    }
  }
  return upstream;
}

async function handleVideoProxy(request, env) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response("missing url param", { status: 400, headers: CORS_HEADERS });
  }

  // Optional light-weight abuse guard: if PROXY_KEY is set as a Worker
  // secret/variable, require it on every request. This is NOT strong
  // security (the key ships in the built client JS), just a deterrent
  // against random bots finding the endpoint and using it as a free
  // bandwidth proxy, since this Worker is publicly reachable.
  if (env.PROXY_KEY && url.searchParams.get("key") !== env.PROXY_KEY) {
    return new Response("forbidden", { status: 403, headers: CORS_HEADERS });
  }

  const range = request.headers.get("Range");
  const driveId = extractDriveId(target);

  let upstream;
  try {
    upstream = driveId ? await resolveGoogleDriveStream(driveId, range) : await fetchUpstream(target, range);
  } catch (err) {
    return new Response("upstream fetch failed: " + err.message, { status: 502, headers: CORS_HEADERS });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`upstream returned ${upstream.status}`, {
      status: upstream.status,
      headers: CORS_HEADERS,
    });
  }

  const headers = new Headers(CORS_HEADERS);
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control", "last-modified", "etag"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Drive sometimes mislabels the response; force a sane video type if it
  // looks wrong so the <video> element doesn't refuse to play it.
  const ct = headers.get("content-type") || "";
  if (!ct || ct.includes("text/html")) headers.set("content-type", "video/mp4");
  if (!headers.get("accept-ranges")) headers.set("accept-ranges", "bytes");

  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (url.pathname === "/video-proxy") {
      return handleVideoProxy(request, env);
    }

    if (url.pathname === "/ws") {
      const id = env.ROOM.idFromName("couple-room");
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};
