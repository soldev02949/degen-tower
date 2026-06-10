"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_PIN = "0129";

// ─── Level system ──────────────────────────────────────────────────────────
function getLevel(totalEarned: number) {
  return Math.max(1, Math.floor(Math.log2(totalEarned / 100 + 1)) + 1);
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

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [players, setPlayers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "players" | "leaderboard">("overview");
  const [snapshotSent, setSnapshotSent] = useState(false);

  function tryLogin() {
    if (pin === ADMIN_PIN) { setAuthed(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [playersRes, lbRes] = await Promise.all([
      supabase.from("dt_players").select("*").order("total_score", { ascending: false }),
      supabase.from("dt_leaderboard_daily").select("*, dt_players(username, character, wallet_address)").order("score", { ascending: false }).limit(50),
    ]);
    setPlayers(playersRes.data || []);
    setLeaderboard(lbRes.data || []);

    const p = playersRes.data || [];
    setStats({
      totalPlayers: p.length,
      verifiedPlayers: p.filter((x: any) => x.is_verified).length,
      totalCoinsEarned: p.reduce((s: number, x: any) => s + (x.total_score || 0), 0),
      avgLevel: p.length ? Math.round(p.reduce((s: number, x: any) => s + getLevel(x.total_score || 0), 0) / p.length) : 0,
      topPlayer: p[0]?.username || "—",
      signupsToday: p.filter((x: any) => {
        const d = new Date(x.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  async function sendSnapshot() {
    // This would email a snapshot — for now just alert
    setSnapshotSent(true);
    setTimeout(() => setSnapshotSent(false), 3000);
  }

  // ── Login screen ──
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#050008", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "rgba(15,5,25,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "40px 32px",
          width: 320, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
          <h2 style={{ color: "#fff", fontWeight: 900, marginBottom: 6, fontSize: 20 }}>Admin Access</h2>
          <p style={{ color: "#444", fontSize: 12, marginBottom: 24 }}>Enter PIN to continue</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && tryLogin()}
            placeholder="••••"
            autoFocus
            style={{
              width: "100%", padding: "12px 16px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${pinError ? "#ff3355" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, color: "#fff", fontSize: 18, textAlign: "center",
              outline: "none", letterSpacing: "0.3em", marginBottom: 12,
            }}
          />
          {pinError && <p style={{ color: "#ff3355", fontSize: 12, marginBottom: 10 }}>Wrong PIN</p>}
          <button onClick={tryLogin} style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #6600cc, #440088)",
            border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14,
          }}>Enter</button>
        </div>
      </div>
    );
  }

  const BG = "#050008";
  const CARD = "rgba(15,5,30,0.9)";
  const BORDER = "rgba(255,255,255,0.07)";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e8e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "rgba(10,0,20,0.95)", borderBottom: `1px solid ${BORDER}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <img src="/logo.png" alt="Degen Clicker" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <h1 style={{ fontWeight: 900, fontSize: 18, color: "#fff", margin: 0 }}>Degen Clicker Admin</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#aaa", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
            {loading ? "⏳" : "🔄 Refresh"}
          </button>
          <button onClick={sendSnapshot} style={{
            background: snapshotSent ? "rgba(34,214,122,0.2)" : "rgba(245,200,66,0.1)",
            border: `1px solid ${snapshotSent ? "rgba(34,214,122,0.4)" : "rgba(245,200,66,0.3)"}`,
            color: snapshotSent ? "#22d67a" : "#f5c842", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>
            {snapshotSent ? "✓ Snapshot Sent!" : "📸 Send Snapshot"}
          </button>
          <button onClick={() => { setAuthed(false); }} style={{ background: "rgba(255,51,85,0.1)", border: "1px solid rgba(255,51,85,0.2)", color: "#ff3355", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", display: "flex", gap: 2 }}>
        {(["overview","players","leaderboard"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none",
            borderBottom: tab === t ? "2px solid #a855f7" : "2px solid transparent",
            color: tab === t ? "#fff" : "#666", fontWeight: tab === t ? 700 : 400,
            padding: "12px 20px", cursor: "pointer", fontSize: 13, textTransform: "capitalize",
            transition: "color 0.15s",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total Players",    value: stats.totalPlayers,                emoji: "👥" },
                { label: "Verified Players", value: stats.verifiedPlayers,             emoji: "✅" },
                { label: "Signups Today",    value: stats.signupsToday,               emoji: "📈" },
                { label: "Total $TOWER",     value: stats.totalCoinsEarned.toFixed(0), emoji: "💰" },
                { label: "Avg Level",        value: stats.avgLevel,                    emoji: "⚡" },
                { label: "Top Player",       value: stats.topPlayer,                   emoji: "👑" },
              ].map(({ label, value, emoji }) => (
                <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 16px" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ color: "#6b6b8a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Rank distribution */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 16, color: "#fff", fontSize: 15 }}>📊 Rank Distribution</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[1,3,5,10,15,20,30,40,50].map(minLv => {
                  const rank = getRank(minLv);
                  const count = players.filter(p => getLevel(p.total_score||0) >= minLv && getLevel(p.total_score||0) < (minLv === 50 ? 999 : [1,3,5,10,15,20,30,40,50][[1,3,5,10,15,20,30,40,50].indexOf(minLv)+1])).length;
                  return (
                    <div key={minLv} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{rank.emoji}</div>
                      <div style={{ color: rank.color, fontSize: 12, fontWeight: 700 }}>{rank.name}</div>
                      <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── PLAYERS ── */}
        {tab === "players" && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["#","Username","Character","Level","Rank","$TOWER Earned","Taps","Verified","Joined"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#6b6b8a", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const lv = getLevel(p.total_score || 0);
                  const rank = getRank(lv);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 14px", color: "#555" }}>{i+1}</td>
                      <td style={{ padding: "10px 14px", color: "#fff", fontWeight: 600 }}>{p.username || p.wallet_address?.slice(0,8) || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#aaa" }}>{p.character || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#a855f7", fontWeight: 700 }}>Lv.{lv}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: rank.color, fontWeight: 700 }}>{rank.emoji} {rank.name}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#f5c842", fontWeight: 700 }}>{(p.total_score||0).toFixed(0)}</td>
                      <td style={{ padding: "10px 14px", color: "#aaa" }}>{(p.games_played||0).toLocaleString()}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: p.is_verified ? "#22d67a" : "#555" }}>{p.is_verified ? "✓" : "✗"}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#555", fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {players.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#444" }}>No players yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: "#fff", fontWeight: 800, margin: 0 }}>Current 48hr Leaderboard</h3>
              <span style={{ color: "#664488", fontSize: 12 }}>Resets every 48 hours</span>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Rank","Player","Character","Score","Floor","Reward %","Date"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#6b6b8a", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 900, color: i === 0 ? "#f5c842" : i === 1 ? "#aaaaaa" : i === 2 ? "#cd7f32" : "#555" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#fff", fontWeight: 600 }}>{entry.dt_players?.username || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#aaa" }}>{entry.dt_players?.character || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#f5c842", fontWeight: 700 }}>{(entry.score||0).toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", color: "#a855f7" }}>{entry.floor_reached || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#22d67a" }}>{entry.reward_percentage ? `${entry.reward_percentage}%` : "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#555", fontSize: 11 }}>{entry.leaderboard_date}</td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#444" }}>No leaderboard entries yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
