import React, { useEffect, useRef, useState } from "react";

export default function Chat({ open, messages, onSend, myName, onClose }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div className={`chat-panel ${open ? "chat-panel--open" : ""}`}>
      <div className="chat-panel__header">
        <span>💬 چت</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="chat-panel__list" ref={listRef}>
        {messages.length === 0 && <div className="chat-panel__empty">هنوز پیامی نیست...</div>}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from === myName ? "chat-msg--me" : "chat-msg--them"}`}>
            <div className="chat-msg__author">{m.from}</div>
            <div className="chat-msg__text">{m.text}</div>
          </div>
        ))}
      </div>
      <form className="chat-panel__form" onSubmit={submit}>
        <input
          placeholder="پیام بنویس..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">ارسال</button>
      </form>
    </div>
  );
}
