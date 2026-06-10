"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_PIN = "0129";

const CE: Record<string,string> = {pepe:"🐸",gigachad:"💪",trump:"🎩",troll:"🧌",bonk:"🐕"};

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
  return             { name: "Ngmi",              color: "#6b6b8a", emoji: "😴" };
}

function fmt(n: number) {
  if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
  if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
  return Math.floor(n).toString();
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [players, setPlayers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview"|"players"|"leaderboard">("overview");
  const [search, setSearch] = useState("");

  function tryLogin() {
    if (pin === ADMIN_PIN) { setAuthed(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dt_players")
      .select("*")
      .order("total_score", { ascending: false });
    const p = data || [];
    setPlayers(p);
    const today = new Date().toDateString();
    setStats({
      totalPlayers: p.length,
      verifiedPlayers: p.filter((x: any) => x.is_verified).length,
      totalCoins: p.reduce((s: number, x: any) => s + (x.total_score || 0), 0),
      totalTaps: p.reduce((s: number, x: any) => s + (x.games_played || 0), 0),
      avgLevel: p.length ? Math.round(p.reduce((s: number, x: any) => s + getLevel(x.total_score || 0), 0) / p.length) : 0,
      topPlayer: p[0]?.username || "—",
      topScore: p[0]?.total_score || 0,
      signupsToday: p.filter((x: any) => new Date(x.created_at).toDateString() === today).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) fetchData(); }, [authed, fetchData]);

  const filtered = players.filter(p =>
    !search || (p.username||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.wallet_address||"").toLowerCase().includes(search.toLowerCase())
  );

  // ── Login ──
  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:"#050008", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ background:"rgba(15,5,25,0.95)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"40px 32px", width:320, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🔐</div>
          <h2 style={{ color:"#fff", fontWeight:900, marginBottom:6, fontSize:20 }}>Admin Access</h2>
          <p style={{ color:"#444", fontSize:12, marginBottom:24 }}>Enter PIN to continue</p>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="••••" autoFocus
            style={{ width:"100%", padding:"12px 16px", background:"rgba(255,255,255,0.04)", border:`1px solid ${pinError?"#ff3355":"rgba(255,255,255,0.1)"}`, borderRadius:10, color:"#fff", fontSize:18, textAlign:"center", outline:"none", letterSpacing:"0.3em", marginBottom:12, boxSizing:"border-box" }}
          />
          {pinError && <p style={{ color:"#ff3355", fontSize:12, marginBottom:10 }}>Wrong PIN</p>}
          <button onClick={tryLogin} style={{ width:"100%", padding:"12px", background:"linear-gradient(135deg,#6600cc,#440088)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, cursor:"pointer", fontSize:14 }}>Enter</button>
        </div>
      </div>
    );
  }

  const BG = "#050008";
  const CARD = "rgba(15,5,30,0.9)";
  const BORDER = "rgba(255,255,255,0.07)";

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#e8e8f0", fontFamily:"system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:"rgba(10,0,20,0.97)", borderBottom:`1px solid ${BORDER}`, padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
        <img src="/logo.png" alt="" style={{ width:30, height:30, objectFit:"contain", filter:"drop-shadow(0 0 8px rgba(168,85,247,0.5))" }}/>
        <h1 style={{ fontWeight:900, fontSize:17, color:"#fff", margin:0 }}>Degen Clicker Admin</h1>
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {loading && <span style={{ color:"#666", fontSize:12 }}>⏳ Loading…</span>}
          <button onClick={fetchData} style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${BORDER}`, color:"#aaa", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12 }}>🔄 Refresh</button>
          <button onClick={()=>setAuthed(false)} style={{ background:"rgba(255,51,85,0.08)", border:"1px solid rgba(255,51,85,0.2)", color:"#ff3355", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Log out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, padding:"0 24px", display:"flex", gap:0 }}>
        {(["overview","players","leaderboard"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:"none", border:"none",
            borderBottom:tab===t?"2px solid #a855f7":"2px solid transparent",
            color:tab===t?"#fff":"#555", fontWeight:tab===t?700:400,
            padding:"12px 20px", cursor:"pointer", fontSize:13, textTransform:"capitalize",
          }}>{t==="overview"?"📊 Overview":t==="players"?"👥 Players":"🏆 Leaderboard"}</button>
        ))}
      </div>

      <div style={{ padding:"20px 24px", maxWidth:1300, margin:"0 auto" }}>

        {/* ── OVERVIEW ── */}
        {tab==="overview" && stats && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
              {[
                { label:"Total Players",   value:stats.totalPlayers,         emoji:"👥", color:"#a855f7" },
                { label:"Signups Today",   value:stats.signupsToday,         emoji:"📈", color:"#22d67a" },
                { label:"Total $TOWER",    value:fmt(stats.totalCoins),       emoji:"💰", color:"#f5c842" },
                { label:"Total Taps",      value:fmt(stats.totalTaps),        emoji:"👆", color:"#a855f7" },
                { label:"Avg Level",       value:`Lv.${stats.avgLevel}`,      emoji:"⚡", color:"#22d67a" },
                { label:"#1 Player",       value:stats.topPlayer,             emoji:"👑", color:"#f5c842" },
                { label:"#1 Score",        value:fmt(stats.topScore),         emoji:"🔥", color:"#f5c842" },
                { label:"Verified",        value:stats.verifiedPlayers,       emoji:"✅", color:"#22d67a" },
              ].map(({ label, value, emoji, color }) => (
                <div key={label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"16px 14px" }}>
                  <div style={{ fontSize:22, marginBottom:5 }}>{emoji}</div>
                  <div style={{ color:"#443355", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
                  <div style={{ color, fontWeight:900, fontSize:18 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Character breakdown */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:18 }}>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:14, marginBottom:14 }}>🎮 Character Pick Rate</h3>
                {["pepe","gigachad","trump","troll","bonk"].map(id=>{
                  const count=players.filter(p=>p.character===id).length;
                  const pct=players.length?Math.round(count/players.length*100):0;
                  return(
                    <div key={id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:12, color:"#ccc" }}>{CE[id]} {id.charAt(0).toUpperCase()+id.slice(1)}</span>
                        <span style={{ fontSize:12, color:"#f5c842", fontWeight:700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#7c3aed,#a855f7)", borderRadius:3 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:18 }}>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:14, marginBottom:14 }}>🏅 Rank Distribution</h3>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[{min:1,max:3},{min:3,max:5},{min:5,max:10},{min:10,max:15},{min:15,max:20},{min:20,max:30},{min:30,max:40},{min:40,max:50},{min:50,max:999}].map(({min,max})=>{
                    const r=getRank(min);
                    const count=players.filter(p=>{const lv=getLevel(p.total_score||0);return lv>=min&&lv<max;}).length;
                    return(
                      <div key={min} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, padding:"8px 10px", textAlign:"center", minWidth:60 }}>
                        <div style={{ fontSize:18 }}>{r.emoji}</div>
                        <div style={{ color:r.color, fontSize:10, fontWeight:700, marginTop:2 }}>{r.name}</div>
                        <div style={{ color:"#fff", fontSize:16, fontWeight:900 }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PLAYERS ── */}
        {tab==="players" && (
          <>
            <div style={{ marginBottom:14 }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username or wallet…"
                style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${BORDER}`, borderRadius:10, color:"#fff", fontSize:13, padding:"9px 14px", outline:"none", width:280 }}/>
              <span style={{ color:"#443355", fontSize:12, marginLeft:12 }}>{filtered.length} players</span>
            </div>
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, overflow:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                    {["#","Avatar","Username","Wallet","Level","Rank","$TOWER","Taps","Joined"].map(h=>(
                      <th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"#443355", fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${BORDER}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p,i)=>{
                    const lv=getLevel(p.total_score||0);
                    const r=getRank(lv);
                    return(
                      <tr key={p.id} style={{ borderBottom:`1px solid ${BORDER}` }}
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                      >
                        <td style={{ padding:"9px 14px", color:"#443355" }}>{i+1}</td>
                        <td style={{ padding:"9px 14px", fontSize:18 }}>{CE[p.character]||"🎮"}</td>
                        <td style={{ padding:"9px 14px", color:"#fff", fontWeight:700 }}>{p.username||"—"}</td>
                        <td style={{ padding:"9px 14px", color:"#443355", fontSize:10, fontFamily:"monospace" }}>{p.sol_wallet?p.sol_wallet.slice(0,12)+"…":"—"}</td>
                        <td style={{ padding:"9px 14px", color:"#a855f7", fontWeight:700 }}>Lv.{lv}</td>
                        <td style={{ padding:"9px 14px" }}><span style={{ color:r.color, fontWeight:700 }}>{r.emoji} {r.name}</span></td>
                        <td style={{ padding:"9px 14px", color:"#f5c842", fontWeight:700 }}>{fmt(p.total_score||0)}</td>
                        <td style={{ padding:"9px 14px", color:"#888" }}>{fmt(p.games_played||0)}</td>
                        <td style={{ padding:"9px 14px", color:"#443355", fontSize:11 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                  {filtered.length===0&&(
                    <tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#333" }}>No players found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── LEADERBOARD ── */}
        {tab==="leaderboard" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h3 style={{ color:"#fff", fontWeight:900, margin:"0 0 2px", fontSize:16 }}>🏆 Live Leaderboard</h3>
                <p style={{ color:"#443355", fontSize:12, margin:0 }}>All-time rankings by $TOWER earned</p>
              </div>
              <button onClick={fetchData} style={{ background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#a855f7", borderRadius:10, padding:"7px 16px", cursor:"pointer", fontSize:12, fontWeight:700 }}>🔄 Refresh</button>
            </div>

            {/* Top 3 podium */}
            {players.length>=3&&(
              <div style={{ display:"flex", gap:10, alignItems:"flex-end", justifyContent:"center", marginBottom:16, maxWidth:500, margin:"0 auto 16px" }}>
                {[players[1],players[0],players[2]].map((p,pos)=>{
                  if(!p) return null;
                  const lv=getLevel(p.total_score||0);
                  const r=getRank(lv);
                  const medals=["🥈","🥇","🥉"];
                  const heights=["85%","100%","75%"];
                  return(
                    <div key={p.id} style={{ flex:1, background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:"14px 10px", textAlign:"center", alignSelf:pos===1?"flex-start":"flex-end", minHeight:heights[pos] }}>
                      <div style={{ fontSize:28, marginBottom:4 }}>{medals[pos]}</div>
                      <div style={{ fontSize:24, marginBottom:4 }}>{CE[p.character]||"🎮"}</div>
                      <div style={{ color:"#fff", fontWeight:800, fontSize:13, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.username||"Anon"}</div>
                      <div style={{ color:r.color, fontSize:10, fontWeight:700, marginBottom:2 }}>{r.emoji} {r.name}</div>
                      <div style={{ color:"#f5c842", fontWeight:900, fontSize:14 }}>💰{fmt(p.total_score||0)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, overflow:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                    {["Rank","Player","Character","Level","Title","$TOWER","Taps","Wallet"].map(h=>(
                      <th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"#443355", fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${BORDER}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p,i)=>{
                    const lv=getLevel(p.total_score||0);
                    const r=getRank(lv);
                    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
                    const isPrize=i<20;
                    return(
                      <tr key={p.id} style={{ borderBottom:`1px solid ${BORDER}`, background:i<3?"rgba(168,85,247,0.03)":"transparent" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.025)")}
                        onMouseLeave={e=>(e.currentTarget.style.background=i<3?"rgba(168,85,247,0.03)":"transparent")}
                      >
                        <td style={{ padding:"10px 14px", fontWeight:900 }}>
                          {medal?<span style={{ fontSize:16 }}>{medal}</span>:<span style={{ color:isPrize?"#a855f7":"#443355" }}>#{i+1}</span>}
                        </td>
                        <td style={{ padding:"10px 14px", color:"#fff", fontWeight:700 }}>
                          {p.username||"Anon"}
                          {isPrize&&<span style={{ marginLeft:5, fontSize:9, background:"rgba(34,214,122,0.12)", color:"#22d67a", fontWeight:700, padding:"2px 6px", borderRadius:4 }}>PRIZE</span>}
                        </td>
                        <td style={{ padding:"10px 14px", fontSize:18 }}>{CE[p.character]||"🎮"}</td>
                        <td style={{ padding:"10px 14px", color:"#a855f7", fontWeight:700 }}>Lv.{lv}</td>
                        <td style={{ padding:"10px 14px" }}><span style={{ color:r.color, fontWeight:700 }}>{r.emoji} {r.name}</span></td>
                        <td style={{ padding:"10px 14px", color:"#f5c842", fontWeight:900 }}>💰{fmt(p.total_score||0)}</td>
                        <td style={{ padding:"10px 14px", color:"#888" }}>{fmt(p.games_played||0)}</td>
                        <td style={{ padding:"10px 14px", color:"#443355", fontSize:10, fontFamily:"monospace" }}>{p.sol_wallet?p.sol_wallet.slice(0,10)+"…":"—"}</td>
                      </tr>
                    );
                  })}
                  {players.length===0&&(
                    <tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:"#333" }}>No players yet</td></tr>
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
