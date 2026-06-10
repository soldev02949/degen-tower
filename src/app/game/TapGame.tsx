"use client";
import { useState, useEffect, useRef, useCallback } from "react";

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
  { id: "tap_power",    name: "Tap Power",       emoji: "⚡", desc: "Coins per tap",         baseCost: 50,   costMult: 1.8, baseBonus: 1   },
  { id: "energy_max",  name: "Energy Tank",      emoji: "🔋", desc: "Max energy capacity",   baseCost: 100,  costMult: 2.0, baseBonus: 200 },
  { id: "combo_speed", name: "Combo Rush",       emoji: "🔥", desc: "Faster combo buildup",  baseCost: 80,   costMult: 1.9, baseBonus: 0   },
  { id: "helper_1",    name: "FUD Bear Slave",   emoji: "🐻", desc: "+1 auto-tap/sec",        baseCost: 200,  costMult: 2.5, baseBonus: 1   },
  { id: "helper_2",    name: "Bot Army",         emoji: "🤖", desc: "+3 auto-taps/sec",       baseCost: 800,  costMult: 3.0, baseBonus: 3   },
  { id: "helper_3",    name: "Whale Wallet",     emoji: "🐋", desc: "+10 auto-taps/sec",      baseCost: 3000, costMult: 3.5, baseBonus: 10  },
  { id: "special_cd",  name: "Special Cooldown", emoji: "✨", desc: "Faster special charge",  baseCost: 300,  costMult: 2.2, baseBonus: 0   },
  { id: "lucky_strike",name: "Lucky Strike",     emoji: "🎰", desc: "+5% lucky tap chance",   baseCost: 500,  costMult: 2.8, baseBonus: 0   },
];

// ─── Level / Rank system ──────────────────────────────────────────────────
function getLevel(totalEarned: number) {
  return Math.max(1, Math.floor(Math.log2(totalEarned / 100 + 1)) + 1);
}
function getRank(level: number) {
  if (level >= 50) return { name: "Degen God",    color: "#ff00ff", emoji: "👑" };
  if (level >= 40) return { name: "Tower Lord",   color: "#f5c842", emoji: "🏆" };
  if (level >= 30) return { name: "Sigma",        color: "#e0b87a", emoji: "💪" };
  if (level >= 20) return { name: "Diamond Ape",  color: "#88ccff", emoji: "💎" };
  if (level >= 15) return { name: "Gold Degen",   color: "#f5c842", emoji: "🥇" };
  if (level >= 10) return { name: "Silver Degen", color: "#aaaaaa", emoji: "🥈" };
  if (level >= 5)  return { name: "Bronze Ape",   color: "#cd7f32", emoji: "🥉" };
  if (level >= 3)  return { name: "Normie",       color: "#22d67a", emoji: "🐸" };
  return { name: "Ngmi", color: "#6b6b8a", emoji: "😴" };
}

// ─── Types ────────────────────────────────────────────────────────────────
interface SaveData {
  charId: string;
  coins: number;
  totalEarned: number;
  totalTaps: number;
  level: number;
  upgrades: Record<string, number>;
  highScore: number;
}
interface Particle {
  id: number; x: number; y: number;
  value: string; color: string; vx: number; vy: number;
}
interface LBEntry {
  id: string; username: string; character: string;
  total_score: number; games_played: number; is_verified: boolean;
}

// ─── Utility ─────────────────────────────────────────────────────────────
function loadSave(charId: string): SaveData {
  try { const raw = localStorage.getItem(`degen_save_${charId}`); if (raw) return JSON.parse(raw); } catch {}
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

// 48hr countdown
function useCountdown() {
  const [t, setT] = useState("");
  useEffect(() => {
    function calc() {
      const now = Date.now();
      const period = 48 * 60 * 60 * 1000;
      const next = Math.ceil(now / period) * period;
      const diff = next - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setT(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, []);
  return t;
}

// ─────────────────────────────────────────────────────────────────────────
//  BOTTOM TAB BAR
// ─────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",        label: "Home",        emoji: "🏠" },
  { id: "play",        label: "Play",        emoji: "🎮" },
  { id: "shop",        label: "Shop",        emoji: "⚡" },
  { id: "leaderboard", label: "Ranks",       emoji: "🏆" },
];

function BottomBar({ active, onTab }: { active: string; onTab: (t: string) => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(8,0,16,0.97)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      backdropFilter: "blur(16px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTab(tab.id)}
          style={{
            flex: 1, background: "none", border: "none",
            padding: "10px 0 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer",
            opacity: active === tab.id ? 1 : 0.45,
            transition: "opacity 0.15s",
            position: "relative",
          }}
        >
          {active === tab.id && (
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
              background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
              borderRadius: "0 0 2px 2px",
            }} />
          )}
          <span style={{ fontSize: 20 }}>{tab.emoji}</span>
          <span style={{
            fontSize: 10, fontWeight: active === tab.id ? 800 : 500,
            color: active === tab.id ? "#fff" : "#888",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  HOME TAB
// ─────────────────────────────────────────────────────────────────────────
function HomeTab({ onPlay }: { onPlay: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a000f", color: "#e8e8f0", paddingBottom: 80, overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(120,40,200,0.22) 0%, transparent 55%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "52px 20px 32px" }}>
        <img src="/logo.png" alt="Degen Clicker" style={{ width: 180, height: 180, objectFit: "contain", marginBottom: 4 }} />
        <p style={{ color: "#9966bb", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          Pick a meme character · Tap to earn $TOWER<br />
          Upgrade your rig · Win the USDC reward pool
        </p>
        <button onClick={onPlay} style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          color: "#fff", fontWeight: 900, fontSize: 18,
          border: "none", borderRadius: 16, padding: "18px 48px", cursor: "pointer",
          boxShadow: "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)",
        }}>
          🎮 Play Now — Free
        </button>

        {/* Stats */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          {[["💰","$TOWER","Tap to Earn"],["⏱","48hrs","Reset Cycle"],["🏆","Top 10","Win USDC"],["⚡","5","Characters"]].map(([emoji,val,label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{emoji}</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{val}</div>
              <div style={{ color: "#664488", fontSize: 10 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Characters strip */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 16px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 16 }}>Choose Your Fighter</h2>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" as any }}>
          {CHARACTERS.map(c => (
            <button key={c.id} onClick={onPlay} style={{
              flex: "0 0 110px", background: "rgba(255,255,255,0.02)",
              border: `1px solid ${c.color}33`, borderRadius: 14, padding: "14px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              cursor: "pointer",
            }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${c.color}22`, border: `2px solid ${c.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                <img src={c.image} alt={c.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:30px">${c.emoji}</span>`; }} />
              </div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{c.name}</div>
              <div style={{ color: c.color, fontSize: 9, fontWeight: 700 }}>{c.ability}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 16px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["🔥","Combo System","Tap fast for up to 20× multiplier"],
            ["🤖","Auto-Tappers","Hire helpers to earn while idle"],
            ["✨","Special Moves","Charge up and unleash burst mode"],
            ["📊","Level & Rank","Earn XP → level up → climb ranks"],
          ].map(([emoji,title,desc]) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 12px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 12, marginBottom: 4 }}>{title}</div>
              <div style={{ color: "#664488", fontSize: 11 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  LEADERBOARD TAB
// ─────────────────────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [players, setPlayers] = useState<LBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown();

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.from("dt_players").select("*").order("total_score", { ascending: false }).limit(50)
        .then(({ data }) => { setPlayers((data || []) as LBEntry[]); setLoading(false); });
    });
  }, []);

  const medals = ["🥇","🥈","🥉"];
  const CHAR_EMOJI: Record<string,string> = { pepe:"🐸", gigachad:"💪", trump:"🎩", troll:"🧌", bonk:"🐕" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a000f", paddingBottom: 90, overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(10,0,20,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}>
        <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0 }}>🏆 Leaderboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span style={{ color: "#664488", fontSize: 12 }}>Resets in</span>
          <span style={{ color: "#f5c842", fontWeight: 900, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
        </div>
      </div>

      <div style={{ padding: "12px 12px 0" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>Loading...</div>
        ) : players.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ color: "#664488", fontSize: 16, fontWeight: 700 }}>No players yet — be first!</div>
          </div>
        ) : players.map((p, i) => {
          const level = getLevel(p.total_score || 0);
          const rank = getRank(level);
          const xpPct = Math.min(100, ((p.total_score||0) / Math.round(100*(Math.pow(2,level)-1))) * 100);
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: i < 3 ? `rgba(${i===0?"245,200,66":i===1?"160,160,160":"205,127,50"},0.05)` : "rgba(255,255,255,0.01)",
              border: `1px solid rgba(255,255,255,${i < 3 ? "0.06" : "0.03"})`,
              borderRadius: 12, padding: "10px 12px", marginBottom: 6,
            }}>
              {/* Pos */}
              <div style={{ width: 32, textAlign: "center", fontSize: i < 3 ? 20 : 13, fontWeight: 900, color: i < 3 ? undefined : "#555", flexShrink: 0 }}>
                {i < 3 ? medals[i] : `#${i+1}`}
              </div>
              {/* Char emoji */}
              <div style={{ fontSize: 22, flexShrink: 0 }}>{CHAR_EMOJI[p.character] || "🎮"}</div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.username || "Anonymous"}
                  </span>
                  <span style={{ flexShrink: 0, background: `${rank.color}22`, border: `1px solid ${rank.color}44`, borderRadius: 4, padding: "1px 5px", fontSize: 9, color: rank.color, fontWeight: 700 }}>
                    {rank.emoji} {rank.name}
                  </span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${xpPct}%`, height: "100%", background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`, borderRadius: 2 }} />
                </div>
                <div style={{ color: "#445", fontSize: 9, marginTop: 2 }}>Lv.{level}</div>
              </div>
              {/* Score */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#f5c842", fontWeight: 900, fontSize: 14 }}>💰 {formatNum(p.total_score||0)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank guide */}
      <div style={{ margin: "16px 12px 0", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px" }}>
        <div style={{ fontSize: 11, color: "#664488", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rank Ladder</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[[1,"Ngmi","#6b6b8a","😴"],[3,"Normie","#22d67a","🐸"],[5,"Bronze Ape","#cd7f32","🥉"],[10,"Silver Degen","#aaa","🥈"],[15,"Gold Degen","#f5c842","🥇"],[20,"Diamond Ape","#88ccff","💎"],[30,"Sigma","#e0b87a","💪"],[40,"Tower Lord","#f5c842","🏆"],[50,"Degen God","#ff00ff","👑"]].map(([lv,name,color,emoji]) => (
            <div key={lv as string} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color as string}33`, borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>{emoji}</span>
              <span style={{ color: color as string, fontSize: 9, fontWeight: 700 }}>Lv.{lv}+ {name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function TapGame() {
  // Tab navigation — "home" | "play" | "shop" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"home" | "play" | "shop" | "leaderboard">("home");

  // Play sub-screens — "select" | "game" | "upgrades"
  const [screen, setScreen] = useState<"select" | "game" | "upgrades">("select");
  const [charId, setCharId] = useState<string | null>(null);

  // Game state
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy, setMaxEnergy] = useState(1000);
  const [combo, setCombo] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [specialCharge, setSpecialCharge] = useState(0);
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
    setCoins(s.coins);
    setTotalEarned(s.totalEarned);
    setTotalTaps(s.totalTaps);
    setUpgrades(s.upgrades);
    const newMax = 1000 + (s.upgrades["energy_max"] || 0) * 200;
    setMaxEnergy(newMax);
    setEnergy(newMax);
    setScreen("game");
    saveRef.current = s;
    setActiveTab("play");
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
    if (activeTab !== "play" || screen !== "game" || !char) return;
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
  }, [upgrades, activeTab, screen, char, specialActive]);

  // ── Energy regen ──
  useEffect(() => {
    if (activeTab !== "play" || screen !== "game" || !char) return;
    const regenRate = char.energyRegen * (specialActive && char.id === "bonk" ? 999 : 1);
    const interval = setInterval(() => {
      setEnergy(e => Math.min(maxEnergy, e + regenRate * 0.05));
    }, 50);
    return () => clearInterval(interval);
  }, [activeTab, screen, char, maxEnergy, specialActive]);

  // ── Combo decay ──
  useEffect(() => {
    if (activeTab !== "play" || screen !== "game") return;
    const interval = setInterval(() => {
      setComboTimer(t => {
        if (t <= 0) { setCombo(1); return 0; }
        return t - 0.05;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [activeTab, screen]);

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

    let tapX = 0, tapY = 0;
    if ("touches" in e && e.touches.length > 0) { tapX = e.touches[0].clientX; tapY = e.touches[0].clientY; }
    else if ("clientX" in e) { tapX = e.clientX; tapY = e.clientY; }

    const tapPowerUpg = upgrades["tap_power"] || 0;
    const tapBase = char.baseCoins + tapPowerUpg;
    const specialMult = specialActive ? char.specialMultiplier : 1;
    let earned = tapBase * combo * specialMult;
    earned = char.passive(earned);

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    if (char.id === "trump" && newTapCount % 50 === 0) {
      earned *= 10;
      spawnParticle(tapX, tapY, "💼 DEAL!", "#f5c842", true);
    }
    if (specialActive && char.id === "troll") earned = earned * (1 + Math.random() * 14);

    earned = Math.max(0.1, earned);
    const displayEarned = Math.round(earned * 10) / 10;
    spawnParticle(tapX, tapY, `+${formatNum(displayEarned)}`, getCoinColor(earned), false);

    setCoins(c => c + earned);
    setTotalEarned(t => t + earned);
    setTotalTaps(t => t + 1);

    const energyCost = specialActive && char.id === "bonk" ? 0 : 1;
    setEnergy(e => Math.max(0, e - energyCost));

    const comboSpeed = upgrades["combo_speed"] ? 1 + upgrades["combo_speed"] * 0.2 : 1;
    const gigaBonus = char.id === "gigachad" ? 2 : 1;
    const comboGain = 0.3 * comboSpeed * gigaBonus;
    const maxCombo = char.comboMax + (char.id === "gigachad" ? (upgrades["combo_speed"] || 0) * 2 : 0);
    setCombo(c => Math.min(maxCombo, c + comboGain));
    setComboTimer(0.8);
    setSpecialCharge(s => Math.min(100, s + 2));

    setCharPulse(true);
    setTimeout(() => setCharPulse(false), 120);
    if (earned > tapBase * 3) { setShaking(true); setTimeout(() => setShaking(false), 200); }
  }, [char, energy, combo, tapCount, upgrades, specialActive]);

  // ── Launch special ──
  const launchSpecial = useCallback(() => {
    if (!char || specialCharge < 100 || specialActive) return;
    setSpecialActive(true);
    setSpecialCharge(0);
    setSpecialTimer(char.specialDuration);
    if (char.id === "gigachad") setCombo(char.comboMax);
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnParticle(
        window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        window.innerHeight / 2 + (Math.random() - 0.5) * 200,
        ["💥","⚡","🔥","✨","💫"][Math.floor(Math.random()*5)], char.color, true
      ), i * 80);
    }
  }, [char, specialCharge, specialActive]);

  // ── Buy upgrade ──
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
    setParticles(p => [...p.slice(-30), { id, x, y, value: text, color, vx: (Math.random()-0.5)*(big?120:60), vy: -(big?120:80)-Math.random()*40 }]);
    setTimeout(() => setParticles(p => p.filter(pp => pp.id !== id)), 1000);
  }
  function getCoinColor(a: number) {
    if (a >= 50) return "#f5c842"; if (a >= 10) return "#22d67a"; if (a >= 3) return "#a855f7"; return "#e8e8f0";
  }

  // ── Handle tab navigation ──
  function handleTab(t: string) {
    setActiveTab(t as any);
    if (t === "play" && screen === "select" && !charId) { /* stay on select */ }
    if (t === "shop") setScreen("upgrades");
    else if (t === "play" && screen === "upgrades") setScreen("game");
  }

  // ═══════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════

  return (
    <div style={{ background: "#0a000f", minHeight: "100vh", position: "relative" }}>
      {/* ── HOME TAB ── */}
      {activeTab === "home" && (
        <HomeTab onPlay={() => { setActiveTab("play"); if (!charId) setScreen("select"); else setScreen("game"); }} />
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === "leaderboard" && <LeaderboardTab />}

      {/* ── SHOP TAB (standalone, works without being in-game) ── */}
      {activeTab === "shop" && (
        <div style={{ minHeight: "100vh", background: "#0a000f", color: "#fff", paddingBottom: 80 }}>
          <div style={{ background: "rgba(10,0,20,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>⚡ Upgrade Shop</h2>
            {charId && (
              <div style={{ marginLeft: "auto", background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)", borderRadius: 10, padding: "6px 14px", fontSize: 14, fontWeight: 800, color: "#f5c842" }}>
                💰 {formatNum(coins)}
              </div>
            )}
          </div>

          {!charId ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <div style={{ color: "#664488", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Select a character first</div>
              <button onClick={() => setActiveTab("play")} style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Pick a Character
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {UPGRADES.map(upg => {
                  const level = upgrades[upg.id] || 0;
                  const cost = getUpgradeCost(upg, level);
                  const canAfford = coins >= cost;
                  return (
                    <button key={upg.id} onClick={() => buyUpgrade(upg.id)} disabled={!canAfford} style={{
                      background: canAfford ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                      border: `1px solid ${canAfford ? "rgba(245,200,66,0.25)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 14, padding: "14px 12px", cursor: canAfford ? "pointer" : "not-allowed",
                      textAlign: "left", opacity: canAfford ? 1 : 0.5, transition: "all 0.15s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 22 }}>{upg.emoji}</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{upg.name}</span>
                        {level > 0 && <span style={{ marginLeft: "auto", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 5, padding: "1px 6px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>Lv.{level}</span>}
                      </div>
                      <div style={{ color: "#6b6b8a", fontSize: 11, marginBottom: 8 }}>{upg.desc}</div>
                      <div style={{ color: canAfford ? "#f5c842" : "#555", fontWeight: 800, fontSize: 13 }}>💰 {formatNum(cost)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PLAY TAB ── */}
      {activeTab === "play" && (
        <>
          {/* Character Select */}
          {screen === "select" && (
            <div style={{ minHeight: "100vh", background: "#0a000f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px 96px", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(120,40,200,0.2) 0%, transparent 65%)", pointerEvents: "none" }} />
              <div style={{ textAlign: "center", marginBottom: 32, position: "relative", zIndex: 1 }}>
                <img src="/logo.png" alt="Degen Clicker" style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 8 }} />
                <p style={{ color: "#9955cc", fontSize: 14 }}>Choose your degen — each has unique powers</p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 680, position: "relative", zIndex: 1 }}>
                {CHARACTERS.map(c => {
                  const saved = loadSave(c.id);
                  return (
                    <button key={c.id} onClick={() => startGame(c.id)} style={{
                      width: 110, background: "rgba(255,255,255,0.03)", border: `2px solid ${c.color}33`,
                      borderRadius: 16, cursor: "pointer", padding: "14px 8px",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = `${c.color}18`; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${c.glow}`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${c.color}33`; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: `2px solid ${c.color}66`, background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={c.image} alt={c.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "50%" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:36px">${c.emoji}</span>`; }} />
                      </div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{c.name}</div>
                      <div style={{ background: `${c.color}22`, border: `1px solid ${c.color}55`, borderRadius: 5, padding: "2px 7px", fontSize: 9, color: c.color, fontWeight: 700, textAlign: "center" }}>{c.ability}</div>
                      {saved.totalEarned > 0 && <div style={{ fontSize: 9, color: "#666" }}>💰 {formatNum(saved.totalEarned)}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Game */}
          {screen === "game" && char && (
            <div style={{ minHeight: "100vh", background: "#0a000f", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", paddingBottom: 80 }} className={shaking ? "shake" : ""}>
              <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 60%, ${char.glow.replace("0.6", specialActive ? "0.35" : "0.18")} 0%, transparent 65%)`, transition: "background 0.5s" }} />

              {/* Top bar */}
              <div style={{ width: "100%", maxWidth: 480, padding: "12px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10, position: "relative" }}>
                <button onClick={() => setScreen("select")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>⬅</button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#f5c842", letterSpacing: "-0.02em" }}>💰 {formatNum(coins)}</div>
                  <div style={{ fontSize: 10, color: "#664488", textTransform: "uppercase", letterSpacing: "0.08em" }}>$TOWER</div>
                </div>
                <button onClick={() => setActiveTab("shop")} style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.25)", color: "#f5c842", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>⚡ Shop</button>
              </div>

              {/* Stats row */}
              <div style={{ width: "100%", maxWidth: 480, padding: "0 16px 10px", display: "flex", gap: 8, zIndex: 10, position: "relative" }}>
                {[
                  { label: "Total Earned", val: `💰 ${formatNum(totalEarned)}` },
                  { label: "Total Taps", val: `👆 ${formatNum(totalTaps)}` },
                  { label: "Ability", val: char.ability, color: char.color },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color ? `${s.color}44` : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ color: "#6b6b8a", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ color: s.color || "#e8e8f0", fontWeight: 800, fontSize: 11 }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Combo */}
              {combo > 1.5 && (
                <div style={{ position: "relative", zIndex: 10, background: `linear-gradient(135deg, ${char.color}33, ${char.color}11)`, border: `1px solid ${char.color}66`, borderRadius: 20, padding: "4px 20px", marginBottom: 6, fontSize: 16, fontWeight: 900, color: char.color, textShadow: `0 0 20px ${char.color}`, animation: "pulse-glow 0.5s infinite" }}>
                  ×{(Math.floor(combo * 10) / 10).toFixed(1)} COMBO
                </div>
              )}

              {/* Special active */}
              {specialActive && (
                <div style={{ position: "relative", zIndex: 10, background: `linear-gradient(135deg, ${char.color}, #ff00cc)`, borderRadius: 20, padding: "4px 24px", marginBottom: 6, fontSize: 13, fontWeight: 900, color: "#fff", boxShadow: `0 0 30px ${char.color}`, animation: "pulse-glow 0.3s infinite" }}>
                  ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
                </div>
              )}

              {/* Tap character */}
              <div ref={tapAreaRef} onMouseDown={handleTap} onTouchStart={handleTap} style={{
                position: "relative", zIndex: 10, width: 210, height: 210, borderRadius: "50%",
                background: `radial-gradient(circle, ${char.color}22 0%, transparent 70%)`,
                border: `3px solid ${char.color}${specialActive ? "ff" : "55"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.1s",
                transform: charPulse ? "scale(0.93)" : "scale(1)",
                boxShadow: specialActive ? `0 0 60px ${char.color}, 0 0 120px ${char.color}66` : `0 0 ${combo > 3 ? 40 : 20}px ${char.color}44`,
                margin: "8px 0", WebkitTapHighlightColor: "transparent", touchAction: "none",
              }}>
                <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `2px solid ${char.color}${specialActive ? "66" : "22"}`, animation: "spin-slow 4s linear infinite" }} />
                <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: `1px solid ${char.color}${specialActive ? "44" : "11"}`, animation: "spin-slow 8s linear infinite reverse" }} />
                <div style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", position: "relative" }}>
                  <img src={char.image} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: specialActive ? `brightness(1.3) drop-shadow(0 0 16px ${char.color})` : "none", transition: "filter 0.3s", pointerEvents: "none" }} onError={e => { const el = e.target as HTMLImageElement; el.style.display = "none"; el.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:72px">${char.emoji}</div>`; }} draggable={false} />
                </div>
                {totalTaps < 5 && <div style={{ position: "absolute", bottom: -30, fontSize: 12, color: "#664488", fontWeight: 600, animation: "float 1.5s ease-in-out infinite" }}>TAP ME 👆</div>}
              </div>

              {/* Energy bar */}
              <div style={{ width: "100%", maxWidth: 360, padding: "10px 20px 0", position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#664488", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>⚡ Energy</span>
                  <span style={{ fontSize: 10, color: "#664488" }}>{Math.floor(energy)}/{maxEnergy}</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${(energy/maxEnergy)*100}%`, background: (energy/maxEnergy) > 0.5 ? `linear-gradient(90deg, ${char.color}, ${char.color}cc)` : (energy/maxEnergy) > 0.2 ? "linear-gradient(90deg,#ffaa00,#ffcc44)" : "linear-gradient(90deg,#ff3355,#ff6688)", transition: "width 0.1s", boxShadow: `0 0 10px ${char.color}88` }} />
                </div>
              </div>

              {/* Special charge bar */}
              <div style={{ width: "100%", maxWidth: 360, padding: "10px 20px 0", position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#664488", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>✨ Special</span>
                  <span style={{ fontSize: 10, color: specialCharge >= 100 ? char.color : "#664488" }}>{Math.floor(specialCharge)}%</span>
                </div>
                <div onClick={launchSpecial} style={{ height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden", cursor: specialCharge >= 100 && !specialActive ? "pointer" : "default", border: specialCharge >= 100 && !specialActive ? `1px solid ${char.color}88` : "1px solid transparent", boxShadow: specialCharge >= 100 ? `0 0 16px ${char.color}66` : "none" }}>
                  <div style={{ height: "100%", borderRadius: 6, width: `${specialCharge}%`, background: `linear-gradient(90deg, ${char.color}88, ${char.color})`, transition: "width 0.15s" }} />
                </div>
                {specialCharge >= 100 && !specialActive && (
                  <button onClick={launchSpecial} style={{ width: "100%", marginTop: 8, padding: "10px", background: `linear-gradient(135deg, ${char.color}, ${char.color}88)`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: `0 0 24px ${char.color}88`, animation: "pulse-glow 0.6s infinite" }}>
                    ✨ {char.specialName.toUpperCase()} — ACTIVATE!
                  </button>
                )}
              </div>

              {/* Auto-tapper rate */}
              {(upgrades["helper_1"] || upgrades["helper_2"] || upgrades["helper_3"]) ? (
                <div style={{ marginTop: 8, zIndex: 10, position: "relative", fontSize: 11, color: "#664488" }}>
                  🤖 {((upgrades["helper_1"]||0)*1 + (upgrades["helper_2"]||0)*3 + (upgrades["helper_3"]||0)*10).toFixed(0)} auto-taps/sec
                </div>
              ) : null}

              {/* Floating particles */}
              <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
                {particles.map(p => (
                  <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y, color: p.color, fontWeight: 900, fontSize: Math.abs(parseFloat(p.value)) > 100 ? 18 : 14, textShadow: `0 0 10px ${p.color}`, pointerEvents: "none", animation: "coinFloat 1s ease-out forwards", whiteSpace: "nowrap", transform: "translate(-50%, -50%)" }}>
                    {p.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shop screen from within Play tab */}
          {screen === "upgrades" && char && (
            <div style={{ minHeight: "100vh", background: "#0a000f", color: "#fff", paddingBottom: 80 }}>
              <div style={{ background: "rgba(10,0,20,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
                <button onClick={() => setScreen("game")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
                <h2 style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>⚡ Upgrade Shop</h2>
                <div style={{ marginLeft: "auto", background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)", borderRadius: 10, padding: "5px 12px", fontSize: 14, fontWeight: 800, color: "#f5c842" }}>💰 {formatNum(coins)}</div>
              </div>
              <div style={{ padding: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {UPGRADES.map(upg => {
                    const level = upgrades[upg.id] || 0;
                    const cost = getUpgradeCost(upg, level);
                    const canAfford = coins >= cost;
                    return (
                      <button key={upg.id} onClick={() => buyUpgrade(upg.id)} disabled={!canAfford} style={{ background: canAfford ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${canAfford ? "rgba(245,200,66,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "14px 12px", cursor: canAfford ? "pointer" : "not-allowed", textAlign: "left", opacity: canAfford ? 1 : 0.5, transition: "all 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 22 }}>{upg.emoji}</span>
                          <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{upg.name}</span>
                          {level > 0 && <span style={{ marginLeft: "auto", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 5, padding: "1px 6px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>Lv.{level}</span>}
                        </div>
                        <div style={{ color: "#6b6b8a", fontSize: 11, marginBottom: 8 }}>{upg.desc}</div>
                        <div style={{ color: canAfford ? "#f5c842" : "#555", fontWeight: 800, fontSize: 13 }}>💰 {formatNum(cost)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── BOTTOM TAB BAR (always visible) ── */}
      <BottomBar active={activeTab} onTab={handleTab} />

      <style>{`
        @keyframes coinFloat {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% - 80px)) scale(0.6); }
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
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
