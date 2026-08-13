import * as THREE from "three";

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function woodFloorTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#4a2f22";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#5a3a28" : "#432a1d";
    ctx.fillRect(0, i * 32, 256, 30);
  }
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = "#000";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function wallTexture(baseColor = "#3b2e52") {
  const c = makeCanvas(64, 64);
  const ctx = c.getContext("2d");
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}

export function blanketTexture(color1 = "#c94f6d", color2 = "#a83b57") {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext("2d");
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = color2;
  ctx.lineWidth = 3;
  for (let i = -128; i < 128; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function labelTexture({ bg, text, emoji, fg = "#2b2b2b" }) {
  const c = makeCanvas(128, 160);
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 160);
  ctx.font = "60px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(emoji, 64, 80);
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = fg;
  ctx.fillText(text, 64, 140);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function rugTexture() {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#7b3b52";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#f0d9a8";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 108, 108);
  ctx.strokeStyle = "#d68a9c";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 80, 80);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
