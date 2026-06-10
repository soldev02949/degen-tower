"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ─── Character Definitions ────────────────────────────────────────────────
export const CHARACTERS = [
  {
    id: "pepe",
    name: "Pepe",
    emoji: "🐸",
    image: "/characters/pepe.png",
    color: "#4caf50",
    glow: "rgba(76,175,80,0.6)",
    baseCoins: 1,
    ability: "Lucky Tap",
    abilityDesc: "15% chance to triple your coins on any tap",
    specialName: "Comfy Mode",
    specialDesc: "2× all earnings for 30 seconds",
    specialDuration: 30,
    passive: (coins: number) => Math.random() < 0.15 ? coins * 3 : coins,
    specialMultiplier: 2,
    energyRegen: 1,
    comboMax: 10,
  },
  {
    id: "gigachad",
    name: "Gigachad",
    emoji: "💪",
    image: "/characters/gigachad.png",
    color: "#e0b87a",
    glow: "rgba(224,184,122,0.6)",
    baseCoins: 1,
    ability: "Sigma Grind",
    abilityDesc: "Combo builds 2× faster, max combo is 20×",
    specialName: "Max Mode",
    specialDesc: "Instantly max combo + 5× multiplier for 20 seconds",
    specialDuration: 20,
    passive: (coins: number) => coins,
    specialMultiplier: 5,
    energyRegen: 1,
    comboMax: 20,
  },
  {
    id: "trump",
    name: "Trump",
    emoji: "🎩",
    image: "/characters/trump.png",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.6)",
    baseCoins: 2,
    ability: "Deal Maker",
    abilityDesc: "Every 50 taps triggers a massive 10× coin burst",
    specialName: "Make Tower Great Again",
    specialDesc: "All helpers earn 5× and tap gives 3× for 40 seconds",
    specialDuration: 40,
    passive: (coins: number) => coins,
    specialMultiplier: 3,
    energyRegen: 0.8,
    comboMax: 12,
  },
  {
    id: "troll",
    name: "Trollface",
    emoji: "🧌",
    image: "/characters/troll.png",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.6)",
    baseCoins: 1,
    ability: "Chaos Agent",
    abilityDesc: "Random 0.5–8× multiplier every tap — chaos reigns",
    specialName: "Chaos Mode",
    specialDesc: "10 seconds of 1–15× random multiplier on each tap",
    specialDuration: 10,
    passive: (coins: number) => coins * (0.5 + Math.random() * 7.5),
    specialMultiplier: 1,
    energyRegen: 1.2,
    comboMax: 10,
  },
  {
    id: "bonk",
    name: "Bonk",
    emoji: "🐕",
    image: "/characters/bonk.png",
    color: "#e8853a",
    glow: "rgba(232,133,58,0.6)",
    baseCoins: 1,
    ability: "BONK Speed",
    abilityDesc: "Energy regens 3× faster, no tap cooldown",
    specialName: "BONK Frenzy",
    specialDesc: "Infinite energy + 3× tap power for 15 seconds",
    specialDuration: 15,
    passive: (coins: number) => coins,
    specialMultiplier: 3,
    energyRegen: 3,
    comboMax: 10,
  },
];

// ─── Upgrade Definitions ──────────────────────────────────────────────────
const UPGRADES = [
  { id: "tap_power",    name: "Tap Power",       emoji: "⚡", desc: "Coins per tap",         baseCost: 50,  costMult: 1.8, baseBonus: 1  },
  { id: "energy_max",  name: "Energy Tank",      emoji: "🔋", desc: "Max energy capacity",   baseCost: 100, costMult: 2.0, baseBonus: 200 },
  { id: "combo_speed", name: "Combo Rush",       emoji: "🔥", desc: "Faster combo buildup",  baseCost: 80,  costMult: 1.9, baseBonus: 0  },
  { id: "helper_1",    name: "FUD Bear Slave",   emoji: "🐻", desc: "+1 auto-tap/sec",        baseCost: 200, costMult: 2.5, baseBonus: 1  },
  { id: "helper_2",    name: "Bot Army",         emoji: "🤖", desc: "+3 auto-taps/sec",       baseCost: 800, costMult: 3.0, baseBonus: 3  },
  { id: "helper_3",    name: "Whale Wallet",     emoji: "🐋", desc: "+10 auto-taps/sec",      baseCost: 3000,costMult: 3.5, baseBonus: 10 },
  { id: "special_cd",  name: "Special Cooldown", emoji: "✨", desc: "Faster special charge",  baseCost: 300, costMult: 2.2, baseBonus: 0  },
  { id: "lucky_strike",name: "Lucky Strike",     emoji: "🎰", desc: "+5% lucky tap chance",   baseCost: 500, costMult: 2.8, baseBonus: 0  },
];

// ─── Types ────────────────────────────────────────────────────────────────
interface SaveData {
  charId: string;
  coins: number;
  totalEarned: number;
  totalTaps: number;
  level: number;
  upgrades: Record<string, number>; // upgrade_id → count
  highScore: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  value: string;
  color: string;
  vx: number;
  vy: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────
function loadSave(charId: string): SaveData {
  try {
    const raw = localStorage.getItem(`degen_save_${charId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { charId, coins: 0, totalEarned: 0, totalTaps: 0, level: 1, upgrades: {}, highScore: 0 };
}

function persistSave(data: SaveData) {
  try { localStorage.setItem(`degen_save_${data.charId}`, JSON.stringify(data)); } catch {}
}

function getUpgradeCost(upg: typeof UPGRADES[0], level: number) {
  return Math.floor(upg.baseCost * Math.pow(upg.costMult, level));
}

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

// ─────────────────────────────────────────────────────────────────────────
//  MAIN TAP GAME
// ─────────────────────────────────────────────────────────────────────────
export default function TapGame() {
  const [screen, setScreen] = useState<"select" | "game" | "upgrades">("select");
  const [charId, setCharId] = useState<string | null>(null);
  const [save, setSave] = useState<SaveData | null>(null);

  // Game state
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy, setMaxEnergy] = useState(1000);
  const [combo, setCombo] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [specialCharge, setSpecialCharge] = useState(0); // 0-100
  const [specialActive, setSpecialActive] = useState(false);
  const [specialTimer, setSpecialTimer] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shaking, setShaking] = useState(false);
  const [charPulse, setCharPulse] = useState(false);
  const [upgrades, setUpgrades] = useState<Record<string, number>>({});

  const particleIdRef = useRef(0);
  const saveRef = useRef<SaveData | null>(null);
  const tapAreaRef = useRef<HTMLDivElement>(null);

  const char = CHARACTERS.find(c => c.id === charId);

  // ── Load save ──
  function startGame(id: string) {
    const s = loadSave(id);
    setCharId(id);
    setSave(s);
    setCoins(s.coins);
    setTotalEarned(s.totalEarned);
    setTotalTaps(s.totalTaps);
    setUpgrades(s.upgrades);
    // Compute max energy from upgrades
    const eUpg = s.upgrades["energy_max"] || 0;
    const newMax = 1000 + eUpg * 200;
    setMaxEnergy(newMax);
    setEnergy(newMax);
    setScreen("game");
    saveRef.current = s;
  }

  // ── Auto-save every 5s ──
  useEffect(() => {
    if (screen !== "game" || !charId) return;
    const interval = setInterval(() => {
      const s: SaveData = {
        charId: charId!,
        coins,
        totalEarned,
        totalTaps,
        level: Math.floor(totalEarned / 1000) + 1,
        upgrades,
        highScore: Math.max(coins, saveRef.current?.highScore || 0),
      };
      persistSave(s);
      saveRef.current = s;
    }, 5000);
    return () => clearInterval(interval);
  }, [screen, charId, coins, totalEarned, totalTaps, upgrades]);

  // ── Auto-tapper helpers ──
  useEffect(() => {
    if (screen !== "game" || !char) return;
    const h1 = upgrades["helper_1"] || 0;
    const h2 = upgrades["helper_2"] || 0;
    const h3 = upgrades["helper_3"] || 0;
    const autoRate = (h1 * 1 + h2 * 3 + h3 * 10) * (specialActive ? 5 : 1);
    if (autoRate <= 0) return;
    const interval = setInterval(() => {
      const perTick = autoRate / 20;
      setCoins(c => c + perTick);
      setTotalEarned(t => t + perTick);
    }, 50);
    return () => clearInterval(interval);
  }, [upgrades, screen, char, specialActive]);

  // ── Energy regen ──
  useEffect(() => {
    if (screen !== "game" || !char) return;
    const regenRate = char.energyRegen * (specialActive && char.id === "bonk" ? 999 : 1);
    const interval = setInterval(() => {
      setEnergy(e => Math.min(maxEnergy, e + regenRate * 0.05));
    }, 50);
    return () => clearInterval(interval);
  }, [screen, char, maxEnergy, specialActive]);

  // ── Combo decay ──
  useEffect(() => {
    if (screen !== "game") return;
    const interval = setInterval(() => {
      setComboTimer(t => {
        if (t <= 0) { setCombo(1); return 0; }
        return t - 0.05;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [screen]);

  // ── Special timer ──
  useEffect(() => {
    if (!specialActive) return;
    const interval = setInterval(() => {
      setSpecialTimer(t => {
        if (t <= 0) { setSpecialActive(false); return 0; }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [specialActive]);

  // ── Tap handler ──
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!char) return;
    e.preventDefault();
    if (energy <= 0) return;

    // Get tap position for particles
    let tapX = 0, tapY = 0;
    if ("touches" in e && e.touches.length > 0) {
      tapX = e.touches[0].clientX;
      tapY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      tapX = e.clientX;
      tapY = e.clientY;
    }

    // Compute tap power
    const tapPowerUpg = upgrades["tap_power"] || 0;
    const tapBase = char.baseCoins + tapPowerUpg;
    const comboMult = combo;
    const specialMult = specialActive ? char.specialMultiplier : 1;
    let earned = tapBase * comboMult * specialMult;
    earned = char.passive(earned);

    // Trump deal maker — every 50 taps
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    if (char.id === "trump" && newTapCount % 50 === 0) {
      earned *= 10;
      spawnParticle(tapX, tapY, "💼 DEAL!", "#f5c842", true);
    }

    // Troll special mode — random chaos
    if (specialActive && char.id === "troll") {
      earned = earned * (1 + Math.random() * 14);
    }

    earned = Math.max(0.1, earned);

    // Round for display
    const displayEarned = Math.round(earned * 10) / 10;
    spawnParticle(tapX, tapY, `+${formatNum(displayEarned)}`, getCoinColor(earned), false);

    setCoins(c => c + earned);
    setTotalEarned(t => t + earned);
    setTotalTaps(t => t + 1);

    // Energy
    const energyCost = specialActive && char.id === "bonk" ? 0 : 1;
    setEnergy(e => Math.max(0, e - energyCost));

    // Combo
    const comboSpeed = upgrades["combo_speed"] ? 1 + upgrades["combo_speed"] * 0.2 : 1;
    const gigaBonus = char.id === "gigachad" ? 2 : 1;
    const comboGain = 0.3 * comboSpeed * gigaBonus;
    const maxCombo = char.comboMax + (char.id === "gigachad" ? (upgrades["combo_speed"] || 0) * 2 : 0);
    setCombo(c => Math.min(maxCombo, c + comboGain));
    setComboTimer(0.8);

    // Special charge
    setSpecialCharge(s => Math.min(100, s + 2));

    // Visual feedback
    setCharPulse(true);
    setTimeout(() => setCharPulse(false), 120);
    if (earned > tapBase * 3) {
      setShaking(true);
      setTimeout(() => setShaking(false), 200);
    }
  }, [char, energy, combo, tapCount, upgrades, specialActive]);

  // ── Launch special ──
  const launchSpecial = useCallback(() => {
    if (!char || specialCharge < 100 || specialActive) return;
    setSpecialActive(true);
    setSpecialCharge(0);
    setSpecialTimer(char.specialDuration);
    if (char.id === "gigachad") setCombo(char.comboMax);
    // Burst effect
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        spawnParticle(
          window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          window.innerHeight / 2 + (Math.random() - 0.5) * 200,
          ["💥","⚡","🔥","✨","💫"][Math.floor(Math.random()*5)],
          char.color,
          true
        );
      }, i * 80);
    }
  }, [char, specialCharge, specialActive]);

  // ── Upgrade ──
  const buyUpgrade = useCallback((upgId: string) => {
    const upg = UPGRADES.find(u => u.id === upgId)!;
    const level = upgrades[upgId] || 0;
    const cost = getUpgradeCost(upg, level);
    if (coins < cost) return;
    setCoins(c => c - cost);
    setUpgrades(u => ({ ...u, [upgId]: (u[upgId] || 0) + 1 }));
    if (upgId === "energy_max") {
      const newMax = 1000 + ((upgrades["energy_max"] || 0) + 1) * 200;
      setMaxEnergy(newMax);
    }
  }, [coins, upgrades]);

  // ── Particle helpers ──
  function spawnParticle(x: number, y: number, text: string, color: string, big: boolean) {
    const id = particleIdRef.current++;
    const particle: Particle = {
      id, x, y, value: text, color,
      vx: (Math.random() - 0.5) * (big ? 120 : 60),
      vy: -(big ? 120 : 80) - Math.random() * 40,
    };
    setParticles(p => [...p.slice(-30), particle]);
    setTimeout(() => setParticles(p => p.filter(pp => pp.id !== id)), 1000);
  }

  function getCoinColor(amount: number): string {
    if (amount >= 50) return "#f5c842";
    if (amount >= 10) return "#22d67a";
    if (amount >= 3) return "#a855f7";
    return "#e8e8f0";
  }

  // ═══════════════════════════════════════════════
  //  SCREENS
  // ═══════════════════════════════════════════════

  // ── Character Select ──
  if (screen === "select") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a000f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", overflow: "hidden", position: "relative" }}>
        {/* Background glow */}
        <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(120,40,200,0.2) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ textAlign: "center", marginBottom: 36, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🗼</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>DEGEN TOWER</h1>
          <p style={{ color: "#9955cc", fontSize: 15 }}>Choose your degen — each has unique powers</p>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 680, position: "relative", zIndex: 1 }}>
          {CHARACTERS.map(c => {
            const saved = loadSave(c.id);
            return (
              <button
                key={c.id}
                onClick={() => startGame(c.id)}
                style={{
                  width: 120, background: "rgba(255,255,255,0.03)",
                  border: `2px solid ${c.color}33`,
                  borderRadius: 18, cursor: "pointer",
                  padding: "16px 10px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = c.color;
                  e.currentTarget.style.background = `${c.color}18`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 40px ${c.glow}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${c.color}33`;
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `2px solid ${c.color}66`, background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={c.image} alt={c.name} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: "50%" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:40px">${c.emoji}</span>`; }} />
                </div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                <div style={{ background: `${c.color}22`, border: `1px solid ${c.color}55`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: c.color, fontWeight: 700, textAlign: "center" }}>{c.ability}</div>
                {saved.totalEarned > 0 && (
                  <div style={{ fontSize: 10, color: "#666", marginTop: -2 }}>💰 {formatNum(saved.totalEarned)} earned</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 28, color: "#443355", fontSize: 12, textAlign: "center", position: "relative", zIndex: 1 }}>
          Tap to earn $TOWER · Upgrade your rig · Climb the leaderboard
        </div>
      </div>
    );
  }

  if (!char) return null;

  // ── Upgrade Shop ──
  if (screen === "upgrades") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a000f", color: "#fff", padding: "0 0 80px" }}>
        {/* Header */}
        <div style={{ background: "rgba(10,0,20,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setScreen("game")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>← Back</button>
          <h2 style={{ fontWeight: 900, fontSize: 18 }}>⚡ Upgrade Shop</h2>
          <div style={{ marginLeft: "auto", background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)", borderRadius: 10, padding: "6px 14px", fontSize: 15, fontWeight: 800, color: "#f5c842" }}>
            💰 {formatNum(coins)}
          </div>
        </div>

        <div style={{ padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {UPGRADES.map(upg => {
              const level = upgrades[upg.id] || 0;
              const cost = getUpgradeCost(upg, level);
              const canAfford = coins >= cost;
              return (
                <button
                  key={upg.id}
                  onClick={() => buyUpgrade(upg.id)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: `1px solid ${canAfford ? "rgba(245,200,66,0.25)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 14, padding: "14px 12px",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    textAlign: "left", opacity: canAfford ? 1 : 0.55,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (canAfford) { e.currentTarget.style.borderColor = "#f5c842"; e.currentTarget.style.background = "rgba(245,200,66,0.06)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = canAfford ? "rgba(245,200,66,0.25)" : "rgba(255,255,255,0.06)"; e.currentTarget.style.background = canAfford ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{upg.emoji}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{upg.name}</span>
                    {level > 0 && <span style={{ marginLeft: "auto", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 5, padding: "1px 6px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>Lv.{level}</span>}
                  </div>
                  <div style={{ color: "#6b6b8a", fontSize: 11, marginBottom: 8 }}>{upg.desc}</div>
                  <div style={{ color: canAfford ? "#f5c842" : "#555", fontWeight: 800, fontSize: 13 }}>
                    💰 {formatNum(cost)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Game ──
  const comboDisplay = Math.floor(combo * 10) / 10;
  const energyPct = (energy / maxEnergy) * 100;
  const specialPct = specialCharge;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a000f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      className={shaking ? "shake" : ""}
    >
      {/* Animated background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 60%, ${char.glow.replace("0.6", specialActive ? "0.35" : "0.18")} 0%, transparent 65%)`,
        transition: "background 0.5s",
      }} />

      {/* ── TOP BAR ── */}
      <div style={{ width: "100%", maxWidth: 480, padding: "12px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10, position: "relative" }}>
        <button onClick={() => { setScreen("select"); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>⬅</button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#f5c842", letterSpacing: "-0.02em" }}>💰 {formatNum(coins)}</div>
          <div style={{ fontSize: 10, color: "#664488", textTransform: "uppercase", letterSpacing: "0.08em" }}>$TOWER</div>
        </div>

        <button onClick={() => setScreen("upgrades")} style={{
          background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.25)",
          color: "#f5c842", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700,
        }}>⚡ Shop</button>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ width: "100%", maxWidth: 480, padding: "0 16px 10px", display: "flex", gap: 8, zIndex: 10, position: "relative" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
          <div style={{ color: "#6b6b8a", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Total Earned</div>
          <div style={{ color: "#e8e8f0", fontWeight: 800, fontSize: 13 }}>💰 {formatNum(totalEarned)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
          <div style={{ color: "#6b6b8a", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Total Taps</div>
          <div style={{ color: "#e8e8f0", fontWeight: 800, fontSize: 13 }}>👆 {formatNum(totalTaps)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${char.color}44`, borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
          <div style={{ color: "#6b6b8a", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Ability</div>
          <div style={{ color: char.color, fontWeight: 800, fontSize: 11 }}>{char.ability}</div>
        </div>
      </div>

      {/* ── COMBO DISPLAY ── */}
      {combo > 1.5 && (
        <div style={{
          position: "relative", zIndex: 10,
          background: `linear-gradient(135deg, ${char.color}33, ${char.color}11)`,
          border: `1px solid ${char.color}66`,
          borderRadius: 20, padding: "4px 20px", marginBottom: 6,
          fontSize: 16, fontWeight: 900, color: char.color,
          textShadow: `0 0 20px ${char.color}`,
          animation: "pulse-glow 0.5s infinite",
        }}>
          ×{comboDisplay.toFixed(1)} COMBO
        </div>
      )}

      {/* ── SPECIAL ACTIVE BANNER ── */}
      {specialActive && (
        <div style={{
          position: "relative", zIndex: 10,
          background: `linear-gradient(135deg, ${char.color}, #ff00cc)`,
          borderRadius: 20, padding: "4px 24px", marginBottom: 6,
          fontSize: 13, fontWeight: 900, color: "#fff",
          boxShadow: `0 0 30px ${char.color}`,
          animation: "pulse-glow 0.3s infinite",
        }}>
          ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
        </div>
      )}

      {/* ── TAP CHARACTER ── */}
      <div
        ref={tapAreaRef}
        onMouseDown={handleTap}
        onTouchStart={handleTap}
        style={{
          position: "relative", zIndex: 10,
          width: 220, height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${char.color}22 0%, transparent 70%)`,
          border: `3px solid ${char.color}${specialActive ? "ff" : "55"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.1s",
          transform: charPulse ? "scale(0.93)" : "scale(1)",
          boxShadow: specialActive
            ? `0 0 60px ${char.color}, 0 0 120px ${char.color}66`
            : `0 0 ${combo > 3 ? 40 : 20}px ${char.color}44`,
          margin: "8px 0",
          WebkitTapHighlightColor: "transparent",
          touchAction: "none",
        }}
      >
        {/* Outer ring animation */}
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          border: `2px solid ${char.color}${specialActive ? "66" : "22"}`,
          animation: "spin-slow 4s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: -16, borderRadius: "50%",
          border: `1px solid ${char.color}${specialActive ? "44" : "11"}`,
          animation: "spin-slow 8s linear infinite reverse",
        }} />

        {/* Character image */}
        <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", position: "relative" }}>
          <img
            src={char.image}
            alt={char.name}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              filter: specialActive ? `brightness(1.3) drop-shadow(0 0 16px ${char.color})` : "none",
              transition: "filter 0.3s",
              pointerEvents: "none",
            }}
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px">${char.emoji}</div>`;
            }}
            draggable={false}
          />
        </div>

        {/* TAP hint */}
        {totalTaps < 5 && (
          <div style={{ position: "absolute", bottom: -32, fontSize: 12, color: "#664488", fontWeight: 600, animation: "float 1.5s ease-in-out infinite" }}>
            TAP ME 👆
          </div>
        )}
      </div>

      {/* ── ENERGY BAR ── */}
      <div style={{ width: "100%", maxWidth: 380, padding: "12px 20px 0", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#664488", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>⚡ Energy</span>
          <span style={{ fontSize: 10, color: "#664488" }}>{Math.floor(energy)}/{maxEnergy}</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: `${energyPct}%`,
            background: energyPct > 50 ? `linear-gradient(90deg, ${char.color}, ${char.color}cc)` : energyPct > 20 ? "linear-gradient(90deg,#ffaa00,#ffcc44)" : "linear-gradient(90deg,#ff3355,#ff6688)",
            transition: "width 0.1s",
            boxShadow: `0 0 10px ${char.color}88`,
          }} />
        </div>
      </div>

      {/* ── SPECIAL CHARGE BAR ── */}
      <div style={{ width: "100%", maxWidth: 380, padding: "10px 20px 0", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#664488", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>✨ Special</span>
          <span style={{ fontSize: 10, color: specialCharge >= 100 ? char.color : "#664488" }}>{Math.floor(specialCharge)}%</span>
        </div>
        <div
          onClick={launchSpecial}
          style={{
            height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden",
            cursor: specialCharge >= 100 && !specialActive ? "pointer" : "default",
            border: specialCharge >= 100 && !specialActive ? `1px solid ${char.color}88` : "1px solid transparent",
            boxShadow: specialCharge >= 100 ? `0 0 16px ${char.color}66` : "none",
          }}
        >
          <div style={{
            height: "100%", borderRadius: 6,
            width: `${specialPct}%`,
            background: `linear-gradient(90deg, ${char.color}88, ${char.color})`,
            transition: "width 0.15s",
          }} />
        </div>
        {specialCharge >= 100 && !specialActive && (
          <button
            onClick={launchSpecial}
            style={{
              width: "100%", marginTop: 8, padding: "10px",
              background: `linear-gradient(135deg, ${char.color}, ${char.color}88)`,
              border: "none", borderRadius: 10,
              color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
              boxShadow: `0 0 24px ${char.color}88`,
              animation: "pulse-glow 0.6s infinite",
            }}
          >
            ✨ {char.specialName.toUpperCase()} — ACTIVATE!
          </button>
        )}
      </div>

      {/* ── AUTO-TAPPER RATE ── */}
      {(upgrades["helper_1"] || upgrades["helper_2"] || upgrades["helper_3"]) ? (
        <div style={{ marginTop: 10, zIndex: 10, position: "relative", fontSize: 11, color: "#664488" }}>
          🤖 {((upgrades["helper_1"]||0)*1 + (upgrades["helper_2"]||0)*3 + (upgrades["helper_3"]||0)*10).toFixed(0)} auto-taps/sec
        </div>
      ) : null}

      {/* ── FLOATING PARTICLES ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              color: p.color,
              fontWeight: 900,
              fontSize: Math.abs(parseFloat(p.value)) > 100 ? 18 : 14,
              textShadow: `0 0 10px ${p.color}`,
              pointerEvents: "none",
              animation: "coinFloat 1s ease-out forwards",
              whiteSpace: "nowrap",
              transform: "translate(-50%, -50%)",
            }}
          >
            {p.value}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes coinFloat {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(calc(-50% + ${Math.random() > 0.5 ? "" : "-"}${20 + Math.random()*40}px), calc(-50% - 80px)) scale(0.6); }
        }
        .shake { animation: shakeFx 0.2s ease-out; }
        @keyframes shakeFx {
          0%,100% { transform: translate(0,0); }
          20% { transform: translate(-3px,2px); }
          40% { transform: translate(3px,-2px); }
          60% { transform: translate(-2px,3px); }
          80% { transform: translate(2px,-1px); }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
