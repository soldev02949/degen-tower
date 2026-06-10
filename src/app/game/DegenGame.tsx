"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────
//  Character definitions
// ─────────────────────────────────────────────
const CHARACTERS = [
  { id: "pepe",     name: "Pepe",      emoji: "🐸", color: 0x4caf50, accentColor: 0x2e7d32, speed: 12, special: "Feels Good Man",   texture: "/characters/pepe.png"     },
  { id: "gigachad", name: "Gigachad",  emoji: "💪", color: 0xe0b87a, accentColor: 0x8d6e3f, speed: 10, special: "Sigma Smash",      texture: "/characters/gigachad.png" },
  { id: "trump",    name: "Trump",     emoji: "🎩", color: 0x1a3a6e, accentColor: 0xd32f2f, speed: 9,  special: "Build the Tower",  texture: "/characters/trump.png"    },
  { id: "troll",    name: "Trollface", emoji: "🧌", color: 0x888888, accentColor: 0x222222, speed: 13, special: "U Mad Bro?",       texture: "/characters/troll.png"    },
  { id: "bonk",     name: "Bonk",      emoji: "🐕", color: 0xe8853a, accentColor: 0xc0611a, speed: 14, special: "BONK!",           texture: "/characters/bonk.png"     },
];

interface Props {
  onBack: () => void;
}

export default function DegenGame({ onBack }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [floor, setFloor] = useState(1);
  const [specialReady, setSpecialReady] = useState(true);

  const startGame = useCallback((charId: string) => {
    setSelectedChar(charId);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    if (!gameStarted || !mountRef.current || !selectedChar) return;
    const char = CHARACTERS.find(c => c.id === selectedChar)!;
    const engine = new GameEngine(mountRef.current, char, {
      onScoreChange: setScore,
      onHealthChange: setHealth,
      onFloorChange: setFloor,
      onSpecialReady: setSpecialReady,
    });
    gameRef.current = engine;
    engine.start();
    return () => engine.destroy();
  }, [gameStarted, selectedChar]);

  const triggerSpecial = useCallback(() => {
    if (gameRef.current && specialReady) {
      gameRef.current.triggerSpecial();
      setSpecialReady(false);
      setTimeout(() => setSpecialReady(true), 8000);
    }
  }, [specialReady]);

  if (!gameStarted) {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'SF Pro', sans-serif", color: "#fff", padding: "20px",
      }}>
        <button onClick={onBack} style={{
          position: "absolute", top: 24, left: 24,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 14,
        }}>← Back</button>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏙️</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
            DEGEN ARENA
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Choose your fighter. Own the streets of LA.</p>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
          {CHARACTERS.map(char => (
            <div
              key={char.id}
              onClick={() => startGame(char.id)}
              style={{
                width: 160, background: "rgba(255,255,255,0.05)",
                border: "2px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "20px 16px", cursor: "pointer",
                textAlign: "center", transition: "all 0.2s",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = `2px solid #f5c842`;
                el.style.background = "rgba(245,200,66,0.08)";
                el.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = "2px solid rgba(255,255,255,0.1)";
                el.style.background = "rgba(255,255,255,0.05)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Character portrait */}
              <div style={{
                width: 100, height: 100, margin: "0 auto 12px",
                borderRadius: "50%", overflow: "hidden",
                border: `3px solid #${char.color.toString(16)}`,
                background: `#${char.color.toString(16)}22`,
              }}>
                <img src={char.texture} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{char.emoji} {char.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>SPEED: {char.speed}</div>
              <div style={{
                background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)",
                borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#f5c842", fontWeight: 600,
              }}>
                ⚡ {char.special}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 32, color: "#64748b", fontSize: 13 }}>
          <span>WASD / Arrow Keys — Move</span>
          <span>Space — Jump</span>
          <span>E — Attack</span>
          <span>Q — Special</span>
        </div>
      </div>
    );
  }

  const charData = CHARACTERS.find(c => c.id === selectedChar)!;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#0a0a0f" }}>
      {/* Game canvas */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "16px 20px", pointerEvents: "none",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        {/* Left: Health */}
        <div style={{ pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `#${charData.color.toString(16).padStart(6,'0')}33`,
              border: `2px solid #${charData.color.toString(16).padStart(6,'0')}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>{charData.emoji}</div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{charData.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 140, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${health}%`, height: "100%", background: health > 50 ? "#22d67a" : health > 25 ? "#f5c842" : "#ef4444", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{health}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Score + Floor */}
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Score</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f5c842", lineHeight: 1 }}>{score.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Floor {floor}</div>
        </div>

        {/* Right: Back */}
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13,
            pointerEvents: "all",
          }}
        >← Menu</button>
      </div>

      {/* Bottom HUD: Special ability */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Special [Q]</div>
          <button
            onClick={triggerSpecial}
            disabled={!specialReady}
            style={{
              background: specialReady ? "rgba(245,200,66,0.15)" : "rgba(255,255,255,0.05)",
              border: `2px solid ${specialReady ? "#f5c842" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, padding: "10px 24px",
              color: specialReady ? "#f5c842" : "#64748b",
              fontWeight: 700, fontSize: 14, cursor: specialReady ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            ⚡ {charData.special} {!specialReady ? "(Cooldown)" : ""}
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 24, right: 20,
        fontSize: 11, color: "#334155", lineHeight: 1.8,
        textAlign: "right",
      }}>
        <div>WASD — Move</div>
        <div>Space — Jump</div>
        <div>E — Attack</div>
        <div>Q — Special</div>
        <div>Mouse — Camera</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GAME ENGINE
// ─────────────────────────────────────────────
interface CharDef {
  id: string; name: string; emoji: string;
  color: number; accentColor: number;
  speed: number; special: string; texture: string;
}
interface GameCallbacks {
  onScoreChange: (n: number) => void;
  onHealthChange: (n: number) => void;
  onFloorChange: (n: number) => void;
  onSpecialReady: (b: boolean) => void;
}

class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private player!: THREE.Group;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private keys: Record<string, boolean> = {};
  private mouseX = 0;
  private mouseY = 0;
  private isDragging = false;
  private cameraAngle = 0;
  private cameraPitch = 0.3;
  private cameraDistance = 14;
  private velocity = new THREE.Vector3();
  private isGrounded = false;
  private score = 0;
  private health = 100;
  private floor = 1;
  private enemies: THREE.Group[] = [];
  private particles: THREE.Points[] = [];
  private animFrame = 0;
  private char: CharDef;
  private callbacks: GameCallbacks;
  private container: HTMLDivElement;
  private audioCtx!: AudioContext;
  private buildings: THREE.Mesh[] = [];
  private walkCycle = 0;
  private isAttacking = false;
  private attackCooldown = 0;
  private charTexture!: THREE.Texture;
  private spawnTimer = 0;
  private neons: THREE.Mesh[] = [];
  private lastTime = 0;

  constructor(container: HTMLDivElement, char: CharDef, callbacks: GameCallbacks) {
    this.container = container;
    this.char = char;
    this.callbacks = callbacks;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.018);
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);

    this.setupAudio();
    this.buildWorld();
    this.buildPlayer();
    this.spawnEnemies(3);
    this.bindEvents();
  }

  private setupAudio() {
    try {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.startBackgroundMusic();
    } catch { /* no audio */ }
  }

  private startBackgroundMusic() {
    try {
      const audio = new Audio("/game-music.mp3");
      audio.loop = true;
      audio.volume = 0.35;
      audio.play().catch(() => {
        // Autoplay blocked — resume on first user interaction
        const resume = () => { audio.play(); document.removeEventListener("click", resume); document.removeEventListener("keydown", resume); };
        document.addEventListener("click", resume, { once: true });
        document.addEventListener("keydown", resume, { once: true });
      });
    } catch { /* ignore */ }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "square", vol = 0.1) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.start(); osc.stop(this.audioCtx.currentTime + duration);
    } catch { /* ignore */ }
  }

  private buildWorld() {
    // Ambient + directional lights
    const ambient = new THREE.AmbientLight(0x1a1a2e, 2);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xff6b35, 3);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    this.scene.add(sun);

    // Neon fill lights
    const neonColors = [0xff0080, 0x00ffff, 0xf5c842, 0x8b00ff];
    neonColors.forEach((c, i) => {
      const light = new THREE.PointLight(c, 3, 40);
      light.position.set(Math.cos(i * Math.PI / 2) * 25, 8, Math.sin(i * Math.PI / 2) * 25);
      this.scene.add(light);
    });

    // Ground - LA streets
    const groundGeo = new THREE.PlaneGeometry(300, 300, 30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Road grid
    this.buildRoads();

    // LA Buildings
    this.buildBuildings();

    // Palm trees
    this.buildPalmTrees();

    // Stars / smog layer
    this.buildSkybox();

    // Hollywood sign style hills in background
    this.buildHills();
  }

  private buildRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const lineMat = new THREE.MeshLambertMaterial({ color: 0xf5c842, emissive: 0xf5c842, emissiveIntensity: 0.3 });

    // Main roads - grid
    [-40, -20, 0, 20, 40].forEach(x => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.01, 0);
      this.scene.add(road);
    });
    [-40, -20, 0, 20, 40].forEach(z => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 4), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.01, z);
      this.scene.add(road);
    });

    // Center road markings
    for (let i = -60; i < 60; i += 5) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.5), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, i);
      this.scene.add(line);

      const line2 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.3), lineMat);
      line2.rotation.x = -Math.PI / 2;
      line2.position.set(i, 0.02, 0);
      this.scene.add(line2);
    }
  }

  private buildBuildings() {
    const buildingConfigs = [
      { x: -30, z: -30, w: 14, d: 14, h: 45, color: 0x1a237e, win: 0x4fc3f7 },
      { x: 30, z: -30, w: 12, d: 16, h: 60, color: 0x0d47a1, win: 0x00e5ff },
      { x: -30, z: 30, w: 16, d: 12, h: 35, color: 0x212121, win: 0xff6d00 },
      { x: 30, z: 30,  w: 14, d: 14, h: 50, color: 0x1b5e20, win: 0x69f0ae },
      { x: 10, z: -30, w: 8,  d: 10, h: 30, color: 0x311b92, win: 0xea80fc },
      { x: -10, z: -30, w: 8, d: 8,  h: 25, color: 0x880e4f, win: 0xff80ab },
      { x: 10, z: 30,  w: 8,  d: 10, h: 38, color: 0x263238, win: 0x80cbc4 },
      { x: -10, z: 30, w: 10, d: 8,  h: 28, color: 0x37474f, win: 0xffcc02 },
      { x: -50, z: 10, w: 10, d: 10, h: 20, color: 0x1a1a2e, win: 0xff4081 },
      { x: 50, z: -10, w: 10, d: 10, h: 22, color: 0x0d1117, win: 0x40c4ff },
      { x: -50, z: -20, w: 8, d: 8, h: 32, color: 0x1c2833, win: 0x76ff03 },
      { x: 50, z: 20, w: 8, d: 8, h: 18, color: 0x2c3e50, win: 0xff9100 },
    ];

    buildingConfigs.forEach(cfg => {
      // Main building body
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const mat = new THREE.MeshLambertMaterial({ color: cfg.color });
      const bld = new THREE.Mesh(geo, mat);
      bld.position.set(cfg.x, cfg.h / 2, cfg.z);
      bld.castShadow = true;
      bld.receiveShadow = true;
      this.scene.add(bld);
      this.buildings.push(bld);

      // Windows (emissive planes)
      for (let row = 1; row < cfg.h / 3; row++) {
        for (let col = -Math.floor(cfg.w / 4); col <= Math.floor(cfg.w / 4); col++) {
          if (Math.random() > 0.4) {
            const winMat = new THREE.MeshLambertMaterial({
              color: cfg.win,
              emissive: cfg.win,
              emissiveIntensity: Math.random() * 0.8 + 0.2,
            });
            const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), winMat);
            win.position.set(cfg.x + col * 3, row * 3, cfg.z + cfg.d / 2 + 0.05);
            this.scene.add(win);
          }
        }
      }

      // Neon sign on top floors
      if (Math.random() > 0.5) {
        const neonColors = [0xff0080, 0x00ffff, 0xf5c842, 0xff6b35];
        const nc = neonColors[Math.floor(Math.random() * neonColors.length)];
        const neonMat = new THREE.MeshLambertMaterial({ color: nc, emissive: nc, emissiveIntensity: 2 });
        const neon = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.6, 0.5, 0.3), neonMat);
        neon.position.set(cfg.x, cfg.h + 0.5, cfg.z + cfg.d / 2 + 0.2);
        this.scene.add(neon);
        this.neons.push(neon);
      }
    });
  }

  private buildPalmTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32, emissive: 0x1b5e20, emissiveIntensity: 0.2 });

    const positions = [
      [-8, 0], [8, 0], [0, -8], [0, 8],
      [-15, -15], [15, -15], [-15, 15], [15, 15],
      [-5, -18], [5, -18], [-5, 18], [5, 18],
    ];

    positions.forEach(([x, z]) => {
      const height = 5 + Math.random() * 3;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, height, 6), trunkMat);
      trunk.position.set(x, height / 2, z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      trunk.castShadow = true;
      this.scene.add(trunk);

      // Palm fronds
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.1, 2.5, 4), leafMat);
        frond.position.set(
          x + Math.cos(angle) * 1.5,
          height + 0.5,
          z + Math.sin(angle) * 1.5,
        );
        frond.rotation.z = Math.PI / 2 + Math.sin(angle) * 0.6;
        frond.rotation.x = Math.cos(angle) * 0.6;
        frond.castShadow = true;
        this.scene.add(frond);
      }
      // Top leaf crown
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 4), leafMat);
      crown.position.set(x, height + 0.8, z);
      crown.scale.set(1.5, 0.5, 1.5);
      this.scene.add(crown);
    });
  }

  private buildSkybox() {
    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(3000);
    for (let i = 0; i < 3000; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = Math.random() * 200 + 20;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.8 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // Moon
    const moonMat = new THREE.MeshLambertMaterial({ color: 0xfff9c4, emissive: 0xfff9c4, emissiveIntensity: 0.5 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), moonMat);
    moon.position.set(120, 80, -150);
    this.scene.add(moon);

    // Moon glow
    const moonLight = new THREE.PointLight(0xfff9c4, 1, 200);
    moonLight.position.copy(moon.position);
    this.scene.add(moonLight);
  }

  private buildHills() {
    const hillMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });
    const hills = [
      { x: -80, z: -100, r: 30, h: 40 },
      { x: 0, z: -110, r: 25, h: 35 },
      { x: 80, z: -100, r: 28, h: 38 },
    ];
    hills.forEach(h => {
      const geo = new THREE.SphereGeometry(h.r, 12, 8);
      const mesh = new THREE.Mesh(geo, hillMat);
      mesh.position.set(h.x, -h.r * 0.4, h.z);
      mesh.scale.y = h.h / h.r;
      this.scene.add(mesh);
    });

    // "DEGEN" letters on hill
    const letterMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
    const letters = "DEGEN";
    letters.split("").forEach((l, i) => {
      const geo = new THREE.BoxGeometry(2, 4, 0.5);
      const mesh = new THREE.Mesh(geo, letterMat);
      mesh.position.set(-10 + i * 5, 22, -95);
      this.scene.add(mesh);
    });
  }

  private buildPlayer() {
    const textureLoader = new THREE.TextureLoader();
    this.charTexture = textureLoader.load(this.char.texture);

    this.player = new THREE.Group();

    const color = this.char.color;
    const accent = this.char.accentColor;

    // Body (capsule-like shape from cylinders + spheres)
    const torsoMat = new THREE.MeshLambertMaterial({ color });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1.0, 8), torsoMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    this.player.add(torso);

    // Head - use character texture as face
    const headGeo = new THREE.SphereGeometry(0.42, 16, 12);
    const headMat = new THREE.MeshLambertMaterial({ map: this.charTexture });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    head.castShadow = true;
    head.name = "head";
    this.player.add(head);

    // Legs
    const legMat = new THREE.MeshLambertMaterial({ color: accent });
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.9, 6), legMat);
    leftLeg.position.set(-0.2, 0.25, 0);
    leftLeg.castShadow = true;
    leftLeg.name = "leftLeg";
    this.player.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.9, 6), legMat);
    rightLeg.position.set(0.2, 0.25, 0);
    rightLeg.castShadow = true;
    rightLeg.name = "rightLeg";
    this.player.add(rightLeg);

    // Feet
    const footMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.35), footMat);
    leftFoot.position.set(-0.2, -0.2, 0.06);
    leftFoot.name = "leftFoot";
    this.player.add(leftFoot);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.35), footMat);
    rightFoot.position.set(0.2, -0.2, 0.06);
    rightFoot.name = "rightFoot";
    this.player.add(rightFoot);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 6), torsoMat);
    leftArm.position.set(-0.6, 1.1, 0);
    leftArm.rotation.z = Math.PI / 8;
    leftArm.castShadow = true;
    leftArm.name = "leftArm";
    this.player.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 6), torsoMat);
    rightArm.position.set(0.6, 1.1, 0);
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.castShadow = true;
    rightArm.name = "rightArm";
    this.player.add(rightArm);

    // Character-specific extras
    if (this.char.id === "bonk") {
      // Bonk: hard hat + hammer
      const hatMat = new THREE.MeshLambertMaterial({ color: 0xf5c842 });
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.25, 8), hatMat);
      hat.position.y = 2.35;
      this.player.add(hat);
      // Hammer
      const hammerMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
      const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8), hammerMat);
      hammer.rotation.z = Math.PI / 2;
      hammer.position.set(0.9, 1.1, 0.2);
      this.player.add(hammer);
    } else if (this.char.id === "trump") {
      // Trump: red tie
      const tieMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f, emissive: 0xd32f2f, emissiveIntensity: 0.1 });
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.05), tieMat);
      tie.position.set(0, 1.0, 0.36);
      this.player.add(tie);
    } else if (this.char.id === "gigachad") {
      // Gigachad: extra wide shoulders
      const shoulderMat = new THREE.MeshLambertMaterial({ color });
      const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), shoulderMat);
      lShoulder.position.set(-0.6, 1.55, 0);
      this.player.add(lShoulder);
      const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), shoulderMat);
      rShoulder.position.set(0.6, 1.55, 0);
      this.player.add(rShoulder);
    }

    // Player glow
    const glowLight = new THREE.PointLight(color, 2, 5);
    glowLight.position.y = 1;
    this.player.add(glowLight);

    this.player.position.set(0, 0.3, 0);
    this.scene.add(this.player);
    this.mixer = new THREE.AnimationMixer(this.player);
  }

  private createEnemyMesh(position: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();
    const enemyColor = [0xef4444, 0x8b00ff, 0xff6b35][Math.floor(Math.random() * 3)];

    const mat = new THREE.MeshLambertMaterial({ color: enemyColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.9, 8), mat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Head (skull-like)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), mat);
    head.position.y = 1.82;
    group.add(head);

    // Spiky top
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), mat);
      spike.position.set(Math.cos(i * Math.PI / 2) * 0.2, 2.22, Math.sin(i * Math.PI / 2) * 0.2);
      group.add(spike);
    }

    // Legs
    [-0.18, 0.18].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 6), darkMat);
      leg.position.set(x, 0.22, 0);
      group.add(leg);
    });

    // Eyes (glowing)
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
    [-0.12, 0.12].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), eyeMat);
      eye.position.set(x, 1.85, 0.33);
      group.add(eye);
    });

    const light = new THREE.PointLight(enemyColor, 1.5, 4);
    light.position.y = 1;
    group.add(light);

    group.position.copy(position);
    group.position.y = 0.3;
    return group;
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 12 + Math.random() * 8;
      const pos = new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      const enemy = this.createEnemyMesh(pos);
      this.enemies.push(enemy);
      this.scene.add(enemy);
    }
  }

  private emitParticles(position: THREE.Vector3, color: number, count = 20) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: number[] = [];

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i + 1] = position.y + Math.random() * 1;
      positions[i + 2] = position.z + (Math.random() - 0.5) * 0.5;
      velocities.push((Math.random() - 0.5) * 0.2, Math.random() * 0.15, (Math.random() - 0.5) * 0.2);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.25, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geo, mat);
    (pts as unknown as { _vel: number[]; _age: number })._vel = velocities;
    (pts as unknown as { _vel: number[]; _age: number })._age = 0;
    this.scene.add(pts);
    this.particles.push(pts);
  }

  private bindEvents() {
    const onKey = (e: KeyboardEvent, val: boolean) => {
      this.keys[e.code] = val;
    };
    window.addEventListener("keydown", e => onKey(e, true));
    window.addEventListener("keyup", e => onKey(e, false));

    const canvas = this.renderer.domElement;
    canvas.addEventListener("mousedown", () => { this.isDragging = true; });
    canvas.addEventListener("mouseup", () => { this.isDragging = false; });
    canvas.addEventListener("mousemove", e => {
      if (this.isDragging) {
        this.cameraAngle -= e.movementX * 0.004;
        this.cameraPitch = Math.max(0.05, Math.min(0.8, this.cameraPitch - e.movementY * 0.003));
      }
    });
    canvas.addEventListener("wheel", e => {
      this.cameraDistance = Math.max(5, Math.min(25, this.cameraDistance + e.deltaY * 0.01));
    });
    canvas.addEventListener("touchstart", e => {
      this.isDragging = true;
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
    });
    canvas.addEventListener("touchend", () => { this.isDragging = false; });
    canvas.addEventListener("touchmove", e => {
      if (this.isDragging) {
        const dx = e.touches[0].clientX - this.mouseX;
        const dy = e.touches[0].clientY - this.mouseY;
        this.cameraAngle -= dx * 0.004;
        this.cameraPitch = Math.max(0.05, Math.min(0.8, this.cameraPitch - dy * 0.003));
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  triggerSpecial() {
    this.playTone(440, 0.1, "sawtooth", 0.3);
    setTimeout(() => this.playTone(880, 0.2, "square", 0.2), 100);
    setTimeout(() => this.playTone(1320, 0.3, "triangle", 0.15), 200);

    this.emitParticles(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), this.char.color, 40);

    // Special attack - big AOE
    this.enemies.forEach(enemy => {
      const dist = enemy.position.distanceTo(this.player.position);
      if (dist < 8) {
        this.score += 500;
        this.callbacks.onScoreChange(this.score);
        this.emitParticles(enemy.position.clone(), 0xff4444, 30);
        this.scene.remove(enemy);
      }
    });
    this.enemies = this.enemies.filter(e => e.parent !== null);
  }

  start() {
    this.clock.start();
    this.loop();
  }

  private loop() {
    this.animFrame = requestAnimationFrame(() => this.loop());
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    this.update(delta, elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private update(delta: number, elapsed: number) {
    // ── Player movement ──
    const speed = this.char.speed;
    const forward = new THREE.Vector3(Math.sin(this.cameraAngle), 0, Math.cos(this.cameraAngle));
    const right = new THREE.Vector3(Math.cos(this.cameraAngle), 0, -Math.sin(this.cameraAngle));
    const moveDir = new THREE.Vector3();

    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveDir.add(forward);
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveDir.sub(forward);
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveDir.sub(right);
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize().multiplyScalar(speed * delta);
      this.player.position.addVectors(this.player.position, moveDir);
      this.player.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    // Boundary
    this.player.position.x = Math.max(-60, Math.min(60, this.player.position.x));
    this.player.position.z = Math.max(-60, Math.min(60, this.player.position.z));

    // Jump
    if ((this.keys["Space"] || this.keys["KeySpace"]) && this.isGrounded) {
      this.velocity.y = 8;
      this.isGrounded = false;
      this.playTone(200, 0.1, "square", 0.05);
    }

    // Gravity
    this.velocity.y -= 20 * delta;
    this.player.position.y += this.velocity.y * delta;
    if (this.player.position.y <= 0.3) {
      this.player.position.y = 0.3;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Attack
    if ((this.keys["KeyE"]) && !this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackCooldown = 0.5;
      this.playTone(300, 0.08, "sawtooth", 0.08);
      setTimeout(() => { this.isAttacking = false; }, 200);

      // Check hits
      this.enemies.forEach(enemy => {
        const dist = enemy.position.distanceTo(this.player.position);
        if (dist < 3) {
          this.score += 100;
          this.callbacks.onScoreChange(this.score);
          this.emitParticles(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)), this.char.color, 15);
          this.scene.remove(enemy);
          this.playTone(440, 0.15, "square", 0.1);
          setTimeout(() => this.playTone(600, 0.1, "square", 0.08), 80);
        }
      });
      this.enemies = this.enemies.filter(e => e.parent !== null);
    }
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // ── Character animations ──
    if (isMoving) {
      this.walkCycle += delta * speed * 1.2;
    } else {
      this.walkCycle += delta * 0.8; // idle bob
    }

    const leftLeg = this.player.getObjectByName("leftLeg");
    const rightLeg = this.player.getObjectByName("rightLeg");
    const leftArm = this.player.getObjectByName("leftArm");
    const rightArm = this.player.getObjectByName("rightArm");
    const leftFoot = this.player.getObjectByName("leftFoot");
    const rightFoot = this.player.getObjectByName("rightFoot");

    if (isMoving) {
      const swing = Math.sin(this.walkCycle * 5) * 0.5;
      if (leftLeg) leftLeg.rotation.x = swing;
      if (rightLeg) rightLeg.rotation.x = -swing;
      if (leftArm) leftArm.rotation.x = -swing * 0.6;
      if (rightArm) rightArm.rotation.x = swing * 0.6;
      if (leftFoot) leftFoot.rotation.x = swing * 0.3;
      if (rightFoot) rightFoot.rotation.x = -swing * 0.3;
      this.player.position.y += Math.abs(Math.sin(this.walkCycle * 5)) * 0.04;
    } else {
      // Idle breathing
      const bob = Math.sin(elapsed * 1.5) * 0.02;
      this.player.position.y = 0.3 + (this.isGrounded ? bob : 0);
      const head = this.player.getObjectByName("head");
      if (head) head.rotation.y = Math.sin(elapsed * 0.5) * 0.1;
    }

    // Attack animation
    if (this.isAttacking) {
      if (rightArm) rightArm.rotation.x = -1.5;
    }

    // ── Enemies ──
    this.spawnTimer += delta;
    if (this.spawnTimer > 8 && this.enemies.length < 6) {
      this.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 10;
      const pos = new THREE.Vector3(
        this.player.position.x + Math.cos(angle) * r,
        0,
        this.player.position.z + Math.sin(angle) * r,
      );
      pos.x = Math.max(-55, Math.min(55, pos.x));
      pos.z = Math.max(-55, Math.min(55, pos.z));
      const e = this.createEnemyMesh(pos);
      this.enemies.push(e);
      this.scene.add(e);
    }

    this.enemies.forEach((enemy, idx) => {
      // Chase player
      const dir = new THREE.Vector3().subVectors(this.player.position, enemy.position).normalize();
      const enemySpeed = 3 + idx * 0.3;
      enemy.position.addScaledVector(dir, enemySpeed * delta);
      enemy.rotation.y = Math.atan2(dir.x, dir.z);

      // Enemy walk animation
      const elbLeft = enemy.children[3];
      const elbRight = enemy.children[4];
      if (elbLeft) elbLeft.rotation.x = Math.sin(elapsed * 8 + idx) * 0.6;
      if (elbRight) elbRight.rotation.x = -Math.sin(elapsed * 8 + idx) * 0.6;

      // Enemy attack
      if (enemy.position.distanceTo(this.player.position) < 1.8) {
        this.health = Math.max(0, this.health - 8 * delta);
        this.callbacks.onHealthChange(Math.round(this.health));
      }
    });

    // ── Neon flicker ──
    this.neons.forEach((n, i) => {
      const mat = n.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(elapsed * 3 + i * 1.3) * 0.5;
    });

    // ── Particles ──
    this.particles = this.particles.filter(pts => {
      const typed = pts as unknown as { _vel: number[]; _age: number };
      typed._age += delta;
      if (typed._age > 1.2) {
        this.scene.remove(pts);
        return false;
      }
      const pos = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += typed._vel[i] * delta * 60;
        pos[i + 1] += typed._vel[i + 1] * delta * 60 - 0.15 * typed._age;
        pos[i + 2] += typed._vel[i + 2] * delta * 60;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      (pts.material as THREE.PointsMaterial).opacity = 1 - typed._age / 1.2;
      return true;
    });

    // ── Camera ──
    const camX = this.player.position.x + Math.sin(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraPitch);
    const camY = this.player.position.y + this.cameraDistance * Math.sin(this.cameraPitch) + 2;
    const camZ = this.player.position.z + Math.cos(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraPitch);
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
    this.camera.lookAt(this.player.position.x, this.player.position.y + 1.5, this.player.position.z);

    // ── Score: time-based ──
    this.score += Math.round(delta * 10);
    if (Math.round(elapsed) % 1 === 0 && this.lastTime !== Math.round(elapsed)) {
      this.lastTime = Math.round(elapsed);
      this.callbacks.onScoreChange(this.score);
      this.floor = 1 + Math.floor(this.score / 2000);
      this.callbacks.onFloorChange(this.floor);
    }
  }

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    window.removeEventListener("keydown", () => {});
    window.removeEventListener("keyup", () => {});
    if (this.audioCtx) this.audioCtx.close();
  }
}
