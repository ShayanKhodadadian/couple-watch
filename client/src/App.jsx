import React, { useEffect, useRef, useState } from "react";
import { socket } from "./socket.js";
import DeviceSelect from "./components/DeviceSelect.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import Chat from "./components/Chat.jsx";
import ControlsBar from "./components/ControlsBar.jsx";
import Scene3D from "./components/Scene3D.jsx";
import { useSyncedVideo } from "./hooks/useSyncedVideo.js";

const PARTNER_OF = { Melissa: "Shayan", Shayan: "Melissa" };
const SIDE_OF = { Melissa: "left", Shayan: "right" };

export default function App() {
  const [device, setDevice] = useState(() => localStorage.getItem("cwp:device") || "");
  const [showUpload, setShowUpload] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef(null);
  const [videoNode, setVideoNode] = useState(null);
  const {
    source,
    resolvedUrl,
    partnerOnline,
    messages,
    snackEvents,
    setNewSource,
    sendChat,
    sendSnack,
  } = useSyncedVideo(videoRef);

  useEffect(() => {
    setVideoNode(videoRef.current);
  }, []);

  // connect socket once a device is chosen — و هر بار که دوباره وصل شد
  // (مثلا بعد از قطعی شبکه) join رو دوباره می‌فرستیم تا وضعیت رو سینک کنیم
  useEffect(() => {
    if (!device) return;
    const sendJoin = () => socket.emit("join", { device });
    socket.on("connect", sendJoin);
    socket.connect();
    return () => {
      socket.off("connect", sendJoin);
      socket.disconnect();
    };
  }, [device]);

  // apply source url to the actual <video> element
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !resolvedUrl) return;
    if (v.src !== resolvedUrl) {
      v.src = resolvedUrl;
      v.load();
    }
  }, [resolvedUrl]);

  function chooseDevice(name) {
    localStorage.setItem("cwp:device", name);
    setDevice(name);
  }

  if (!device) {
    return <DeviceSelect onSelect={chooseDevice} />;
  }

  const partnerName = PARTNER_OF[device];
  const mySide = SIDE_OF[device];

  return (
    <div className="app">
      {/* Shared, always-mounted video element. In 3D mode it's visually
          hidden (used only as a texture source); in fullscreen mode it's
          shown directly. Never unmounted, so playback state is preserved
          and there is exactly one source of truth for the video. */}
      <video
        ref={videoRef}
        className={fullscreen ? "app-video app-video--fullscreen" : "app-video app-video--hidden"}
        crossOrigin="anonymous"
        playsInline
        onLoadedData={() => setVideoReady(true)}
      />

      {!fullscreen && (
        <Scene3D
          videoEl={videoNode}
          myName={device}
          partnerName={partnerName}
          mySide={mySide}
          snackEvents={snackEvents}
          onSnackAction={(type, snack, to) => sendSnack(type, snack, to)}
        />
      )}

      {!source && !fullscreen && (
        <div className="empty-hint" onClick={() => setShowUpload(true)}>
          <div>هنوز فیلمی انتخاب نشده 🎬</div>
          <div className="empty-hint__cta">برای انتخاب فیلم کلیک کن</div>
        </div>
      )}

      <div className="app__header">
        <span className="app__brand">🎬 Movie Night</span>
        <span className="app__me">شما: {device === "Melissa" ? "ملیسا 👩" : "شایان 🧑"}</span>
      </div>

      <ControlsBar
        videoRef={videoRef}
        isFullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((f) => !f)}
        onToggleChat={() => setChatOpen((c) => !c)}
        onChangeVideo={() => setShowUpload(true)}
        partnerOnline={partnerOnline}
        partnerName={partnerName}
      />

      <Chat
        open={chatOpen}
        messages={messages}
        onSend={sendChat}
        myName={device}
        onClose={() => setChatOpen(false)}
      />

      {showUpload && (
        <UploadPanel onClose={() => setShowUpload(false)} onSetSource={setNewSource} />
      )}
    </div>
  );
}
