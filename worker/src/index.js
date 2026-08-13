export { RoomDO } from "./room.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    if (url.pathname === "/ws") {
      // یک اتاق واحد و ثابت برای این دو نفر — همیشه همون Durable Object.
      // اگه بعدا خواستین چند زوج هم‌زمان ازش استفاده کنن، اینجا می‌شه
      // به جای نام ثابت، یه room-code از querystring گرفت.
      const id = env.ROOM.idFromName("couple-room");
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};
