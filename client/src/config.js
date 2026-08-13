// آدرس Cloudflare Worker (بک‌اند). موقع build ست کن:
//   VITE_WORKER_URL=https://couple-watch-party.YOUR-SUBDOMAIN.workers.dev npm run build
// برای توسعه‌ی محلی، پیش‌فرض به wrangler dev (پورت 8787) وصل می‌شه.
const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

// http(s) -> ws(s) و اضافه کردن مسیر /ws که Durable Object بهش گوش می‌ده
export const WS_URL = WORKER_URL.replace(/^http/, "ws").replace(/\/+$/, "") + "/ws";
