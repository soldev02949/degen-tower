"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { Trophy, Clock, Zap, ArrowLeft } from "lucide-react";

const MOCK_PLAYERS = [
  { rank: 1, name: "DegenApe420", char: "🐸", floor: 847, score: 94200, wallet: "8xKp...4rQn", reward: "20%", time: "2h ago" },
  { rank: 2, name: "SolKing999", char: "💪", floor: 801, score: 87400, wallet: "3mFz...9pLk", reward: "15%", time: "4h ago" },
  { rank: 3, name: "MemeLord", char: "🎩", floor: 756, score: 82100, wallet: "7yRt...2wXc", reward: "10%", time: "1h ago" },
  { rank: 4, name: "PepeMaxi", char: "🐸", floor: 712, score: 74300, wallet: "1nWq...8mSd", reward: "Equal Split", time: "30m ago" },
  { rank: 5, name: "GigaClimber", char: "💪", floor: 689, score: 71200, wallet: "5cBh...6tFv", reward: "Equal Split", time: "5h ago" },
  { rank: 6, name: "TrollBridge", char: "🧌", floor: 654, score: 68900, wallet: "9pAj...1vNe", reward: "Equal Split", time: "3h ago" },
  { rank: 7, name: "SatoshiDegen", char: "🐸", floor: 612, score: 64100, wallet: "4kMl...7gPq", reward: "Equal Split", time: "6h ago" },
  { rank: 8, name: "RektRecovery", char: "🎩", floor: 589, score: 61700, wallet: "2rUo...0hBw", reward: "Equal Split", time: "8h ago" },
  { rank: 9, name: "FloorChaser", char: "💪", floor: 543, score: 57300, wallet: "6wEi...3zKx", reward: "Equal Split", time: "2h ago" },
  { rank: 10, name: "MoonAscender", char: "🧌", floor: 521, score: 54800, wallet: "0tYc...5jRa", reward: "Equal Split", time: "7h ago" },
  { rank: 11, name: "ViralPepe", char: "🐸", floor: 498, score: 51200, wallet: "3nHv...8bLd", reward: "Equal Split", time: "1h ago" },
  { rank: 12, name: "SolanaSlayer", char: "💪", floor: 476, score: 49600, wallet: "7dXm...2fWz", reward: "Equal Split", time: "4h ago" },
  { rank: 13, name: "DegenLord69", char: "🎩", floor: 453, score: 46900, wallet: "1qTs...9kCe", reward: "Equal Split", time: "5h ago" },
  { rank: 14, name: "PlatformKing", char: "🧌", floor: 431, score: 44200, wallet: "5oJp...4yAb", reward: "Equal Split", time: "3h ago" },
  { rank: 15, name: "CryptoClimber", char: "🐸", floor: 412, score: 42800, wallet: "8gZu...6rMs", reward: "Equal Split", time: "9h ago" },
  { rank: 16, name: "TokenHolder", char: "💪", floor: 398, score: 41100, wallet: "2vFn...1xPc", reward: "Equal Split", time: "2h ago" },
  { rank: 17, name: "WenMoon", char: "🎩", floor: 376, score: 38700, wallet: "6bRy...7tGq", reward: "Equal Split", time: "6h ago" },
  { rank: 18, name: "NFA_Dev", char: "🧌", floor: 354, score: 36200, wallet: "0kNe...3wLo", reward: "Equal Split", time: "4h ago" },
  { rank: 19, name: "GasFeeKing", char: "🐸", floor: 332, score: 34100, wallet: "4pWs...9hQi", reward: "Equal Split", time: "11h ago" },
  { rank: 20, name: "LastChance", char: "💪", floor: 311, score: 31800, wallet: "8cBj...5mTv", reward: "Equal Split", time: "3h ago" },
];

const REWARD_POOL = 4820; // Mock USDC pool

function Countdown() {
  // Mock time remaining
  const h = 8, m = 34, s = 12;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {[
        { val: h, label: "H" },
        { val: m, label: "M" },
        { val: s, label: "S" },
      ].map(({ val, label }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 10px",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--gold)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {String(val).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"daily" | "alltime">("daily");

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <StarField />
      <Navbar />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "100px 24px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>
            🏆 Leaderboard
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 15 }}>
          Top 20 players split the daily USDC pool. Resets every 24 hours.
        </p>

        {/* Reward pool banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,200,66,0.12) 0%, rgba(245,200,66,0.04) 100%)",
          border: "1px solid rgba(245,200,66,0.3)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Today&apos;s Reward Pool</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--gold)" }}>
              ${REWARD_POOL.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>USDC</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <Clock size={12} /> Resets in
            </div>
            <Countdown />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", borderRadius: 8, padding: 4, width: "fit-content" }}>
          {(["daily", "alltime"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "var(--surface-2)" : "transparent",
                border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 6,
                padding: "8px 16px",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
                fontWeight: tab === t ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "daily" ? "Today" : "All Time"}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 12, marginBottom: 20 }}>
          {[MOCK_PLAYERS[1], MOCK_PLAYERS[0], MOCK_PLAYERS[2]].map((p, i) => {
            const pos = [2, 1, 3][i];
            const heights = ["80px", "100px", "70px"];
            const colors = ["#94a3b8", "#f5c842", "#cd7f32"];
            return (
              <div key={p.name} className="card" style={{
                textAlign: "center",
                padding: "16px 12px",
                marginTop: i === 1 ? 0 : 20,
                borderColor: pos === 1 ? "rgba(245,200,66,0.4)" : "var(--border)",
                background: pos === 1 ? "rgba(245,200,66,0.06)" : "var(--surface)",
                position: "relative",
              }}>
                {pos === 1 && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 22 }}>👑</div>
                )}
                <div style={{ fontSize: 28, marginBottom: 4 }}>{p.char}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Floor {p.floor}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: colors[i] }}>#{pos}</div>
                <div style={{ fontSize: 11, color: colors[i], marginTop: 4, fontWeight: 600 }}>{p.reward}</div>
              </div>
            );
          })}
        </div>

        {/* Full leaderboard table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 80px 80px 100px",
            padding: "12px 20px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border)",
          }}>
            <div>#</div>
            <div>Player</div>
            <div style={{ textAlign: "center" }}>Floor</div>
            <div style={{ textAlign: "center" }}>Score</div>
            <div style={{ textAlign: "right" }}>Reward</div>
          </div>

          {MOCK_PLAYERS.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 80px 80px 100px",
                padding: "14px 20px",
                borderBottom: i < MOCK_PLAYERS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                alignItems: "center",
                background: p.rank <= 3 ? "rgba(245,200,66,0.03)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = p.rank <= 3 ? "rgba(245,200,66,0.03)" : "transparent"}
            >
              <div style={{
                fontWeight: 800,
                color: p.rank === 1 ? "#f5c842" : p.rank === 2 ? "#94a3b8" : p.rank === 3 ? "#cd7f32" : "var(--text-muted)",
                fontSize: p.rank <= 3 ? 16 : 13,
              }}>
                {p.rank <= 3 ? ["🥇", "🥈", "🥉"][p.rank - 1] : p.rank}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>{p.char}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.wallet}</div>
                </div>
              </div>
              <div style={{ textAlign: "center", fontWeight: 700, color: "var(--gold)", fontSize: 14 }}>{p.floor}</div>
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>{p.score.toLocaleString()}</div>
              <div style={{ textAlign: "right", fontSize: 12, fontWeight: 600, color: p.rank <= 3 ? "var(--gold)" : "var(--green)" }}>{p.reward}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/game">
            <button className="btn-primary" style={{ fontSize: 15, padding: "12px 32px" }}>
              <Zap size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Climb Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
