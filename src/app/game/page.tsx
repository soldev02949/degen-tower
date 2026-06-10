"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Zap, ShoppingBag, Trophy } from "lucide-react";

const CHARACTERS = [
  { id: "pepe", emoji: "🐸", name: "Pepe", ability: "Ribbit Dodge", color: "#22c55e" },
  { id: "gigachad", emoji: "💪", name: "Gigachad", ability: "Chad Wall", color: "#f5c842" },
  { id: "troll", emoji: "🧌", name: "Troll", ability: "Bridge Stomp", color: "#8b5cf6" },
  { id: "trump", emoji: "🎩", name: "Trump", ability: "Deal Maker", color: "#ef4444" },
];

type GameState = "lobby" | "playing" | "dead" | "paused";

interface Platform {
  x: number;
  y: number;
  w: number;
  id: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  id: number;
  emoji: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  id: number;
}

const CANVAS_W = 360;
const CANVAS_H = 540;
const PLATFORM_H = 12;
const PLAYER_SIZE = 28;
const GRAVITY = 0.45;
const JUMP_FORCE = -10.5;
const ENEMY_EMOJIS = ["🐻", "👻", "💀", "🤡"];

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [selectedChar, setSelectedChar] = useState(0);
  const [score, setScore] = useState(0);
  const [floor, setFloor] = useState(1);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(0);

  // Game refs (mutable game state for the loop)
  const stateRef = useRef<GameState>("lobby");
  const playerRef = useRef({ x: CANVAS_W / 2 - 14, y: CANVAS_H - 100, vx: 0, vy: 0, onGround: false, isAbility: false });
  const platformsRef = useRef<Platform[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const camYRef = useRef(0);
  const floorCountRef = useRef(1);
  const livesRef = useRef(3);
  const keysRef = useRef<Record<string, boolean>>({});
  const animRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const charRef = useRef(0);

  const getId = () => nextIdRef.current++;

  const initGame = useCallback(() => {
    const platforms: Platform[] = [];
    // Starting platform
    platforms.push({ x: CANVAS_W / 2 - 40, y: CANVAS_H - 60, w: 80, id: getId() });
    // Generate initial platforms
    for (let i = 1; i < 18; i++) {
      platforms.push({
        x: Math.random() * (CANVAS_W - 80),
        y: CANVAS_H - 60 - i * 68 + Math.random() * 20,
        w: 60 + Math.random() * 40,
        id: getId(),
      });
    }
    platformsRef.current = platforms;
    enemiesRef.current = [];
    particlesRef.current = [];
    playerRef.current = { x: CANVAS_W / 2 - 14, y: CANVAS_H - 90, vx: 0, vy: -2, onGround: false, isAbility: false };
    camYRef.current = 0;
    floorCountRef.current = 1;
    livesRef.current = 3;
    charRef.current = selectedChar;
    setScore(0);
    setFloor(1);
    setLives(3);
  }, [selectedChar]);

  const spawnParticles = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 1,
        color,
        id: getId(),
      });
    }
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    initGame();
    stateRef.current = "playing";

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keysRef.current[e.key] = down;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", e => onKey(e, true));
    window.addEventListener("keyup", e => onKey(e, false));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastFloorAward = 0;

    const loop = () => {
      if (stateRef.current !== "playing") return;
      const p = playerRef.current;
      const keys = keysRef.current;
      const char = CHARACTERS[charRef.current];

      // Input
      const speed = 4.2;
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) p.vx = -speed;
      else if (keys["ArrowRight"] || keys["d"] || keys["D"]) p.vx = speed;
      else p.vx *= 0.78;

      if ((keys["ArrowUp"] || keys[" "] || keys["w"] || keys["W"]) && p.onGround) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
        spawnParticles(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE, char.color, 4);
      }

      // Physics
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap horizontally
      if (p.x < -PLAYER_SIZE) p.x = CANVAS_W;
      if (p.x > CANVAS_W) p.x = -PLAYER_SIZE;

      // Camera follows player upward
      if (p.y - camYRef.current < CANVAS_H * 0.4) {
        const delta = (CANVAS_H * 0.4 - (p.y - camYRef.current)) * 0.15;
        camYRef.current -= delta;

        // Update floor count
        const newFloor = Math.floor(Math.abs(camYRef.current) / 80) + 1;
        if (newFloor > floorCountRef.current) {
          floorCountRef.current = newFloor;
          setFloor(newFloor);
          spawnParticles(p.x + 14, p.y, "#f5c842", 8);
        }
      }

      // Platform collision
      p.onGround = false;
      for (const plat of platformsRef.current) {
        const screenY = plat.y - camYRef.current;
        if (
          p.vy > 0 &&
          p.y + PLAYER_SIZE > screenY &&
          p.y + PLAYER_SIZE < screenY + PLATFORM_H + 8 &&
          p.x + PLAYER_SIZE > plat.x + 4 &&
          p.x < plat.x + plat.w - 4
        ) {
          p.y = screenY - PLAYER_SIZE;
          p.vy = 0;
          p.onGround = true;
        }
      }

      // Scroll platforms up, add new ones at top
      const highestPlat = Math.min(...platformsRef.current.map(pl => pl.y));
      if (highestPlat > camYRef.current - 200) {
        platformsRef.current.push({
          x: Math.random() * (CANVAS_W - 80),
          y: highestPlat - 60 - Math.random() * 30,
          w: 60 + Math.random() * 40,
          id: getId(),
        });
      }
      // Remove off-screen platforms
      platformsRef.current = platformsRef.current.filter(pl => pl.y < camYRef.current + CANVAS_H + 100);

      // Spawn enemies on higher floors
      if (floorCountRef.current > 5 && Math.random() < 0.008 && enemiesRef.current.length < 4) {
        const randPlat = platformsRef.current[Math.floor(Math.random() * platformsRef.current.length)];
        if (randPlat) {
          enemiesRef.current.push({
            x: randPlat.x,
            y: randPlat.y - 24,
            vx: (Math.random() > 0.5 ? 1 : -1) * (1 + floorCountRef.current * 0.04),
            id: getId(),
            emoji: ENEMY_EMOJIS[Math.floor(Math.random() * ENEMY_EMOJIS.length)],
          });
        }
      }

      // Update enemies
      for (const en of enemiesRef.current) {
        en.x += en.vx;
        if (en.x < 0 || en.x > CANVAS_W - 24) en.vx *= -1;
        const screenEY = en.y - camYRef.current;
        // Collision with player
        if (
          Math.abs(p.x + 14 - (en.x + 12)) < 20 &&
          Math.abs(p.y + 14 - (screenEY + 12)) < 20
        ) {
          livesRef.current = Math.max(0, livesRef.current - 1);
          setLives(livesRef.current);
          spawnParticles(p.x + 14, p.y + 14, "#ff4d6a", 10);
          // Push player away
          p.vx = p.x < en.x ? -6 : 6;
          p.vy = -8;
          // Remove enemy
          enemiesRef.current = enemiesRef.current.filter(e => e.id !== en.id);
          if (livesRef.current <= 0) {
            stateRef.current = "dead";
            setGameState("dead");
            setBestScore(prev => Math.max(prev, floorCountRef.current));
            return;
          }
        }
      }
      // Remove off-screen enemies
      enemiesRef.current = enemiesRef.current.filter(en => en.y - camYRef.current < CANVAS_H + 100);

      // Update particles
      particlesRef.current = particlesRef.current
        .map(pt => ({ ...pt, x: pt.x + pt.vx, y: pt.y + pt.vy, vy: pt.vy + 0.15, life: pt.life - 0.05 }))
        .filter(pt => pt.life > 0);

      // Score
      const newScore = floorCountRef.current * 100 + Math.floor(Math.abs(camYRef.current) / 10);
      if (newScore - lastFloorAward > 500) {
        lastFloorAward = newScore;
      }
      setScore(newScore);

      // Death: fell off screen
      if (p.y - camYRef.current > CANVAS_H + 50) {
        livesRef.current = Math.max(0, livesRef.current - 1);
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          stateRef.current = "dead";
          setGameState("dead");
          setBestScore(prev => Math.max(prev, floorCountRef.current));
          return;
        }
        // Respawn
        const safePlat = platformsRef.current.find(pl => pl.y > camYRef.current && pl.y < camYRef.current + CANVAS_H * 0.8);
        if (safePlat) {
          p.x = safePlat.x + safePlat.w / 2 - PLAYER_SIZE / 2;
          p.y = safePlat.y - PLAYER_SIZE - camYRef.current;
          p.vy = 0;
        }
      }

      // ---- DRAW ----
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, "#060610");
      bgGrad.addColorStop(1, "#0f0f20");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Background grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < CANVAS_W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CANVAS_H); ctx.stroke();
      }
      for (let gy = 0; gy < CANVAS_H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANVAS_W, gy); ctx.stroke();
      }

      // Platforms
      for (const plat of platformsRef.current) {
        const screenY = plat.y - camYRef.current;
        if (screenY < -PLATFORM_H || screenY > CANVAS_H + 10) continue;
        const grad = ctx.createLinearGradient(plat.x, screenY, plat.x, screenY + PLATFORM_H);
        grad.addColorStop(0, "rgba(245,200,66,0.9)");
        grad.addColorStop(1, "rgba(180,130,20,0.9)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(plat.x, screenY, plat.w, PLATFORM_H, 4);
        ctx.fill();
        // Glow
        ctx.shadowColor = "rgba(245,200,66,0.4)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Enemies
      ctx.font = "22px serif";
      for (const en of enemiesRef.current) {
        const screenY = en.y - camYRef.current;
        if (screenY < -30 || screenY > CANVAS_H + 10) continue;
        ctx.fillText(en.emoji, en.x, screenY + 22);
      }

      // Player
      ctx.font = `${PLAYER_SIZE + 4}px serif`;
      ctx.fillText(char.emoji, p.x, p.y + PLAYER_SIZE);

      // Character glow
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 16;
      ctx.fillText(char.emoji, p.x, p.y + PLAYER_SIZE);
      ctx.shadowBlur = 0;

      // Particles
      for (const pt of particlesRef.current) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3 * pt.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Height indicator line
      const progressY = Math.max(4, CANVAS_H - (floorCountRef.current / 100) * CANVAS_H);
      ctx.fillStyle = "rgba(245,200,66,0.15)";
      ctx.fillRect(CANVAS_W - 8, 0, 8, CANVAS_H);
      ctx.fillStyle = "rgba(245,200,66,0.8)";
      ctx.fillRect(CANVAS_W - 8, progressY, 8, CANVAS_H - progressY);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", e => onKey(e, true));
      window.removeEventListener("keyup", e => onKey(e, false));
    };
  }, [gameState, initGame]);

  // Touch controls
  const touchLeft = () => { keysRef.current["ArrowLeft"] = true; setTimeout(() => { keysRef.current["ArrowLeft"] = false; }, 120); };
  const touchRight = () => { keysRef.current["ArrowRight"] = true; setTimeout(() => { keysRef.current["ArrowRight"] = false; }, 120); };
  const touchJump = () => { keysRef.current[" "] = true; setTimeout(() => { keysRef.current[" "] = false; }, 80); };

  if (gameState === "lobby") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "40px 24px",
          width: "100%",
        }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 32 }}>
            <ArrowLeft size={16} /> Back
          </Link>

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 12, filter: "drop-shadow(0 0 20px rgba(245,200,66,0.5))" }}>🗼</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>Degen Tower</h1>
            <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>Choose your character and climb</p>
          </div>

          {/* Character select */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
              SELECT CHARACTER
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {CHARACTERS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChar(i)}
                  style={{
                    background: selectedChar === i ? `rgba(${c.color === "#f5c842" ? "245,200,66" : c.color === "#22c55e" ? "34,197,94" : c.color === "#8b5cf6" ? "139,92,246" : "239,68,68"},0.1)` : "var(--surface)",
                    border: `2px solid ${selectedChar === i ? c.color : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "14px 12px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{c.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: selectedChar === i ? c.color : "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.ability}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="card" style={{ marginBottom: 24, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>CONTROLS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
              <div>⬅️ ➡️ or A/D — Move</div>
              <div>⬆️ or W or Space — Jump</div>
              <div>Mobile — Tap the buttons below</div>
            </div>
          </div>

          {bestScore > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--gold)", fontSize: 14 }}>
              <Trophy size={16} />
              Best: Floor {bestScore}
            </div>
          )}

          <button className="btn-primary pulse-glow" onClick={() => setGameState("playing")} style={{ width: "100%", fontSize: 16, padding: 16 }}>
            🚀 Start Climbing
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
            <Link href="/leaderboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <Trophy size={14} /> Leaderboard
            </Link>
            <Link href="/shop" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <ShoppingBag size={14} /> Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "dead") {
    const char = CHARACTERS[selectedChar];
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>💀</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>REKT</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 15 }}>
            {char.emoji} {char.name} fell at Floor {floor}
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "center" }}>
            <div className="card" style={{ padding: "16px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>{floor}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>FLOOR</div>
            </div>
            <div className="card" style={{ padding: "16px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{score.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>SCORE</div>
            </div>
            <div className="card" style={{ padding: "16px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple)" }}>{bestScore}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>BEST</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn-primary" onClick={() => setGameState("playing")} style={{ fontSize: 16, padding: 14 }}>
              🔄 Try Again
            </button>
            <button className="btn-secondary" onClick={() => setGameState("lobby")} style={{ fontSize: 15, padding: 13 }}>
              ← Back to Lobby
            </button>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
            💡 Visit the <Link href="/shop" style={{ color: "var(--gold)", textDecoration: "none" }}>Shop</Link> to buy revives
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div style={{
      minHeight: "100vh",
      background: "#060610",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 12,
    }}>
      {/* HUD */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: CANVAS_W,
        marginBottom: 10,
        padding: "0 4px",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} size={16} fill={i < lives ? "#ff4d6a" : "none"} color={i < lives ? "#ff4d6a" : "#333"} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: "var(--gold)" }}>Floor {floor}</span>
          <span style={{ color: "var(--text-muted)" }}>{score.toLocaleString()}</span>
        </div>
        <button
          onClick={() => { stateRef.current = "lobby"; setGameState("lobby"); cancelAnimationFrame(animRef.current); }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
        >
          QUIT
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
      />

      {/* Mobile touch controls */}
      <div style={{
        display: "flex",
        gap: 16,
        marginTop: 16,
        alignItems: "center",
      }}>
        <button
          onPointerDown={touchLeft}
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            fontSize: 22,
            cursor: "pointer",
            color: "var(--text)",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >◀</button>

        <button
          onPointerDown={touchJump}
          style={{
            width: 80,
            height: 60,
            borderRadius: 10,
            background: "rgba(245,200,66,0.15)",
            border: "1px solid var(--gold)",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--gold)",
            fontWeight: 700,
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <Zap size={20} />
        </button>

        <button
          onPointerDown={touchRight}
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            fontSize: 22,
            cursor: "pointer",
            color: "var(--text)",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >▶</button>
      </div>
    </div>
  );
}
