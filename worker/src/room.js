// RoomDO — یک Durable Object که کل وضعیت «اتاق مشترک» دو نفره رو نگه می‌داره:
// منبع ویدیو، وضعیت پخش (play/pause/time)، حضور هر دستگاه، چت، و اکشن‌های خوراکی.
//
// از WebSocket Hibernation API استفاده می‌کنه (this.ctx.acceptWebSocket) تا وقتی
// هیچ پیامی رد و بدل نمی‌شه، هزینه‌ی duration صفر بشه — دقیقا همون چیزی که پلن
// رایگان Cloudflare Workers (Durable Objects با بک‌اند SQLite) بدون نیاز به کارت
// بانکی ازش پشتیبانی می‌کنه.

const HEARTBEAT_DRIFT_IGNORE = true; // heartbeat فقط time رو به‌روز می‌کنه، isPlaying رو دست نمی‌زنه

export class RoomDO {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade request", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // این تماس باعث می‌شه Durable Object بتونه هایبرنیت بشه و باز هم پیام‌های
    // بعدیِ این سوکت رو (بعد از بیدار شدن دوباره) از طریق webSocketMessage دریافت کنه.
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  // ---- helpers ----

  async getSource() {
    return (await this.ctx.storage.get("source")) ?? null;
  }

  async getPlayback() {
    return (
      (await this.ctx.storage.get("playback")) ?? {
        isPlaying: false,
        time: 0,
        updatedAt: Date.now(),
      }
    );
  }

  estimateTime(playback) {
    if (!playback.isPlaying) return playback.time;
    const elapsed = (Date.now() - playback.updatedAt) / 1000;
    return playback.time + elapsed;
  }

  sendTo(ws, event, data) {
    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
      /* اتصال احتمالا بسته شده */
    }
  }

  broadcast(event, data, exceptWs) {
    const payload = JSON.stringify({ event, data });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exceptWs) continue;
      try {
        ws.send(payload);
      } catch {
        /* نادیده گرفتن سوکت‌های مرده */
      }
    }
  }

  deviceOf(ws) {
    const att = ws.deserializeAttachment();
    return att?.device || null;
  }

  broadcastPresence() {
    const list = this.ctx
      .getWebSockets()
      .map((ws) => this.deviceOf(ws))
      .filter(Boolean);
    this.broadcast("presence:update", list);
  }

  // ---- WebSocket Hibernation API handlers ----

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    const { event, data } = msg || {};
    if (!event) return;

    switch (event) {
      case "join": {
        const device = String(data?.device || "").slice(0, 40);
        ws.serializeAttachment({ device });

        const source = await this.getSource();
        const playback = await this.getPlayback();
        this.sendTo(ws, "state:sync", {
          source,
          playback: { ...playback, time: this.estimateTime(playback) },
        });
        this.broadcastPresence();
        break;
      }

      case "video:source": {
        const source = {
          url: String(data?.url || ""),
          kind: data?.kind === "upload" ? "upload" : "url",
          name: data?.name || "",
        };
        const playback = { isPlaying: false, time: 0, updatedAt: Date.now() };
        await this.ctx.storage.put("source", source);
        await this.ctx.storage.put("playback", playback);
        this.broadcast("video:source", source);
        break;
      }

      case "video:action": {
        const type = data?.type;
        const time = Number(data?.time) || 0;
        const prev = await this.getPlayback();
        let isPlaying = prev.isPlaying;
        if (type === "play") isPlaying = true;
        else if (type === "pause") isPlaying = false;
        // seek / heartbeat: isPlaying رو دست نمی‌زنیم

        const playback = { isPlaying, time, updatedAt: Date.now() };
        await this.ctx.storage.put("playback", playback);

        const device = this.deviceOf(ws);
        this.broadcast("video:action", { type, time, from: device }, ws);
        break;
      }

      case "chat:message": {
        const text = String(data?.text || "").slice(0, 2000).trim();
        if (!text) return;
        const device = this.deviceOf(ws);
        this.broadcast("chat:message", { text, from: device || "?", ts: Date.now() });
        break;
      }

      case "snack:action": {
        const device = this.deviceOf(ws);
        this.broadcast("snack:action", { ...data, from: device });
        break;
      }

      default:
        break;
    }
  }

  async webSocketClose(ws) {
    this.broadcastPresence();
  }

  async webSocketError(ws) {
    this.broadcastPresence();
  }
}
