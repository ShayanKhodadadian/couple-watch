import React, { useState } from "react";

// نکته‌ی مهم: چون این نسخه کاملا رایگان و بدون کارت بانکی روی Cloudflare
// Workers اجرا می‌شه، سرور جایی برای ذخیره‌ی دائمیِ فایل ویدیو نداره (سرویس
// آبجکت‌استوریج Cloudflare یعنی R2، حتی توی پلن رایگانش هم اضافه کردن کارت
// بانکی رو لازم داره). به همین خاطر راه پخش، دادن «لینک مستقیم» به یه فایل
// ویدیوئه، نه آپلود روی این سرور. لینک می‌تونه از هرجایی باشه: یه فایل mp4
// که جایی آپلودش کردی (مثلا Google Drive با لینک مستقیم، یا هر هاست رایگان
// دیگه) یا یه استریم m3u8.

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
        "لینک vlc:// یه برنامه‌ی جدا رو باز می‌کنه که مرورگر کنترلی روش نداره، پس این حالت قابل سینک‌شدن نیست. برای پخش سینک، یه لینک مستقیم mp4/webm/m3u8 بده."
      );
      return;
    }

    onSetSource({ url: trimmed, kind: "url", name: trimmed });
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
            placeholder="لینک مستقیم ویدیو (mp4, webm, m3u8...)"
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
          {showHelp ? "بستن راهنما ▲" : "لینک مستقیم از کجا بیارم؟ ▼"}
        </button>

        {showHelp && (
          <div className="modal-help">
            <p>
              این سایت روی Cloudflare Workers رایگان اجراست، پس خودش جایی
              برای ذخیره‌ی فایل ویدیو نداره — فقط پخش رو بین دو نفر سینک
              می‌کنه. باید یه لینک مستقیم بهش بدی:
            </p>
            <ul>
              <li>یه فایل روی Google Drive آپلود کن، Share → Anyone with link، بعد آیدی فایل رو از لینکش بردار و توی این قالب بذار: <code>https://drive.google.com/uc?export=download&id=FILE_ID</code></li>
              <li>یا از یه هاست ویدیوی رایگان که لینک مستقیم mp4 می‌ده استفاده کن</li>
              <li>یا اگه فیلم از قبل یه لینک استریم (m3u8) داره، همون رو بده</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
