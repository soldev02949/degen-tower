"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { Trophy, Clock, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { supabase, charEmoji, rewardLabel, shortWallet } from "@/lib/supabase";
import type { LeaderboardEntry, RewardPool } from "@/lib/supabase";

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {[
        { val: timeLeft.h, label: "H" },
        { val: timeLeft.m, label: "M" },
        { val: timeLeft.s, label: "S" },
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
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [pool, setPool] = useState<RewardPool | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("dt_leaderboard_daily")
      .select("*, dt_players(username, character, wallet_address)")
      .eq("leaderboard_date", today)
      .order("score", { ascending: false })
      .limit(20);
    setPlayers((data as LeaderboardEntry[]) ?? []);

    const { data: poolData } = await supabase
      .from("dt_reward_pool")
      .select("pool_date, total_usdc, distributed")
      .eq("pool_date", today)
      .single();
    setPool(poolData as RewardPool | null);
    setLoading(false);
  }, []);

  const fetchAllTime = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dt_players")
      .select("id, total_score, highest_floor, username, character, wallet_address")
      .order("total_score", { ascending: false })
      .limit(20);

    const mapped: LeaderboardEntry[] = (data ?? []).map((p: {
      id: string; total_score: number; highest_floor: number;
      username: string; character: string; wallet_address: string;
    }, i: number) => ({
      id: p.id,
      player_id: p.id,
      score: p.total_score,
      floor_reached: p.highest_floor,
      leaderboard_date: "",
      rank: i + 1,
      reward_percentage: null,
      dt_players: { username: p.username, character: p.character, wallet_address: p.wallet_address },
    }));
    setPlayers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "daily") fetchDaily();
    else fetchAllTime();
  }, [tab, fetchDaily, fetchAllTime]);

  const rewardPoolAmount = pool?.total_usdc ?? 0;

  const top3 = players.length >= 3
    ? [players[1], players[0], players[2]]
    : players;

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
              ${Number(rewardPoolAmount).toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>USDC</span>
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <Loader2 size={32} style={{ animation: "spin-slow 1s linear infinite", margin: "0 auto 12px" }} />
            <div>Loading leaderboard...</div>
          </div>
        ) : players.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No players yet</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Be the first to climb the tower and claim the top spot!</div>
            <Link href="/game" style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{ marginTop: 24, fontSize: 15, padding: "12px 32px" }}>
                <Zap size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                Start Climbing
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 12, marginBottom: 20 }}>
                {top3.map((p, i) => {
                  const pos = [2, 1, 3][i];
                  const colors = ["#94a3b8", "#f5c842", "#cd7f32"];
                  const name = p.dt_players?.username ?? "Unknown";
                  const char = charEmoji(p.dt_players?.character ?? "pepe");
                  return (
                    <div key={p.id} className="card" style={{
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
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{char}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Floor {p.floor_reached}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: colors[i] }}>#{pos}</div>
                      <div style={{ fontSize: 11, color: colors[i], marginTop: 4, fontWeight: 600 }}>{rewardLabel(pos)}</div>
                    </div>
                  );
                })}
              </div>
            )}

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

              {players.map((p, i) => {
                const rank = i + 1;
                const name = p.dt_players?.username ?? "Unknown";
                const char = charEmoji(p.dt_players?.character ?? "pepe");
                const wallet = shortWallet(p.dt_players?.wallet_address ?? "");
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 80px 80px 100px",
                      padding: "14px 20px",
                      borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      alignItems: "center",
                      background: rank <= 3 ? "rgba(245,200,66,0.03)" : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = rank <= 3 ? "rgba(245,200,66,0.03)" : "transparent"}
                  >
                    <div style={{
                      fontWeight: 800,
                      color: rank === 1 ? "#f5c842" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : "var(--text-muted)",
                      fontSize: rank <= 3 ? 16 : 13,
                    }}>
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 18 }}>{char}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{wallet}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontWeight: 700, color: "var(--gold)", fontSize: 14 }}>{p.floor_reached}</div>
                    <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>{p.score.toLocaleString()}</div>
                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 600, color: rank <= 3 ? "var(--gold)" : "var(--green)" }}>{rewardLabel(rank)}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link href="/game">
                <button className="btn-primary" style={{ fontSize: 15, padding: "12px 32px" }}>
                  <Zap size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Climb Now
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
