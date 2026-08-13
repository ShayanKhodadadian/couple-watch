// یه Socket سبک بالای WebSocket خام که همون API آشنای socket.io رو
// (connect/disconnect/on/off/emit) شبیه‌سازی می‌کنه — چون بک‌اند الان
// یه Cloudflare Worker + Durable Object با WebSocket ساده‌ست، نه socket.io.
// این یعنی بقیه‌ی کد (App.jsx و useSyncedVideo.js) تقریبا دست‌نخورده می‌مونه.

import { WS_URL } from "./config.js";

class SimpleSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.listeners = new Map();
    this.shouldConnect = false;
    this.sendQueue = [];
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.shouldConnect) return;
    this.shouldConnect = true;
    this._open();
  }

  disconnect() {
    this.shouldConnect = false;
    clearTimeout(this.reconnectTimer);
    this.sendQueue = [];
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
    }
    this.ws = null;
  }

  emit(event, data) {
    const raw = JSON.stringify({ event, data });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
    } else if (this.shouldConnect) {
      // تا وصل شدن، پیام رو نگه می‌داریم (مثلا join درست بعد از connect)
      this.sendQueue.push(raw);
    }
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(cb);
  }

  off(event, cb) {
    this.listeners.get(event)?.delete(cb);
  }

  _open() {
    if (!this.shouldConnect) return;
    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 1000;
      const queued = this.sendQueue;
      this.sendQueue = [];
      for (const raw of queued) ws.send(raw);
      this._emitLocal("connect");
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!msg || !msg.event) return;
      this._emitLocal(msg.event, msg.data);
    };

    ws.onclose = () => {
      this._emitLocal("disconnect");
      if (this.shouldConnect) this._scheduleReconnect();
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }

  _scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this._open(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.6, 10000);
  }

  _emitLocal(event, data) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const socket = new SimpleSocket(WS_URL);
