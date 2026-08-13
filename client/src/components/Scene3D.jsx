import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Room, Bed, Character, TVScreen, NightLamp, Nightstand, triggerEatAnimation } from "./SceneParts.jsx";
import { SnackTray } from "./SnackTray.jsx";

function VideoTextureUpdater({ videoEl, onTexture }) {
  const texRef = useRef(null);

  useEffect(() => {
    if (!videoEl) return;
    const tex = new THREE.VideoTexture(videoEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    texRef.current = tex;
    onTexture(tex);
    return () => tex.dispose();
  }, [videoEl, onTexture]);

  useFrame(() => {
    if (texRef.current) texRef.current.needsUpdate = true;
  });

  return null;
}

function FlyingSnack({ evt, side, onDone }) {
  const ref = useRef();
  const progress = useRef(0);
  const from = side === "left" ? new THREE.Vector3(-0.6, 0.9, 0.3) : new THREE.Vector3(0.6, 0.9, 0.3);
  const to = side === "left" ? new THREE.Vector3(0.6, 0.85, -1) : new THREE.Vector3(-0.6, 0.85, -1);

  useFrame((_, delta) => {
    progress.current += delta * 0.9;
    if (ref.current) {
      const t = Math.min(1, progress.current);
      ref.current.position.lerpVectors(from, to, t);
      ref.current.position.y += Math.sin(t * Math.PI) * 0.35;
      if (t >= 1) onDone();
    }
  });

  return (
    <mesh ref={ref} position={from}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color={"#ffd27a"} emissive={"#ff9d4d"} emissiveIntensity={0.5} />
    </mesh>
  );
}

export default function Scene3D({ videoEl, myName, partnerName, mySide, snackEvents, onSnackAction }) {
  const [videoTexture, setVideoTexture] = useState(null);
  const [flying, setFlying] = useState([]);
  const lastHandled = useRef(0);

  useEffect(() => {
    const fresh = snackEvents.slice(lastHandled.current);
    lastHandled.current = snackEvents.length;
    fresh.forEach((evt) => {
      if (evt.type === "eat") {
        triggerEatAnimation(evt.from === myName ? mySide : mySide === "left" ? "right" : "left");
      } else if (evt.type === "give") {
        const side = evt.from === myName ? mySide : mySide === "left" ? "right" : "left";
        setFlying((f) => [...f, { id: evt.id, side }]);
      }
    });
  }, [snackEvents, myName, mySide]);

  function handleTrayAction(type, snack) {
    onSnackAction(type, snack, type === "give" ? partnerName : myName);
    if (type === "eat") triggerEatAnimation(mySide);
  }

  return (
    <Canvas shadows camera={{ position: [0, 3.6, 6.2], fov: 45 }}>
      <color attach="background" args={["#0d0a1a"]} />
      <fog attach="fog" args={["#0d0a1a", 8, 20]} />

      <ambientLight intensity={0.28} color={"#4a4370"} />
      <directionalLight
        position={[-4, 5, 2]}
        intensity={0.25}
        color={"#8fa8d6"}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Room />
      <Bed>
        <Character side="left" label={mySide === "left" ? myName : partnerName} hairColor="#3a2418" />
        <Character side="right" label={mySide === "right" ? myName : partnerName} hairColor="#171313" />
      </Bed>

      <TVScreen videoTexture={videoTexture} position={[0, 2.6, 5.35]} />
      <VideoTextureUpdater videoEl={videoEl} onTexture={setVideoTexture} />

      <Nightstand position={[-2.6, 0, 0.6]}>
        <NightLamp position={[0, 0, 0]} />
      </Nightstand>
      <Nightstand position={[2.6, 0, 0.6]}>
        <SnackTray position={[0, 0, 0]} partnerName={partnerName} onAction={handleTrayAction} />
      </Nightstand>

      {flying.map((f) => (
        <FlyingSnack key={f.id} evt={f} side={f.side} onDone={() => setFlying((arr) => arr.filter((x) => x.id !== f.id))} />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1.4, -1]}
      />
    </Canvas>
  );
}
