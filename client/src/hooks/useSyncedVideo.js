import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../socket.js";

const DRIFT_TOLERANCE = 1.2; // seconds

export function useSyncedVideo(videoRef) {
  const applyingRemote = useRef(false);
  const [source, setSource] = useState(null); // {url, kind, name}
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [snackEvents, setSnackEvents] = useState([]); // transient feed for 3d scene reactions

  const withGuard = useCallback((fn) => {
    applyingRemote.current = true;
    try {
      fn();
    } finally {
      // release guard on next tick so the resulting play/pause/seeked
      // events we triggered ourselves don't get re-broadcast
      setTimeout(() => (applyingRemote.current = false), 150);
    }
  }, []);

  const resolveSourceUrl = useCallback((s) => {
    if (!s) return null;
    return s.url;
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    function onSourceUpdate(src) {
      setSource(src);
    }

    function onStateSync({ source: src, playback }) {
      setSource(src);
      // wait for the <video> to actually have the src applied (effect below)
      setTimeout(() => {
        const v = videoRef.current;
        if (!v || !src) return;
        withGuard(() => {
          v.currentTime = playback.time || 0;
          if (playback.isPlaying) v.play().catch(() => {});
        });
      }, 300);
    }

    function onVideoAction({ type, time }) {
      const v = videoRef.current;
      if (!v) return;
      withGuard(() => {
        if (type === "play") {
          if (Math.abs(v.currentTime - time) > DRIFT_TOLERANCE) v.currentTime = time;
          v.play().catch(() => {});
        } else if (type === "pause") {
          v.pause();
          if (Math.abs(v.currentTime - time) > 0.15) v.currentTime = time;
        } else if (type === "seek") {
          v.currentTime = time;
        } else if (type === "heartbeat") {
          if (Math.abs(v.currentTime - time) > DRIFT_TOLERANCE) v.currentTime = time;
        }
      });
    }

    function onPresence(list) {
      setPartnerOnline(list.length > 1);
    }

    function onChat(msg) {
      setMessages((m) => [...m, msg]);
    }

    function onSnack(evt) {
      setSnackEvents((s) => [...s.slice(-20), { ...evt, id: Math.random().toString(36).slice(2) }]);
    }

    socket.on("video:source", onSourceUpdate);
    socket.on("state:sync", onStateSync);
    socket.on("video:action", onVideoAction);
    socket.on("presence:update", onPresence);
    socket.on("chat:message", onChat);
    socket.on("snack:action", onSnack);

    return () => {
      socket.off("video:source", onSourceUpdate);
      socket.off("state:sync", onStateSync);
      socket.off("video:action", onVideoAction);
      socket.off("presence:update", onPresence);
      socket.off("chat:message", onChat);
      socket.off("snack:action", onSnack);
    };
  }, [videoRef, withGuard]);

  // wire local <video> DOM events -> broadcast
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      if (applyingRemote.current) return;
      socket.emit("video:action", { type: "play", time: video.currentTime });
    };
    const onPause = () => {
      if (applyingRemote.current) return;
      socket.emit("video:action", { type: "pause", time: video.currentTime });
    };
    const onSeeked = () => {
      if (applyingRemote.current) return;
      socket.emit("video:action", { type: "seek", time: video.currentTime });
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);

    const heartbeat = setInterval(() => {
      if (!video.paused && !video.ended) {
        socket.emit("video:action", { type: "heartbeat", time: video.currentTime });
      }
    }, 4000);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      clearInterval(heartbeat);
    };
  }, [videoRef, source]);

  const setNewSource = useCallback((payload) => {
    socket.emit("video:source", payload);
  }, []);

  const sendChat = useCallback((text) => {
    if (!text.trim()) return;
    socket.emit("chat:message", { text: text.trim() });
  }, []);

  const sendSnack = useCallback((type, snack, to) => {
    socket.emit("snack:action", { type, snack, to });
  }, []);

  return {
    source,
    resolvedUrl: resolveSourceUrl(source),
    partnerOnline,
    messages,
    snackEvents,
    setNewSource,
    sendChat,
    sendSnack,
  };
}
