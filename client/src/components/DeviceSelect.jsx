import React from "react";

export default function DeviceSelect({ onSelect }) {
  return (
    <div className="device-select">
      <div className="device-select__bg" />
      <div className="device-select__card">
        <div className="device-select__title">🎬 موزی نایت</div>
        <div className="device-select__subtitle">این دستگاه مال کیه؟</div>
        <div className="device-select__options">
          <button className="device-btn device-btn--melissa" onClick={() => onSelect("Melissa")}>
            <span className="device-btn__emoji">👩</span>
            <span>این دستگاه ملیسا است</span>
          </button>
          <button className="device-btn device-btn--shayan" onClick={() => onSelect("Shayan")}>
            <span className="device-btn__emoji">🧑</span>
            <span>این دستگاه شایان است</span>
          </button>
        </div>
        <div className="device-select__hint">انتخابت رو یادم می‌مونه، دفعه‌ی بعد نمی‌پرسم 💛</div>
      </div>
    </div>
  );
}
