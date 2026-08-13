import React, { useState } from "react";
import { HTTP_URL, PROXY_KEY } from "../config.js";

// همه‌ی لینک‌ها (لینک مستقیم mp4/m3u8، یا لینک اشتراک‌گذاری گوگل درایو با هر
// فرمتی) از این تابع رد می‌شن و به یه لینک /video-proxy روی خود Worker
// تبدیل می‌شن. چون پخش و بافت سه‌بعدی هر دو از همین لینک استفاده می‌کنن،
// دیگه فرقی نمی‌کنه سرور اصلی ویدیو هدر CORS بده یا نه — مرورگر فقط با
// Worker خودمون حرف می‌زنه که همیشه هدرش رو درست می‌ده.
function toProxied(rawUrl) {
  const params = new URLSearchParams({ url: rawUrl });
  if (PROXY_KEY) params.set("key", PROXY_KEY);
  return `${HTTP_URL}/video-proxy?${params.toString()}`;
}

export default function UploadPanel({ onClose, onSetSource }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  function handleUrlSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("vlc://") || trimmed.startsWith("vlc-x-callback://")) {
      // این یه برنامه‌ی جدا (VLC) رو روی سیستم عامل باز می‌کنه که مرورگر
      // هیچ کنترلی روش نداره — نه پلی/پاز، نه سیک، نه سینک.
      window.location.href = trimmed;
      setError(
        "لینک vlc:// یه برنامه‌ی جدا رو باز می‌کنه که مرورگر کنترلی روش نداره، پس این حالت قابل سینک‌شدن نیست. یه لینک مستقیم یا لینک گوگل‌درایو بده."
      );
      return;
    }

    const proxiedUrl = toProxied(trimmed);
    onSetSource({ url: proxiedUrl, kind: "url", name: trimmed });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card__header">
          <h2>چی ببینیم؟ 🍿</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleUrlSubmit} className="url-form">
          <input
            type="text"
            autoFocus
            placeholder="لینک گوگل‌درایو، یا هر لینک مستقیم ویدیو (mp4, webm, m3u8...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit">پخش کن</button>
        </form>

        {error && <div className="modal-error">{error}</div>}

        <button
          type="button"
          className="modal-help-toggle"
          onClick={() => setShowHelp((s) => !s)}
        >
          {showHelp ? "بستن راهنما ▲" : "چه لینکی جواب می‌ده؟ ▼"}
        </button>

        {showHelp && (
          <div className="modal-help">
            <p>
              دیگه لازم نیست خودت لینک رو دستی تبدیل کنی — همه‌ی لینک‌ها از
              یه واسطه (Worker خودمون) رد می‌شن که هم مشکل CORS رو حل می‌کنه
              هم لینک گوگل‌درایو رو خودش به فرمت قابل‌پخش تبدیل می‌کنه:
            </p>
            <ul>
              <li>
                لینک اشتراک‌گذاری گوگل‌درایو رو همون‌طوری که Share می‌ده
                بچسبون، مثلاً:{" "}
                <code>https://drive.google.com/file/d/FILE_ID/view?usp=sharing</code>
              </li>
              <li>یا هر لینک مستقیم mp4/webm</li>
              <li>یا یه لینک استریم m3u8</li>
            </ul>
            <p>
              نکته‌ی گوگل‌درایو: برای فایل‌های خیلی حجیم، خود گوگل گاهی
              محدودیت دانلود روزانه می‌ذاره؛ اگه یه لینک درایو ناگهان از کار
              افتاد، چند ساعت بعد یا فردا دوباره امتحان کن.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
