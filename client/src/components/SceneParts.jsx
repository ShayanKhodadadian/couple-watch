import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import { woodFloorTexture, wallTexture, blanketTexture, rugTexture, labelTexture } from "../utils/textures.js";

export function Room() {
  const floorTex = useMemo(() => woodFloorTexture(), []);
  const wallTex = useMemo(() => wallTexture("#2c2440"), []);
  const rugTex = useMemo(() => rugTexture(), []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} />
      </mesh>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.6]} receiveShadow>
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial map={rugTex} roughness={1} />
      </mesh>

      {/* Back wall (behind bed) */}
      <mesh position={[0, 3, -3.4]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial map={wallTex} roughness={1} />
      </mesh>

      {/* Front wall (TV wall) */}
      <mesh position={[0, 3, 5.6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial map={wallTex} roughness={1} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-6.9, 3, 1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial map={wallTex} roughness={1} />
      </mesh>
      <mesh position={[6.9, 3, 1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial map={wallTex} roughness={1} />
      </mesh>

      {/* Window with moonlight */}
      <mesh position={[-6.85, 3.3, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 2.2]} />
        <meshBasicMaterial color={"#8fa8d6"} />
      </mesh>
      <mesh position={[-6.8, 3.3, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2, 2.4]} />
        <meshStandardMaterial color={"#1b1730"} />
      </mesh>
    </group>
  );
}

export function TVScreen({ videoTexture, position = [0, 2.6, 5.35] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* frame */}
      <mesh castShadow>
        <boxGeometry args={[4.4, 2.6, 0.12]} />
        <meshStandardMaterial color={"#111"} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[4.1, 2.3]} />
        {videoTexture ? (
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color={"#0a0f1e"} />
        )}
      </mesh>
      {/* soft glow from screen */}
      <pointLight color={"#6ea8ff"} intensity={2.2} distance={7} position={[0, 0, 1.5]} />
      {/* wall mount bar */}
      <mesh position={[0, -1.5, -0.2]}>
        <boxGeometry args={[0.3, 0.8, 0.1]} />
        <meshStandardMaterial color={"#222"} />
      </mesh>
    </group>
  );
}

function Pillow({ position, color = "#f4ede1" }) {
  return (
    <RoundedBox args={[1, 0.28, 0.65]} radius={0.12} smoothness={4} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} />
    </RoundedBox>
  );
}

export function Bed({ children }) {
  const blanketTex = useMemo(() => blanketTexture(), []);

  return (
    <group position={[0, 0, 1.4]}>
      {/* bed frame legs */}
      {[[-1.9, 0.15, -1.7], [1.9, 0.15, -1.7], [-1.9, 0.15, 1.7], [1.9, 0.15, 1.7]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial color={"#3a2a1e"} />
        </mesh>
      ))}
      {/* base frame */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.25, 3.7]} />
        <meshStandardMaterial color={"#4a3626"} roughness={0.7} />
      </mesh>
      {/* headboard */}
      <RoundedBox args={[4.2, 1.4, 0.2]} radius={0.08} position={[0, 1.1, -1.85]} castShadow receiveShadow>
        <meshStandardMaterial color={"#5a3f52"} roughness={0.6} />
      </RoundedBox>
      {/* mattress */}
      <RoundedBox args={[3.9, 0.35, 3.4]} radius={0.1} position={[0, 0.62, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={"#efe6d8"} roughness={0.95} />
      </RoundedBox>
      {/* pillows */}
      <Pillow position={[-0.95, 0.9, -1.35]} color={"#f7e3e9"} />
      <Pillow position={[0.95, 0.9, -1.35]} color={"#e3edf7"} />
      {/* blanket covering the lower/middle part of the bed */}
      <RoundedBox args={[3.85, 0.32, 2.6]} radius={0.15} position={[0, 0.86, 0.35]} castShadow receiveShadow>
        <meshStandardMaterial map={blanketTex} roughness={1} />
      </RoundedBox>

      {children}
    </group>
  );
}

/**
 * A simplified, cozy character: head + shoulders poking out from under the
 * blanket, lying on a pillow and facing the TV. Kept stylized/low-poly on
 * purpose so it reads as a cute avatar rather than attempting photorealism.
 */
export function Character({ side = "left", hairColor = "#3a2418", skinColor = "#e8b98f", label }) {
  const x = side === "left" ? -0.95 : 0.95;
  const bounceRef = useRef();
  const [bounce, setBounce] = useState(0);

  useFrame((_, delta) => {
    if (bounceRef.current && bounce > 0) {
      bounceRef.current.scale.setScalar(1 + Math.sin(bounce * 12) * 0.05);
      setBounce((b) => Math.max(0, b - delta * 2));
    } else if (bounceRef.current) {
      bounceRef.current.scale.setScalar(1);
    }
  });

  // expose a tiny imperative trigger via DOM event (simplest cross-component signal)
  React.useEffect(() => {
    function onEat(e) {
      if (e.detail?.side === side) setBounce(1);
    }
    window.addEventListener("character:eat", onEat);
    return () => window.removeEventListener("character:eat", onEat);
  }, [side]);

  return (
    <group position={[x, 0.78, -1.1]} rotation={[0, side === "left" ? -0.15 : 0.15, 0]} ref={bounceRef}>
      {/* head */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.85} />
      </mesh>
      {/* hair */}
      <mesh castShadow position={[0, 0.36, -0.05]}>
        <sphereGeometry args={[0.25, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      {/* shoulder / body bump under blanket */}
      <RoundedBox args={[0.55, 0.28, 0.6]} radius={0.14} position={[0, 0.02, 0.15]} castShadow>
        <meshStandardMaterial color={"#efe6d8"} roughness={0.9} />
      </RoundedBox>

      {label && (
        <Html position={[0, 0.65, 0]} center distanceFactor={8} occlude>
          <div className="scene-label">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function triggerEatAnimation(side) {
  window.dispatchEvent(new CustomEvent("character:eat", { detail: { side } }));
}

export function NightLamp({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.06, 0.5, 12]} />
        <meshStandardMaterial color={"#caa46a"} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.22, 0.28, 16, 1, true]} />
        <meshStandardMaterial color={"#f3d9a0"} side={THREE.DoubleSide} emissive={"#e0a94c"} emissiveIntensity={0.4} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color={"#ffb877"} intensity={1.1} distance={3.5} decay={2} castShadow />
    </group>
  );
}

export function Nightstand({ position, children }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.55, 0.5]} radius={0.04} position={[0, 0.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={"#4a3626"} roughness={0.6} />
      </RoundedBox>
      <group position={[0, 0.56, 0]}>{children}</group>
    </group>
  );
}
