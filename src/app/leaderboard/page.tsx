"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ─── Level / Rank system ──────────────────────────────────────────────────
// XP = totalEarned; Level = floor(log2(totalEarned/100 + 1)) + 1
// Every level-up moves you up the leaderboard
function getLevel(totalEarned: number) {
  return Math.max(1, Math.floor(Math.log2(totalEarned / 100 + 1)) + 1);
}
function getXPForNextLevel(level: number) {
  return Math.round(100 * (Math.pow(2, level) - 1));
}
function getRank(level: number): { name: string; color: string; emoji: string } {
  if (level >= 50) return { name: "Degen God",    color: "#ff00ff", emoji: "👑" };
  if (level >= 40) return { name: "Tower Lord",   color: "#f5c842", emoji: "🏆" };
  if (level >= 30) return { name: "Sigma",        color: "#e0b87a", emoji: "💪" };
  if (level >= 20) return { name: "Diamond Ape",  color: "#88ccff", emoji: "💎" };
  if (level >= 15) return { name: "Gold Degen",   color: "#f5c842", emoji: "🥇" };
  if (level >= 10) return { name: "Silver Degen", color: "#aaaaaa", emoji: "🥈" };
  if (level >= 5)  return { name: "Bronze Ape",   color: "#cd7f32", emoji: "🥉" };
  if (level >= 3)  return { name: "Normie",       color: "#22d67a", emoji: "🐸" };
  return { name: "Ngmi",               color: "#6b6b8a", emoji: "😴" };
}

function formatNum(n: number): string {
  if (n >= 1e15) {
    return (n / 1e15).toPrecision(5).replace(/\.?0+$/, "") + " Quadrillion";
  }
  if (n >= 1e12) {
    return (n / 1e12).toPrecision(5).replace(/\.?0+$/, "") + " Trillion";
  }
  if (n >= 1e9) {
    return (n / 1e9).toPrecision(5).replace(/\.?0+$/, "") + " Billion";
  }
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

// 48-hour reset countdown
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function calc() {
      const now = Date.now();
      // Reset every 48hrs from unix epoch
      const period = 48 * 60 * 60 * 1000;
      const next = Math.ceil(now / period) * period;
      const diff = next - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

const CHARS: Record<string, string> = {
  pepe: "🐸", gigachad: "💪", trump: "🎩", troll: "🧌", bonk: "🐕",
};

export default function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown();

  useEffect(() => {
    const fetchLB = async () => {
      // Use raw fetch to bypass any potential Supabase client caching
      const SUPA_URL = "https://paxtohwiycuhwmlziwrr.supabase.co";
      const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";
      try {
        const resp = await fetch(`${SUPA_URL}/rest/v1/dt_players?select=id,username,character,games_played,total_score,avatar_url&order=games_played.desc&limit=100`, {
          headers: {
            "apikey": SUPA_KEY,
            "Authorization": `Bearer ${SUPA_KEY}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          cache: "no-store"
        });
        if (resp.ok) {
          const text = await resp.text();
          // Custom regex-based parser to preserve BigInt precision for games_played and total_score
          // This prevents the browser from rounding the 89Q score during JSON.parse()
          // High-precision parser that handles each player's large numbers individually
          const data = JSON.parse(text.replace(/:(\d{16,})/g, ':"$1"'), (key, value) => {
            if ((key === 'games_played' || key === 'total_score' || key === 'token_balance') && typeof value === 'string' && /^\d+$/.test(value)) {
              return BigInt(value);
            }
            return value;
          });
          setPlayers((data || []).sort((a: any, b: any) => {
            const ag = typeof a.games_played === 'bigint' ? a.games_played : BigInt(String(a.games_played || 0));
            const bg = typeof b.games_played === 'bigint' ? b.games_played : BigInt(String(b.games_played || 0));
            if (bg > ag) return 1;
            if (bg < ag) return -1;
            return 0;
          }));
        }
      } catch (e) {
        console.error("LB fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLB();
    // Live polling (500ms) for high-frequency leaderboard updates
    const id = setInterval(fetchLB, 500);
    return () => clearInterval(id);
  }, []);

  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{ minHeight: "100vh", background: "#0a000f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Fixed background */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(120,40,200,0.2) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(10,0,15,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ color: "#fff", fontWeight: 900, fontSize: 18, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Degen Clicker" style={{ width: 32, height: 32, objectFit: "contain" }} />
          Degen Clicker
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <Link href="/" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Home</Link>
          <Link href="/game" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", borderRadius: 8, padding: "6px 14px" }}>Play Now</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>🏆 Leaderboard</h1>
          <p style={{ color: "#664488", fontSize: 14, marginBottom: 12 }}>
            Earn $TOWER → Level up → Rank up → Win the pool
          </p>
          {/* Reset countdown */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(245,200,66,0.08)", border: "1px solid rgba(245,200,66,0.2)", borderRadius: 12, padding: "8px 20px" }}>
            <span style={{ color: "#664488", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resets in</span>
            <span style={{ color: "#f5c842", fontWeight: 900, fontSize: 20, letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
          </div>
        </div>

        {/* Rank guide */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, color: "#664488", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Rank System — Earn More = Level Up = Climb Higher</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[[1,"Ngmi","#6b6b8a","😴"],[3,"Normie","#22d67a","🐸"],[5,"Bronze Ape","#cd7f32","🥉"],[10,"Silver Degen","#aaa","🥈"],[15,"Gold Degen","#f5c842","🥇"],[20,"Diamond Ape","#88ccff","💎"],[30,"Sigma","#e0b87a","💪"],[40,"Tower Lord","#f5c842","🏆"],[50,"Degen God","#ff00ff","👑"]].map(([lv,name,color,emoji]) => (
              <div key={lv as string} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color}33`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14 }}>{emoji}</span>
                <span style={{ color: color as string, fontSize: 11, fontWeight: 700 }}>Lv.{lv}+ {name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "rgba(15,5,30,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", position: "relative", zIndex: 1 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#444" }}>Loading...</div>
          ) : players.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
              <div style={{ color: "#664488", fontSize: 16, fontWeight: 700 }}>No players yet — be first!</div>
              <Link href="/game" style={{ display: "inline-block", marginTop: 16, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 800 }}>Start Playing</Link>
            </div>
          ) : (
            players.map((p, i) => {
              const level = getLevel(p.total_score || 0);
              const rank  = getRank(level);
              const nextXP = getXPForNextLevel(level);
              const xpPct  = Math.min(100, ((p.total_score||0) / nextXP) * 100);
              return (
                <div key={p.id} style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i < 3 ? `rgba(${i===0?"245,200,66":i===1?"160,160,160":"205,127,50"},0.04)` : "transparent",
                }}>
                  {/* Position */}
                  <div style={{ textAlign: "center", fontSize: i < 3 ? 22 : 14, fontWeight: 900, color: i < 3 ? undefined : "#555" }}>
                    {i < 3 ? medals[i] : `#${i+1}`}
                  </div>

                  {/* Player info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{CHARS[p.character] || "🎮"}</span>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{p.username || "Degen"}</span>
                      <span style={{ marginLeft: 4, background: `${rank.color}22`, border: `1px solid ${rank.color}55`, borderRadius: 5, padding: "1px 7px", fontSize: 10, color: rank.color, fontWeight: 700 }}>
                        {rank.emoji} {rank.name}
                      </span>
                    </div>
                    {/* XP bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", maxWidth: 200 }}>
                        <div style={{ width: `${xpPct}%`, height: "100%", background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`, borderRadius: 2 }} />
                      </div>
                      <span style={{ color: "#445", fontSize: 10 }}>Lv.{level}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f5c842", fontWeight: 900, fontSize: 16 }}>👆 {formatNum(p.games_played || 0)}</div>
                    <div style={{ color: "#445", fontSize: 10 }}>💰 {formatNum(p.total_score || 0)} earned</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
