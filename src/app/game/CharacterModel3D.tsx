"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Per-character 3D meshes ───────────────────────────────────────────────
interface CharProps {
  color: string;
  glow: string;
  specialActive: boolean;
  charId: string;
}

function PepeModel({ color, glow, specialActive }: CharProps) {
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (headRef.current) headRef.current.rotation.y += d * 0.6;
    if (eyeLRef.current) eyeLRef.current.position.y = 0.22 + Math.sin(Date.now() * 0.003) * 0.03;
    if (eyeRRef.current) eyeRRef.current.position.y = 0.22 + Math.sin(Date.now() * 0.003 + 1) * 0.03;
  });
  return (
    <group ref={headRef}>
      {/* Main head */}
      <mesh castShadow>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} emissive={specialActive ? color : "#000"} emissiveIntensity={specialActive ? 0.4 : 0} />
      </mesh>
      {/* Left eye white */}
      <mesh ref={eyeLRef} position={[-0.28, 0.22, 0.65]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Right eye white */}
      <mesh ref={eyeRRef} position={[0.28, 0.22, 0.65]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Left pupil */}
      <mesh position={[-0.28, 0.2, 0.83]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* Right pupil */}
      <mesh position={[0.28, 0.2, 0.83]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.28, 0.68]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.22, 0.05, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#1a6b1a" />
      </mesh>
      {/* Blush cheeks */}
      <mesh position={[-0.52, 0.05, 0.56]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#ff7070" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.52, 0.05, 0.56]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#ff7070" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function GigachadModel({ color, specialActive }: CharProps) {
  const bodyRef = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (bodyRef.current) bodyRef.current.rotation.y += d * 0.5;
  });
  return (
    <group ref={bodyRef}>
      {/* Head */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.7, 0.75, 0.65]} />
        <meshStandardMaterial color="#e8c87a" roughness={0.2} metalness={0.3} emissive={specialActive ? "#ffcc44" : "#000"} emissiveIntensity={specialActive ? 0.4 : 0} />
      </mesh>
      {/* Jaw extension */}
      <mesh position={[0, 0.28, 0.05]}>
        <boxGeometry args={[0.64, 0.22, 0.6]} />
        <meshStandardMaterial color="#d4a860" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[-0.7, -0.05, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[0.7, -0.05, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.18, 0.68, 0.34]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.18, 0.68, 0.34]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function TrumpModel({ color, specialActive }: CharProps) {
  const bodyRef = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (bodyRef.current) bodyRef.current.rotation.y += d * 0.45;
  });
  return (
    <group ref={bodyRef}>
      {/* Hair */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[0.78, 0.3, 0.6]} />
        <meshStandardMaterial color="#f5c842" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.46, 24, 24]} />
        <meshStandardMaterial color="#e8a87c" roughness={0.4} emissive={specialActive ? "#ff6622" : "#000"} emissiveIntensity={specialActive ? 0.3 : 0} />
      </mesh>
      {/* Suit body */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.95, 0.85, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.4} />
      </mesh>
      {/* Tie */}
      <mesh position={[0, -0.12, 0.27]}>
        <boxGeometry args={[0.15, 0.7, 0.05]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.17, 0.68, 0.44]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#334" />
      </mesh>
      <mesh position={[0.17, 0.68, 0.44]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#334" />
      </mesh>
    </group>
  );
}

function TrollModel({ color, specialActive }: CharProps) {
  const bodyRef = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (bodyRef.current) bodyRef.current.rotation.y += d * 0.8;
  });
  return (
    <group ref={bodyRef}>
      {/* Distorted head shape */}
      <mesh position={[0, 0.4, 0]} rotation={[0.1, 0, 0.05]} castShadow>
        <sphereGeometry args={[0.76, 24, 16]} />
        <meshStandardMaterial color="#c8a0c8" roughness={0.5} emissive={specialActive ? color : "#000"} emissiveIntensity={specialActive ? 0.5 : 0} />
      </mesh>
      {/* Smug brow */}
      <mesh position={[-0.22, 0.65, 0.64]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.28, 0.1, 0.1]} />
        <meshStandardMaterial color="#7a507a" />
      </mesh>
      <mesh position={[0.22, 0.65, 0.64]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.28, 0.1, 0.1]} />
        <meshStandardMaterial color="#7a507a" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.24, 0.42, 0.68]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.24, 0.42, 0.68]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.24, 0.4, 0.8]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.24, 0.4, 0.8]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Smug smile */}
      <mesh position={[0.1, 0.08, 0.7]} rotation={[0.1, 0, 0.2]}>
        <torusGeometry args={[0.25, 0.06, 8, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color="#7a507a" />
      </mesh>
    </group>
  );
}

function BonkModel({ color, specialActive }: CharProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (bodyRef.current) bodyRef.current.rotation.y += 0.007;
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.5;
  });
  return (
    <group ref={bodyRef}>
      {/* Body */}
      <mesh position={[0, -0.15, 0]}>
        <capsuleGeometry args={[0.4, 0.5, 16, 32]} />
        <meshStandardMaterial color={color} roughness={0.6} emissive={specialActive ? color : "#000"} emissiveIntensity={specialActive ? 0.3 : 0} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.62, 0.1]}>
        <sphereGeometry args={[0.46, 24, 24]} />
        <meshStandardMaterial color="#f0a060" roughness={0.5} />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.48, 0.5]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#cc8844" roughness={0.6} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.55, 0.7]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.34, 1.0, 0.1]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.18, 0.34, 12]} />
        <meshStandardMaterial color="#f0a060" roughness={0.5} />
      </mesh>
      <mesh position={[0.34, 1.0, 0.1]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.18, 0.34, 12]} />
        <meshStandardMaterial color="#f0a060" roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.2, 0.7, 0.52]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.2, 0.7, 0.52]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Tail */}
      <mesh ref={tailRef} position={[-0.05, -0.3, -0.5]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.4, 8, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Floating particles around model ──────────────────────────────────────────
function FloatingParticles({ color, active }: { color: string; active: boolean }) {
  const count = 20;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 3.5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });
  if (!active) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.06} transparent opacity={0.8} />
    </points>
  );
}

// ─── Scene wrapper ─────────────────────────────────────────────────────────
function Scene({ charId, color, glow, specialActive }: { charId: string; color: string; glow: string; specialActive: boolean }) {
  const props: CharProps = { color, glow, specialActive, charId };
  const Model = charId === "pepe" ? PepeModel
    : charId === "gigachad" ? GigachadModel
    : charId === "trump" ? TrumpModel
    : charId === "troll" ? TrollModel
    : BonkModel;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <pointLight position={[-3, 2, 2]} intensity={0.8} color={color} />
      <pointLight position={[3, -2, 2]} intensity={specialActive ? 1.5 : 0.4} color={color} />
      <Model {...props} />
      <FloatingParticles color={color} active={specialActive} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        rotateSpeed={1.2}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
    </>
  );
}

// ─── Exported component ────────────────────────────────────────────────────
export default function CharacterModel3D({
  charId, color, glow, specialActive, onTap,
}: {
  charId: string; color: string; glow: string; specialActive: boolean; onTap: (e: React.MouseEvent | React.TouchEvent) => void;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", cursor: "grab" }}>
      {/* Canvas */}
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.3, 2.8], fov: 50 }}
        shadows
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <Scene charId={charId} color={color} glow={glow} specialActive={specialActive} />
      </Canvas>

      {/* Invisible tap overlay on top so tapping still works */}
      <div
        onMouseDown={onTap}
        onTouchStart={onTap}
        style={{ position: "absolute", inset: 0, zIndex: 5, background: "transparent", cursor: "crosshair" }}
        title="Tap to earn!"
      />
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(255,255,255,0.25)", pointerEvents: "none", whiteSpace: "nowrap" }}>
        drag to rotate
      </div>
    </div>
  );
}
