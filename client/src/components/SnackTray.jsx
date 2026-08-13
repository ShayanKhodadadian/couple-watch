import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import { labelTexture } from "../utils/textures.js";

const SNACK_DEFS = {
  popcorn: { emoji: "🍿", label: "ذرت", bg: "#f2d98b" },
  chips: { emoji: "🍟", label: "چیپس", bg: "#e0a84f" },
  puffs: { emoji: "🧡", label: "پفک", bg: "#e8823a" },
  icecream: { emoji: "🍦", label: "بستنی", bg: "#f7c6d9" },
  pizza: { emoji: "🍕", label: "پیتزا", bg: "#e0432f" },
};

function SnackMesh({ type }) {
  switch (type) {
    case "popcorn":
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.06, 0.16, 12]} />
            <meshStandardMaterial color={"#e23b3b"} />
          </mesh>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.12, 0.1 + Math.random() * 0.04, (Math.random() - 0.5) * 0.12]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color={"#fdf6e3"} roughness={1} />
            </mesh>
          ))}
        </group>
      );
    case "chips":
      return (
        <mesh>
          <boxGeometry args={[0.16, 0.24, 0.05]} />
          <meshStandardMaterial color={"#d4a017"} metalness={0.3} roughness={0.4} />
        </mesh>
      );
    case "puffs":
      return (
        <group>
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.1, i * 0.03, (Math.random() - 0.5) * 0.1]} rotation={[Math.random(), Math.random(), 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.09, 6]} />
              <meshStandardMaterial color={"#e8823a"} roughness={1} />
            </mesh>
          ))}
        </group>
      );
    case "icecream":
      return (
        <group>
          <mesh position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.07, 0.16, 12]} />
            <meshStandardMaterial color={"#c98a4b"} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color={"#f9c9d9"} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={"#fdf1e6"} />
          </mesh>
        </group>
      );
    case "pizza":
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.14, 0.05, 3]} />
          <meshStandardMaterial color={"#e8b13a"} />
        </mesh>
      );
    default:
      return null;
  }
}

function SnackMenu({ position, snackType, partnerName, onEat, onGive, onCloseRequest }) {
  return (
    <Html position={position} center distanceFactor={6} zIndexRange={[100, 0]}>
      <div className="snack-menu" onPointerDown={(e) => e.stopPropagation()}>
        <div className="snack-menu__title">
          {SNACK_DEFS[snackType].emoji} {SNACK_DEFS[snackType].label}
        </div>
        <button onClick={onEat}>خودم می‌خورم 😋</button>
        <button onClick={onGive}>بده به {partnerName} 💞</button>
        <button className="snack-menu__close" onClick={onCloseRequest}>بستن</button>
      </div>
    </Html>
  );
}

export function Snack({ type, position, partnerName, onAction }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + position[0] * 10) * 0.005;
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setMenuOpen((o) => !o);
      }}
      scale={hovered ? 1.15 : 1}
    >
      <SnackMesh type={type} />
      {menuOpen && (
        <SnackMenu
          position={[0, 0.3, 0]}
          snackType={type}
          partnerName={partnerName}
          onEat={() => {
            onAction("eat", type);
            setMenuOpen(false);
          }}
          onGive={() => {
            onAction("give", type);
            setMenuOpen(false);
          }}
          onCloseRequest={() => setMenuOpen(false)}
        />
      )}
    </group>
  );
}

export function SnackTray({ position = [0, 0, 0], partnerName, onAction }) {
  const layout = useMemo(
    () => [
      { type: "popcorn", pos: [-0.15, 0.03, -0.1] },
      { type: "chips", pos: [0.15, 0.03, -0.1] },
      { type: "puffs", pos: [-0.15, 0.02, 0.12] },
      { type: "icecream", pos: [0.15, 0.06, 0.12] },
      { type: "pizza", pos: [0, 0.02, 0.28] },
    ],
    []
  );

  return (
    <group position={position}>
      <RoundedBox args={[0.55, 0.02, 0.6]} radius={0.02} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={"#8a6a3d"} roughness={0.6} />
      </RoundedBox>
      {layout.map((s) => (
        <Snack key={s.type} type={s.type} position={s.pos} partnerName={partnerName} onAction={onAction} />
      ))}
    </group>
  );
}

export { SNACK_DEFS };
