import React, { useEffect, useState } from "react";

function formatTime(t) {
  if (!isFinite(t)) return "00:00";
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ControlsBar({
  videoRef,
  isFullscreen,
  onToggleFullscreen,
  onToggleChat,
  onChangeVideo,
  partnerOnline,
  partnerName,
}) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [videoRef]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function seek(e) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  }

  return (
    <div className={`controls-bar ${isFullscreen ? "controls-bar--overlay" : ""}`}>
      <button className="control-btn" onClick={togglePlay} title={playing ? "پاز" : "پلی"}>
        {playing ? "⏸️" : "▶️"}
      </button>

      <span className="controls-bar__time">{formatTime(current)}</span>
      <input
        className="controls-bar__seek"
        type="range"
        min={0}
        max={duration || 0}
        step={0.5}
        value={current}
        onChange={seek}
      />
      <span className="controls-bar__time">{formatTime(duration)}</span>

      <div className="controls-bar__status" title={partnerOnline ? `${partnerName} آنلاینه` : `${partnerName} آفلاینه`}>
        <span className={`dot ${partnerOnline ? "dot--online" : "dot--offline"}`} />
      </div>

      <button className="control-btn" onClick={onChangeVideo} title="عوض کردن فیلم">🎞️</button>
      <button className="control-btn" onClick={onToggleChat} title="چت">💬</button>
      <button className="control-btn" onClick={onToggleFullscreen} title="تمام صفحه">
        {isFullscreen ? "🛏️" : "⛶"}
      </button>
    </div>
  );
}
