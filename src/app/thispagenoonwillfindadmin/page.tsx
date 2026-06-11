"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getLevelFromXP, getRankFromLevel } from "@/lib/progression";

const ADMIN_PIN = "0129";
const PROJECT_ID = "paxtohwiycuhwmlziwrr";

const CE: Record<string,string> = { pepe:"🐸", gigachad:"💪", trump:"🎩", troll:"🧌", bonk:"🐕" };

function fmt(n: number) {
  if (!n) return "0";
  if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
  if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
  return Math.floor(n).toString();
}
function shortWallet(w: string) {
  if (!w) return "—";
  if (w.includes("@")) {
    const [name, domain] = w.split("@");
    if (name.length <= 3) return w;
    return `${name.slice(0, 3)}...${name.slice(-1)}@${domain}`;
  }
  if (w.length < 12) return w;
  return w.slice(0, 6) + "…" + w.slice(-4);
}
function ago(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d/60000)+"m ago";
  if (d < 86400000) return Math.floor(d/3600000)+"h ago";
  return Math.floor(d/86400000)+"d ago";
}

type Player = {
  id: string; wallet_address: string; username: string; character: string;
  total_score: number; games_played: number; is_verified: boolean;
  sol_wallet: string; created_at: string; is_banned: boolean; ban_reason: string;
  disqualified: boolean; disqualify_reason: string; flag_count: number;
  ip_address: string; device_fingerprint: string; email_verified: boolean;
};
type FlaggedAccount = {
  id: string; player_id: string; flag_reason: string; flag_details: any;
  status: string; admin_note: string; created_at: string; updated_at: string;
};
type RewardEntry = {
  id: string; player_id: string; username: string; rank_position: number;
  games_played: number; sol_wallet: string; reward_amount_usdc: number;
  status: string; admin_note: string; period_start: string; period_end: string;
  approved_at: string; paid_at: string; created_at: string;
};
type PayoutLog = {
  id: string; player_id: string; username: string; sol_wallet: string;
  amount_usdc: number; tx_signature: string; notes: string; created_at: string;
};

// ─── Design tokens ─────────────────────────────────────────────────────────
const BG   = "#050008";
const CARD = "rgba(15,5,30,0.9)";
const BORDER = "rgba(255,255,255,0.07)";
const PURPLE = "#a855f7";
const GOLD = "#f5c842";
const GREEN = "#22d67a";
const RED = "#ef4444";

type TabId = "overview"|"players"|"flagged"|"rewards"|"payouts"|"devices"|"leaderboard"|"submissions";

const STATUS_COLOR: Record<string,string> = {
  pending:"#f5c842", approved:"#22d67a", denied:"#ef4444",
  paid:"#a855f7", disqualified:"#ff6600", cleared:"#22d67a",
};

// ── Status pill ──────────────────────────────────────────────────────────────
function Pill({ status }: { status: string }) {
  const c = STATUS_COLOR[status] || "#888";
  return (
    <span style={{
      background: c+"18", border:`1px solid ${c}40`,
      color:c, borderRadius:20, padding:"2px 10px",
      fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.04em",
    }}>{status}</span>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(12px)"}}>
      <div style={{background:"rgba(12,4,24,0.98)",border:`1px solid rgba(168,85,247,0.3)`,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:500,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{color:"#fff",fontWeight:900,fontSize:16,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Admin ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{text:string;type:"ok"|"err"}|null>(null);

  // Data
  const [players, setPlayers] = useState<Player[]>([]);
  const [flagged, setFlagged] = useState<FlaggedAccount[]>([]);
  const [rewards, setRewards] = useState<RewardEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [ipData, setIpData] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [lbSearch, setLbSearch] = useState("");
  const [lbFilter, setLbFilter] = useState<"all"|"prize"|"active"|"banned">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);// default ON — live data
  const [copiedId, setCopiedId] = useState<string|null>(null);
  const [quickPayModal, setQuickPayModal] = useState<Player|null>(null);
  const [quickPayNote, setQuickPayNote] = useState("");
  const [actionModal, setActionModal] = useState<Player|null>(null);
  const [rewardModal, setRewardModal] = useState<RewardEntry|null>(null);
  const [flagModal, setFlagModal] = useState<FlaggedAccount|null>(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [txSig, setTxSig] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");

  function showMsg(text:string, type:"ok"|"err"="ok") {
    setMsg({text,type});
    setTimeout(()=>setMsg(null),3500);
  }

  function tryLogin() {
    if (pin === ADMIN_PIN) { setAuthed(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // always bypass any cache — reads must be live from DB
      const headers = { "Cache-Control": "no-cache, no-store", "Pragma": "no-cache" };
      const [
        { data: pd },
        { data: fd },
        { data: rd },
        { data: pld },
        { data: dd },
        { data: ipd },
      ] = await Promise.all([
        supabase.from("dt_players").select("*").order("games_played", { ascending: false }),
        supabase.from("dt_flagged_accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("dt_reward_queue").select("*").order("rank_position", { ascending: true }),
        supabase.from("dt_payout_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("dt_device_fingerprints").select("*").order("created_at", { ascending: false }),
        supabase.from("dt_ip_accounts").select("*").order("last_seen", { ascending: false }),
      ]);
      void headers;// used to signal intent; supabase-js handles cache at HTTP level
      setPlayers((pd||[]) as Player[]);
      setFlagged((fd||[]) as FlaggedAccount[]);
      setRewards((rd||[]) as RewardEntry[]);
      setPayouts((pld||[]) as PayoutLog[]);
      setDevices(dd||[]);
      setIpData(ipd||[]);
    } catch(e:any) { showMsg("Fetch error: "+e.message,"err"); }
    setLoading(false);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setSubLoading(true);
    try {
      const { data } = await supabase.from("dt_submissions").select("*").order("submitted_at", { ascending: false }).limit(200);
      setSubmissions(data||[]);
    } catch(e:any) { showMsg("Submissions fetch error: "+e.message,"err"); }
    setSubLoading(false);
  }, []);

  useEffect(() => { if (authed) { fetchAll(); fetchSubmissions(); } }, [authed, fetchAll, fetchSubmissions]);

  // Auto-refresh every 3s
  useEffect(() => {
    if (!authed || !autoRefresh) return;
    const id = setInterval(fetchAll, 3000);// live polling
    return () => clearInterval(id);
  }, [authed, autoRefresh, fetchAll]);

  // Supabase Realtime — instant push whenever dt_players changes
  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("dt_players_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "dt_players" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authed, fetchAll]);

  function copyToClipboard(text: string, id: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  async function logQuickPay(p: Player, note: string) {
    await supabase.from("dt_payout_logs").insert({
      player_id: p.wallet_address, username: p.username,
      sol_wallet: p.sol_wallet, amount_usdc: 0,
      tx_signature: "", notes: note || "Manual pay note",
    });
    showMsg(`📝 Pay note logged for ${p.username}`);
    setQuickPayModal(null); setQuickPayNote(""); fetchAll();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function banPlayer(p: Player, reason: string) {
    await supabase.from("dt_players").update({ is_banned:true, ban_reason:reason }).eq("id",p.id);
    await supabase.from("dt_security_events").insert({ player_id:p.wallet_address, event_type:"account_banned", severity:"high", data:{reason,username:p.username} });
    showMsg(`✅ Banned ${p.username}`);
    setActionModal(null);
    fetchAll();
  }
  async function unbanPlayer(p: Player) {
    await supabase.from("dt_players").update({ is_banned:false, ban_reason:null }).eq("id",p.id);
    showMsg(`✅ Unbanned ${p.username}`);
    setActionModal(null);
    fetchAll();
  }
  async function disqualifyPlayer(p: Player, reason: string) {
    await supabase.from("dt_players").update({ disqualified:true, disqualify_reason:reason }).eq("id",p.id);
    await supabase.from("dt_reward_queue").update({ status:"disqualified", admin_note:reason }).eq("player_id",p.wallet_address).eq("status","pending");
    await supabase.from("dt_security_events").insert({ player_id:p.wallet_address, event_type:"disqualified", severity:"medium", data:{reason,username:p.username} });
    showMsg(`⛔ Disqualified ${p.username} from rewards`);
    setActionModal(null);
    fetchAll();
  }
  async function clearFlags(p: Player) {
    await supabase.from("dt_players").update({ flag_count:0, disqualified:false, disqualify_reason:null }).eq("id",p.id);
    await supabase.from("dt_flagged_accounts").update({ status:"cleared" }).eq("player_id",p.wallet_address);
    showMsg(`✅ Cleared flags for ${p.username}`);
    setActionModal(null);
    fetchAll();
  }

  async function approveReward(r: RewardEntry) {
    if (!r.sol_wallet) { showMsg("No wallet set — cannot approve","err"); return; }
    await supabase.from("dt_reward_queue").update({ status:"approved", approved_at:new Date().toISOString(), admin_note:adminNote||"Approved" }).eq("id",r.id);
    showMsg(`✅ Approved ${r.username}`);
    setRewardModal(null);
    setAdminNote("");
    fetchAll();
  }
  async function denyReward(r: RewardEntry) {
    await supabase.from("dt_reward_queue").update({ status:"denied", admin_note:adminNote||"Denied by admin" }).eq("id",r.id);
    showMsg(`⛔ Denied ${r.username}`);
    setRewardModal(null);
    setAdminNote("");
    fetchAll();
  }
  async function markPaid(r: RewardEntry) {
    await supabase.from("dt_reward_queue").update({ status:"paid", paid_at:new Date().toISOString(), admin_note:"TX: "+txSig }).eq("id",r.id);
    await supabase.from("dt_payout_logs").insert({ player_id:r.player_id, username:r.username, sol_wallet:r.sol_wallet, amount_usdc:r.reward_amount_usdc, tx_signature:txSig, notes:`Rank #${r.rank_position}` });
    showMsg(`💰 Marked paid: ${r.username}`);
    setRewardModal(null);
    setTxSig("");
    fetchAll();
  }
  async function clearFlag(f: FlaggedAccount) {
    await supabase.from("dt_flagged_accounts").update({ status:"cleared", admin_note:adminNote }).eq("id",f.id);
    showMsg(`✅ Flag cleared`);
    setFlagModal(null);
    setAdminNote("");
    fetchAll();
  }

  // ── Generate reward queue ──────────────────────────────────────────────────
  async function generateRewardQueue() {
    const top20 = players.filter(p=>!p.is_banned&&!p.disqualified).slice(0,20);
    const now = new Date().toISOString();
    const periodStart = new Date(Date.now()-48*3600000).toISOString();
    const entries = top20.map((p,i)=>({
      player_id: p.wallet_address,
      username: p.username,
      rank_position: i+1,
      games_played: p.games_played||0,
      sol_wallet: p.sol_wallet||"",
      reward_amount_usdc: 0,
      status: "pending",
      period_start: periodStart,
      period_end: now,
    }));
    const { error } = await supabase.from("dt_reward_queue").insert(entries);
    if (error) showMsg("Error: "+error.message,"err");
    else { showMsg(`✅ Generated ${entries.length} reward entries`); setGenerateModal(false); fetchAll(); }
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function exportCSV(data: any[], filename: string) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map(r=>keys.map(k=>`"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], {type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:CARD,border:`1px solid rgba(168,85,247,0.3)`,borderRadius:20,padding:"40px 32px",width:320,textAlign:"center",boxShadow:"0 0 60px rgba(168,85,247,0.15)"}}>
          <div style={{fontSize:44,marginBottom:12,filter:"drop-shadow(0 0 16px rgba(168,85,247,0.5))"}}>🔐</div>
          <h2 style={{color:"#fff",fontWeight:900,marginBottom:6,fontSize:20}}>Admin Dashboard</h2>
          <p style={{color:"#443355",fontSize:12,marginBottom:24}}>Degen Clicker Security Panel</p>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="••••" autoFocus
            style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:`1px solid ${pinError?"#ef4444":"rgba(255,255,255,0.1)"}`,borderRadius:10,color:"#fff",fontSize:22,textAlign:"center",outline:"none",letterSpacing:"0.4em",marginBottom:12,boxSizing:"border-box"}}/>
          {pinError&&<p style={{color:"#ef4444",fontSize:12,marginBottom:10}}>Wrong PIN</p>}
          <button onClick={tryLogin} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#5b21b6,#a855f7)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14,boxShadow:"0 0 30px rgba(168,85,247,0.4)"}}>Enter</button>
        </div>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalPlayers = players.length;
  const bannedCount = players.filter(p=>p.is_banned).length;
  const disqCount = players.filter(p=>p.disqualified).length;
  const flaggedCount = flagged.filter(f=>f.status==="pending").length;
  const pendingRewards = rewards.filter(r=>r.status==="pending").length;
  const totalPaid = payouts.reduce((s,p)=>s+Number(p.amount_usdc),0);
  const today = new Date().toDateString();
  const signupsToday = players.filter(p=>new Date(p.created_at).toDateString()===today).length;
  const topPlayer = players.find(p=>!p.is_banned&&!p.disqualified);

  const TABS: {id:TabId;label:string;badge?:number}[] = [
    {id:"overview",   label:"📊 Overview"},
    {id:"players",    label:"👥 Players"},
    {id:"flagged",    label:"🚨 Flagged", badge:flaggedCount},
    {id:"rewards",    label:"💰 Rewards", badge:pendingRewards},
    {id:"payouts",    label:"📤 Payouts"},
    {id:"devices",    label:"📱 Devices"},
    {id:"leaderboard",label:"🏆 Leaderboard"},
    {id:"submissions",label:"📸 Submissions"},
  ];

  const filteredPlayers = players.filter(p=>
    !search || (p.username||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.wallet_address||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.ip_address||"").includes(search)
  );

  // ── Multiple wallet/IP detection helpers ──────────────────────────────────
  const ipToPlayers: Record<string,string[]> = {};
  players.forEach(p=>{ if(p.ip_address){ if(!ipToPlayers[p.ip_address])ipToPlayers[p.ip_address]=[]; ipToPlayers[p.ip_address].push(p.username||p.wallet_address); } });
  const multiIPs = Object.entries(ipToPlayers).filter(([,u])=>u.length>1);

  const walletToPlayers: Record<string,string[]> = {};
  players.forEach(p=>{ if(p.sol_wallet){ if(!walletToPlayers[p.sol_wallet])walletToPlayers[p.sol_wallet]=[]; walletToPlayers[p.sol_wallet].push(p.username||p.wallet_address); } });
  const multiWallets = Object.entries(walletToPlayers).filter(([,u])=>u.length>1);

  return (
    <div style={{minHeight:"100vh",background:BG,color:"#e8e8f0",fontFamily:"system-ui,sans-serif"}}>

      {/* Toast */}
      {msg&&(
        <div style={{position:"fixed",top:16,right:16,zIndex:500,
          background:msg.type==="ok"?"rgba(34,214,122,0.12)":"rgba(239,68,68,0.12)",
          border:`1px solid ${msg.type==="ok"?"rgba(34,214,122,0.4)":"rgba(239,68,68,0.4)"}`,
          color:msg.type==="ok"?GREEN:RED,
          borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",maxWidth:380,
        }}>{msg.text}</div>
      )}

      {/* Header */}
      <div style={{background:"rgba(10,0,20,0.97)",borderBottom:`1px solid ${BORDER}`,padding:"12px 24px",display:"flex",alignItems:"center",gap:12}}>
        <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(168,85,247,0.6))"}}/>
        <span style={{fontWeight:900,fontSize:16,color:"#fff",letterSpacing:"-0.02em"}}>Degen Clicker</span>
        <span style={{color:"#443355",fontSize:12,fontWeight:700}}>Admin · Security Panel</span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {loading&&<span style={{color:"#555",fontSize:12}}>⏳ Loading…</span>}
          <button onClick={()=>setAutoRefresh(v=>!v)} style={{background:autoRefresh?"rgba(34,214,122,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${autoRefresh?"rgba(34,214,122,0.3)":BORDER}`,color:autoRefresh?GREEN:"#888",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:autoRefresh?700:400}}>
            {autoRefresh?"🟢 Live":"⏸ Auto-Refresh"}
          </button>
          <button onClick={fetchAll} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12}}>🔄 Refresh</button>
          <button onClick={()=>setAuthed(false)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>Log out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:`1px solid ${BORDER}`,padding:"0 24px",display:"flex",gap:0,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:"none",border:"none",
            borderBottom:tab===t.id?"2px solid #a855f7":"2px solid transparent",
            color:tab===t.id?"#fff":"#444",fontWeight:tab===t.id?700:400,
            padding:"11px 18px",cursor:"pointer",fontSize:12,whiteSpace:"nowrap",
            position:"relative",
          }}>
            {t.label}
            {t.badge!=null&&t.badge>0&&(
              <span style={{position:"absolute",top:6,right:4,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{padding:"20px 24px",maxWidth:1400,margin:"0 auto"}}>

        {/* ── OVERVIEW ── */}
        {tab==="overview"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:20}}>
              {[
                {label:"Total Players",  value:totalPlayers,        emoji:"👥", color:PURPLE},
                {label:"Signups Today",  value:signupsToday,        emoji:"📈", color:GREEN},
                {label:"Banned",         value:bannedCount,          emoji:"🚫", color:RED},
                {label:"Disqualified",   value:disqCount,            emoji:"⛔", color:"#ff6600"},
                {label:"Pending Flags",  value:flaggedCount,         emoji:"🚨", color:GOLD},
                {label:"Pending Rewards",value:pendingRewards,       emoji:"💰", color:GOLD},
                {label:"Total Paid Out", value:"$"+fmt(totalPaid),  emoji:"💸", color:GREEN},
                {label:"#1 Player",      value:topPlayer?.username||"—",emoji:"👑",color:GOLD},
              ].map(s=>(
                <div key={s.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 14px"}}>
                  <div style={{fontSize:22,marginBottom:5}}>{s.emoji}</div>
                  <div style={{color:"#2a1540",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{s.label}</div>
                  <div style={{color:s.color,fontWeight:900,fontSize:18}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {(multiIPs.length>0||multiWallets.length>0)&&(
              <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                <h3 style={{color:RED,fontWeight:900,fontSize:14,margin:"0 0 12px"}}>⚠️ Detected Anomalies</h3>
                {multiIPs.length>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{color:"#ff8888",fontSize:12,fontWeight:700,marginBottom:6}}>🌐 Shared IP Addresses ({multiIPs.length})</div>
                    {multiIPs.slice(0,5).map(([ip,users])=>(
                      <div key={ip} style={{color:"#443355",fontSize:11,padding:"3px 0"}}><span style={{color:"#888",fontFamily:"monospace"}}>{ip}</span> → {users.join(", ")}</div>
                    ))}
                  </div>
                )}
                {multiWallets.length>0&&(
                  <div>
                    <div style={{color:"#ff8888",fontSize:12,fontWeight:700,marginBottom:6}}>💳 Shared Wallets ({multiWallets.length})</div>
                    {multiWallets.slice(0,5).map(([w,users])=>(
                      <div key={w} style={{color:"#443355",fontSize:11,padding:"3px 0"}}><span style={{color:"#22d67a",fontFamily:"monospace"}}>{shortWallet(w)}</span> → {users.join(", ")}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Character distribution */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:18}}>
                <h3 style={{color:"#fff",fontWeight:800,fontSize:14,marginBottom:14}}>🎮 Character Pick Rate</h3>
                {["pepe","gigachad","trump","troll","bonk"].map(id=>{
                  const count=players.filter(p=>p.character===id).length;
                  const pct=players.length?Math.round(count/players.length*100):0;
                  return(
                    <div key={id} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,color:"#ccc"}}>{CE[id]} {id.charAt(0).toUpperCase()+id.slice(1)}</span>
                        <span style={{fontSize:12,color:GOLD,fontWeight:700}}>{count} ({pct}%)</span>
                      </div>
                      <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:3}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#7c3aed,#a855f7)",borderRadius:3}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:18}}>
                <h3 style={{color:"#fff",fontWeight:800,fontSize:14,marginBottom:14}}>🏅 Account Health</h3>
                {[
                  {label:"Good Standing",value:players.filter(p=>!p.is_banned&&!p.disqualified&&(p.flag_count||0)===0).length,color:GREEN},
                  {label:"Flagged (Pending)",value:players.filter(p=>(p.flag_count||0)>0).length,color:GOLD},
                  {label:"Disqualified",value:disqCount,color:"#ff6600"},
                  {label:"Banned",value:bannedCount,color:RED},
                  {label:"Email Verified",value:players.filter(p=>p.email_verified).length,color:PURPLE},
                  {label:"Has Wallet",value:players.filter(p=>!!p.sol_wallet).length,color:GREEN},
                ].map(s=>(
                  <div key={s.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <span style={{color:"#888",fontSize:12}}>{s.label}</span>
                    <span style={{color:s.color,fontWeight:900,fontSize:13}}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PLAYERS ── */}
        {tab==="players"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username, wallet, IP…"
                style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:10,color:"#fff",fontSize:13,padding:"9px 14px",outline:"none",width:280}}/>
              <span style={{color:"#2a1540",fontSize:12}}>{filteredPlayers.length} players</span>
              <button onClick={()=>exportCSV(filteredPlayers,"players_export.csv")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>⬇ Export CSV</button>
            </div>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.03)"}}>
                    {["#","","Username","IP","Wallet","Level","Taps","Flags","Status","Actions"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#2a1540",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${BORDER}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((p,i)=>{
                    const lv=getLevelFromXP(p.total_score||0);
                    const r=getRankFromLevel(lv);
                    const isBad=p.is_banned||p.disqualified;
                    return(
                      <tr key={p.id} style={{borderBottom:`1px solid ${BORDER}`,background:isBad?"rgba(239,68,68,0.04)":"transparent"}}
                        onMouseEnter={e=>(e.currentTarget.style.background=isBad?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.02)")}
                        onMouseLeave={e=>(e.currentTarget.style.background=isBad?"rgba(239,68,68,0.04)":"transparent")}>
                        <td style={{padding:"8px 12px",color:"#2a1540"}}>{i+1}</td>
                        <td style={{padding:"8px 12px",fontSize:18}}>{CE[p.character]||"🎮"}</td>
                        <td style={{padding:"8px 12px",color:isBad?"#ef4444":"#fff",fontWeight:700}}>
                          {p.username||"—"}
                          {p.is_banned&&<span style={{marginLeft:4,fontSize:9,color:RED}}>BANNED</span>}
                          {p.disqualified&&!p.is_banned&&<span style={{marginLeft:4,fontSize:9,color:"#ff6600"}}>DISQ</span>}
                        </td>
                        <td style={{padding:"8px 12px",color:"#443355",fontSize:10,fontFamily:"monospace"}}>{p.ip_address||"—"}</td>
                        <td style={{padding:"8px 8px"}}>
                          {p.sol_wallet?(
                            <div style={{display:"flex",alignItems:"center",gap:3}}>
                              <span style={{color:"#22d67a",fontSize:10,fontFamily:"monospace"}} title={p.sol_wallet}>{shortWallet(p.sol_wallet)}</span>
                              <button onClick={()=>copyToClipboard(p.sol_wallet,p.id+"_pw")} style={{background:"none",border:"none",color:copiedId===p.id+"_pw"?GREEN:"#22d67a55",fontSize:10,cursor:"pointer",padding:"0 2px"}} title={p.sol_wallet}>{copiedId===p.id+"_pw"?"✅":"📋"}</button>
                            </div>
                          ):<span style={{color:"#333",fontSize:10}}>—</span>}
                        </td>
                        <td style={{padding:"8px 12px",color:r.color,fontWeight:700}}>Lv.{lv}</td>
                        <td style={{padding:"8px 12px",color:"#888"}}>{fmt(p.games_played||0)}</td>
                        <td style={{padding:"8px 12px"}}>
                          {(p.flag_count||0)>0
                            ?<span style={{color:GOLD,fontWeight:800}}>{p.flag_count} 🚨</span>
                            :<span style={{color:"#2a1540"}}>0</span>}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          {p.is_banned?<Pill status="banned"/>:p.disqualified?<Pill status="disqualified"/>:<Pill status="active"/>}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          <button onClick={()=>setActionModal(p)} style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:7,color:PURPLE,fontSize:10,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Actions ▼</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPlayers.length===0&&<tr><td colSpan={10} style={{padding:40,textAlign:"center",color:"#222"}}>No players found</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── FLAGGED ── */}
        {tab==="flagged"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
              <h3 style={{color:"#fff",fontWeight:900,fontSize:15,margin:0}}>🚨 Flagged Accounts</h3>
              <span style={{color:"#2a1540",fontSize:12}}>{flagged.length} total · {flaggedCount} pending review</span>
              <button onClick={()=>exportCSV(flagged,"flagged_export.csv")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>⬇ Export CSV</button>
            </div>
            {flagged.length===0?(
              <div style={{textAlign:"center",padding:60,color:"#2a1540"}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <div style={{fontWeight:700,fontSize:14}}>No flagged accounts</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {flagged.map(f=>{
                  const player=players.find(p=>p.wallet_address===f.player_id);
                  return(
                    <div key={f.id} style={{background:CARD,border:`1px solid ${f.status==="pending"?"rgba(239,68,68,0.25)":BORDER}`,borderRadius:14,padding:"16px 18px",display:"flex",gap:16,alignItems:"flex-start"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                          <span style={{color:"#fff",fontWeight:800,fontSize:13}}>{player?.username||f.player_id.slice(-8)}</span>
                          <Pill status={f.status}/>
                          <span style={{color:"#2a1540",fontSize:10}}>{ago(f.created_at)}</span>
                        </div>
                        <div style={{color:RED,fontWeight:700,fontSize:12,marginBottom:4}}>🚨 {f.flag_reason}</div>
                        {f.flag_details&&Object.keys(f.flag_details).length>0&&(
                          <div style={{color:"#2a1540",fontSize:10,fontFamily:"monospace",background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"4px 8px",marginBottom:4}}>
                            {JSON.stringify(f.flag_details,null,1)}
                          </div>
                        )}
                        {f.admin_note&&<div style={{color:"#556",fontSize:11,marginTop:4}}>Note: {f.admin_note}</div>}
                      </div>
                      {f.status==="pending"&&(
                        <button onClick={()=>{setFlagModal(f);setAdminNote("");}} style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:8,color:PURPLE,fontSize:11,fontWeight:700,padding:"8px 14px",cursor:"pointer",flexShrink:0}}>Review</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── REWARDS ── */}
        {tab==="rewards"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <h3 style={{color:"#fff",fontWeight:900,fontSize:15,margin:0}}>💰 Reward Queue</h3>
              <span style={{color:"#2a1540",fontSize:12}}>{pendingRewards} pending</span>
              <button onClick={()=>setGenerateModal(true)} style={{marginLeft:"auto",background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:8,color:GOLD,fontSize:12,fontWeight:700,padding:"7px 14px",cursor:"pointer"}}>⚡ Generate New Queue</button>
              <button onClick={()=>exportCSV(rewards,"rewards_export.csv")} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>⬇ Export</button>
            </div>

            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"auto",marginBottom:16}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.03)"}}>
                    {["Rank","Username","Taps","Wallet","USDC","Period End","Status","Actions"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#2a1540",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${BORDER}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rewards.map(r=>(
                    <tr key={r.id} style={{borderBottom:`1px solid ${BORDER}`}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <td style={{padding:"8px 12px"}}>
                        <span style={{color:r.rank_position<=3?GOLD:r.rank_position<=20?GREEN:"#888",fontWeight:900}}>
                          {r.rank_position===1?"👑":r.rank_position===2?"🥈":r.rank_position===3?"🥉":""}
                          #{r.rank_position}
                        </span>
                      </td>
                      <td style={{padding:"8px 12px",color:"#fff",fontWeight:700}}>{r.username||"—"}</td>
                      <td style={{padding:"8px 12px",color:"#888"}}>{fmt(r.games_played||0)}</td>
                      <td style={{padding:"8px 8px"}}>
                        {r.sol_wallet?(
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            <span style={{color:"#22d67a",fontSize:10,fontFamily:"monospace"}} title={r.sol_wallet}>{shortWallet(r.sol_wallet)}</span>
                            <button onClick={()=>copyToClipboard(r.sol_wallet,r.id+"_rw")} style={{background:"none",border:"none",color:copiedId===r.id+"_rw"?GREEN:"#22d67a55",fontSize:10,cursor:"pointer",padding:"0 2px"}} title={r.sol_wallet}>{copiedId===r.id+"_rw"?"✅":"📋"}</button>
                          </div>
                        ):<span style={{color:RED,fontSize:10}}>⚠ No wallet</span>}
                      </td>
                      <td style={{padding:"8px 12px",color:GOLD,fontWeight:900}}>{r.reward_amount_usdc>0?`$${r.reward_amount_usdc}`:"—"}</td>
                      <td style={{padding:"8px 12px",color:"#2a1540",fontSize:10}}>{r.period_end?new Date(r.period_end).toLocaleDateString():"—"}</td>
                      <td style={{padding:"8px 12px"}}><Pill status={r.status}/></td>
                      <td style={{padding:"8px 12px"}}>
                        {r.status==="pending"&&(
                          <button onClick={()=>{setRewardModal(r);setAdminNote("");setTxSig("");setRewardAmount(String(r.reward_amount_usdc||""));}}
                            style={{background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:7,color:GOLD,fontSize:10,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Review</button>
                        )}
                        {r.status==="approved"&&(
                          <button onClick={()=>{setRewardModal(r);setAdminNote("");setTxSig("");setRewardAmount(String(r.reward_amount_usdc||""));}}
                            style={{background:"rgba(34,214,122,0.1)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:7,color:GREEN,fontSize:10,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rewards.length===0&&<tr><td colSpan={8} style={{padding:40,textAlign:"center",color:"#222"}}>No reward entries yet — click Generate Queue to create one</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── PAYOUTS ── */}
        {tab==="payouts"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
              <h3 style={{color:"#fff",fontWeight:900,fontSize:15,margin:0}}>📤 Payout History</h3>
              <span style={{color:GREEN,fontWeight:800,fontSize:13}}>Total: ${fmt(totalPaid)} USDC</span>
              <button onClick={()=>exportCSV(payouts,"payout_logs.csv")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>⬇ Export CSV</button>
            </div>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.03)"}}>
                    {["Date","Username","Wallet","Amount","TX Signature","Notes"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#2a1540",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p=>(
                    <tr key={p.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:"8px 12px",color:"#2a1540",fontSize:10}}>{new Date(p.created_at).toLocaleString()}</td>
                      <td style={{padding:"8px 12px",color:"#fff",fontWeight:700}}>{p.username||"—"}</td>
                      <td style={{padding:"8px 12px",color:GREEN,fontSize:10,fontFamily:"monospace"}}>{shortWallet(p.sol_wallet)}</td>
                      <td style={{padding:"8px 12px",color:GOLD,fontWeight:900}}>${p.amount_usdc}</td>
                      <td style={{padding:"8px 12px",color:PURPLE,fontSize:10,fontFamily:"monospace"}}>{p.tx_signature?shortWallet(p.tx_signature):"—"}</td>
                      <td style={{padding:"8px 12px",color:"#443355",fontSize:10}}>{p.notes||"—"}</td>
                    </tr>
                  ))}
                  {payouts.length===0&&<tr><td colSpan={6} style={{padding:40,textAlign:"center",color:"#222"}}>No payouts recorded yet</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── DEVICES ── */}
        {tab==="devices"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
              {/* IP multi-account detections */}
              <div style={{background:CARD,border:`1px solid ${multiIPs.length>0?"rgba(239,68,68,0.25)":BORDER}`,borderRadius:16,padding:18}}>
                <h3 style={{color:multiIPs.length>0?RED:"#fff",fontWeight:900,fontSize:14,margin:"0 0 14px"}}>
                  🌐 Shared IPs ({multiIPs.length})
                </h3>
                {multiIPs.length===0?(
                  <div style={{color:"#2a1540",fontSize:12}}>✅ No shared IPs detected</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {multiIPs.map(([ip,users])=>(
                      <div key={ip} style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{color:"#888",fontFamily:"monospace",fontSize:11,marginBottom:4}}>{ip}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {users.map(u=><span key={u} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,color:RED,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{u}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-wallet detections */}
              <div style={{background:CARD,border:`1px solid ${multiWallets.length>0?"rgba(245,200,66,0.25)":BORDER}`,borderRadius:16,padding:18}}>
                <h3 style={{color:multiWallets.length>0?GOLD:"#fff",fontWeight:900,fontSize:14,margin:"0 0 14px"}}>
                  💳 Shared Wallets ({multiWallets.length})
                </h3>
                {multiWallets.length===0?(
                  <div style={{color:"#2a1540",fontSize:12}}>✅ No shared wallets detected</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {multiWallets.map(([w,users])=>(
                      <div key={w} style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.15)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{color:"#22d67a",fontFamily:"monospace",fontSize:10,marginBottom:4}}>{w}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {users.map(u=><span key={u} style={{background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:6,color:GOLD,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{u}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Device fingerprints */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:18,marginBottom:14}}>
              <h3 style={{color:"#fff",fontWeight:900,fontSize:14,margin:"0 0 14px"}}>📱 Device Fingerprints ({devices.length})</h3>
              {devices.length===0?(
                <div style={{color:"#2a1540",fontSize:12}}>No device fingerprints collected yet</div>
              ):(
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr>
                        {["Fingerprint","Player","IP","User Agent","First Seen","Last Seen"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#2a1540",fontWeight:700,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {devices.slice(0,50).map(d=>{
                        const p=players.find(pp=>pp.wallet_address===d.player_id);
                        return(
                          <tr key={d.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                            <td style={{padding:"7px 10px",color:PURPLE,fontFamily:"monospace",fontSize:10}}>{d.fingerprint?.slice(0,16)||"—"}</td>
                            <td style={{padding:"7px 10px",color:"#fff",fontWeight:600}}>{p?.username||d.player_id?.slice(-8)||"—"}</td>
                            <td style={{padding:"7px 10px",color:"#443355",fontFamily:"monospace"}}>{d.ip_address||"—"}</td>
                            <td style={{padding:"7px 10px",color:"#2a1540",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.user_agent||"—"}</td>
                            <td style={{padding:"7px 10px",color:"#2a1540"}}>{d.created_at?ago(d.created_at):"—"}</td>
                            <td style={{padding:"7px 10px",color:"#2a1540"}}>{d.last_seen?ago(d.last_seen):"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── LEADERBOARD ── */}
        {tab==="leaderboard"&&(()=>{
          const lbPlayers=players.filter(p=>{
            const matchSearch=!lbSearch||(p.username||"").toLowerCase().includes(lbSearch.toLowerCase())||(p.sol_wallet||"").toLowerCase().includes(lbSearch.toLowerCase());
            const matchFilter=lbFilter==="all"||(lbFilter==="prize"&&players.indexOf(p)<20&&!p.is_banned&&!p.disqualified)||(lbFilter==="active"&&!p.is_banned&&!p.disqualified)||(lbFilter==="banned"&&(p.is_banned||p.disqualified));
            return matchSearch&&matchFilter;
          });
          return(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
              <div>
                <h3 style={{color:"#fff",fontWeight:900,margin:"0 0 2px",fontSize:16}}>🏆 Live Leaderboard</h3>
                <p style={{color:"#2a1540",fontSize:12,margin:0}}>Ranked by total taps · Top 20 prize eligible · {lbPlayers.length} shown</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <button onClick={()=>exportCSV(lbPlayers,"leaderboard_export.csv")} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>⬇ Export</button>
                <button onClick={fetchAll} style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)",color:PURPLE,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>🔄 Refresh</button>
              </div>
            </div>

            {/* Search + Filter row */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <input value={lbSearch} onChange={e=>setLbSearch(e.target.value)} placeholder="Search username or wallet…"
                style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:10,color:"#fff",fontSize:12,padding:"8px 14px",outline:"none",width:240}}/>
              {(["all","prize","active","banned"] as const).map(f=>(
                <button key={f} onClick={()=>setLbFilter(f)} style={{
                  background:lbFilter===f?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${lbFilter===f?"rgba(168,85,247,0.4)":BORDER}`,
                  color:lbFilter===f?PURPLE:"#555",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:lbFilter===f?700:400,
                }}>{f==="all"?"All":f==="prize"?"💰 Prize Eligible":f==="active"?"✅ Active":"🚫 Banned/Disq"}</button>
              ))}
            </div>

            {/* Top 3 podium */}
            {players.length>=3&&lbFilter==="all"&&!lbSearch&&(
              <div style={{display:"flex",gap:10,alignItems:"flex-end",justifyContent:"center",marginBottom:16,maxWidth:500,margin:"0 auto 16px"}}>
                {[players[1],players[0],players[2]].map((p,pos)=>{
                  if(!p)return null;
                  const lv=getLevelFromXP(p.total_score||0);
                  const r=getRankFromLevel(lv);
                  const medals=["🥈","🥇","🥉"];
                  const heights=["90%","100%","85%"];
                  return(
                    <div key={p.id} style={{flex:1,background:CARD,border:`1px solid ${pos===1?"rgba(245,200,66,0.3)":BORDER}`,borderRadius:16,padding:"14px 10px",textAlign:"center",alignSelf:pos===1?"flex-start":"auto"}}>
                      <div style={{fontSize:26,marginBottom:4}}>{medals[pos]}</div>
                      <div style={{fontSize:22,marginBottom:4}}>{CE[p.character]||"🎮"}</div>
                      <div style={{color:"#fff",fontWeight:800,fontSize:12,marginBottom:2}}>{p.username||"Anon"}</div>
                      <div style={{color:r.color,fontSize:9,fontWeight:700}}>{r.emoji} {r.name}</div>
                      <div style={{color:GOLD,fontWeight:900,fontSize:13,marginTop:4}}>👆{fmt(p.games_played||0)}</div>
                      {p.sol_wallet&&(
                        <button onClick={()=>copyToClipboard(p.sol_wallet,p.id+"_top")} style={{marginTop:6,background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.2)",borderRadius:6,color:copiedId===p.id+"_top"?GREEN:"#22d67a88",fontSize:9,fontWeight:700,padding:"3px 8px",cursor:"pointer",width:"100%"}}>
                          {copiedId===p.id+"_top"?"✅ Copied!":"📋 Copy Wallet"}
                        </button>
                      )}
                      {(p.is_banned||p.disqualified)&&<div style={{color:RED,fontSize:9,marginTop:2,fontWeight:700}}>{p.is_banned?"BANNED":"DISQ"}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.03)"}}>
                    {["Rank","","Username","Wallet (click to copy)","Level","Taps","Coins","Status","Actions"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#2a1540",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${BORDER}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lbPlayers.map((p)=>{
                    const i=players.indexOf(p);
                    const lv=getLevelFromXP(p.total_score||0);
                    const r=getRankFromLevel(lv);
                    const isPrize=i<20;
                    const isBad=p.is_banned||p.disqualified;
                    const medal=i===0?"👑":i===1?"🥈":i===2?"🥉":"";
                    const walletCopied=copiedId===p.id+"_wallet";
                    return(
                      <tr key={p.id} style={{borderBottom:i===19?`1px solid rgba(34,214,122,0.3)`:`1px solid ${BORDER}`,background:isBad?"rgba(239,68,68,0.04)":isPrize?"rgba(34,214,122,0.01)":"transparent"}}
                        onMouseEnter={e=>(e.currentTarget.style.background=isBad?"rgba(239,68,68,0.07)":isPrize?"rgba(34,214,122,0.03)":"rgba(255,255,255,0.02)")}
                        onMouseLeave={e=>(e.currentTarget.style.background=isBad?"rgba(239,68,68,0.04)":isPrize?"rgba(34,214,122,0.01)":"transparent")}>
                        <td style={{padding:"8px 12px",color:isPrize?GREEN:"#2a1540",fontWeight:900}}>{medal||`#${i+1}`}</td>
                        <td style={{padding:"8px 12px",fontSize:16}}>{CE[p.character]||"🎮"}</td>
                        <td style={{padding:"8px 12px",color:isBad?"#ef4444":"#fff",fontWeight:700}}>
                          {p.username||"—"}
                          {isPrize&&!isBad&&<span style={{marginLeft:4,fontSize:9,color:GREEN,fontWeight:800}}>💰</span>}
                          {isBad&&<span style={{marginLeft:4,fontSize:9,color:RED}}>{p.is_banned?"BANNED":"DISQ"}</span>}
                        </td>
                        <td style={{padding:"8px 8px"}}>
                          {p.sol_wallet?(
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <span style={{color:"#22d67a",fontSize:10,fontFamily:"monospace"}} title={p.sol_wallet}>{shortWallet(p.sol_wallet)}</span>
                              <button
                                onClick={()=>copyToClipboard(p.sol_wallet,p.id+"_wallet")}
                                title={p.sol_wallet}
                                style={{background:walletCopied?"rgba(34,214,122,0.15)":"rgba(34,214,122,0.06)",border:`1px solid ${walletCopied?"rgba(34,214,122,0.4)":"rgba(34,214,122,0.15)"}`,borderRadius:6,color:walletCopied?GREEN:"#22d67a88",fontSize:9,fontWeight:800,padding:"2px 7px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                                {walletCopied?"✅ Copied!":"📋"}
                              </button>
                            </div>
                          ):<span style={{color:RED,fontSize:10}}>⚠ None</span>}
                        </td>
                        <td style={{padding:"8px 12px",color:r.color,fontWeight:700}}>{r.emoji} Lv.{lv}</td>
                        <td style={{padding:"8px 12px",color:GOLD,fontWeight:900}}>👆{fmt(p.games_played||0)}</td>
                        <td style={{padding:"8px 12px",color:"#888"}}>{fmt(p.total_score||0)}</td>
                        <td style={{padding:"8px 12px"}}>{isBad?<Pill status={p.is_banned?"banned":"disqualified"}/>:<Pill status="active"/>}</td>
                        <td style={{padding:"8px 8px"}}>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>setActionModal(p)} style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:7,color:PURPLE,fontSize:10,fontWeight:700,padding:"5px 8px",cursor:"pointer"}}>⚙</button>
                            {p.sol_wallet&&<button onClick={()=>{setQuickPayModal(p);setQuickPayNote("");}} style={{background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.2)",borderRadius:7,color:GREEN,fontSize:10,fontWeight:700,padding:"5px 8px",cursor:"pointer"}} title="Quick pay / log payment">💸</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {lbPlayers.length===0&&<tr><td colSpan={9} style={{padding:40,textAlign:"center",color:"#222"}}>No players match filter</td></tr>}
                </tbody>
              </table>
            </div>
          </>
          );
        })()}
      </div>

        {tab==="submissions"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <h3 style={{color:"#fff",fontWeight:900,margin:"0 0 2px",fontSize:16}}>📸 Score Submissions</h3>
                <p style={{color:"#2a1540",fontSize:12,margin:0}}>{submissions.length} submissions · Screenshots uploaded by players from the Rankings tab</p>
              </div>
              <button onClick={fetchSubmissions} style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)",color:PURPLE,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                🔄 Refresh
              </button>
            </div>
            {subLoading&&<div style={{color:"#555",textAlign:"center",padding:32}}>Loading…</div>}
            {!subLoading&&submissions.length===0&&(
              <div style={{textAlign:"center",padding:48,color:"#333"}}>
                <div style={{fontSize:48,marginBottom:12}}>📭</div>
                <div style={{fontWeight:700}}>No submissions yet</div>
                <div style={{fontSize:12,marginTop:4}}>Players can submit from the Rankings tab in the game.</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {submissions.map((s:any)=>(
                <div key={s.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"hidden"}}>
                  {s.screenshot_url&&(
                    <a href={s.screenshot_url} target="_blank" rel="noopener noreferrer">
                      <img src={s.screenshot_url} alt="score screenshot" style={{width:"100%",display:"block",maxHeight:220,objectFit:"cover",cursor:"pointer"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                    </a>
                  )}
                  <div style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{color:"#fff",fontWeight:800,fontSize:14}}>{s.username||"Unknown"}</div>
                      <Pill status={s.status||"pending"}/>
                    </div>
                    <div style={{display:"flex",gap:12,marginBottom:8}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{color:GOLD,fontWeight:900,fontSize:15}}>👆 {s.taps_claimed!=null?fmt(s.taps_claimed):"—"}</div>
                        <div style={{color:"#555",fontSize:9,fontWeight:600}}>TAPS</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{color:PURPLE,fontWeight:800,fontSize:12}}>Lv.{s.level_claimed||"—"}</div>
                        <div style={{color:"#555",fontSize:9,fontWeight:600}}>LEVEL</div>
                      </div>
                    </div>
                    <div style={{color:"#444",fontSize:10,marginBottom:10}}>{s.submitted_at?new Date(s.submitted_at).toLocaleString():"—"}</div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={async()=>{await supabase.from("dt_submissions").update({status:"approved"}).eq("id",s.id);fetchSubmissions();}}
                        style={{flex:1,background:"rgba(34,214,122,0.1)",border:"1px solid rgba(34,214,122,0.3)",color:"#22d67a",borderRadius:8,padding:"6px 0",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        ✅ Approve
                      </button>
                      <button onClick={async()=>{await supabase.from("dt_submissions").update({status:"denied"}).eq("id",s.id);fetchSubmissions();}}
                        style={{flex:1,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",color:RED,borderRadius:8,padding:"6px 0",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        ❌ Deny
                      </button>
                      <button onClick={async()=>{await supabase.from("dt_submissions").delete().eq("id",s.id);fetchSubmissions();}}
                        style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"#444",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11}}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ── MODALS ── */}

      {/* Player actions modal */}
      {actionModal&&(
        <Modal title={`Actions: ${actionModal.username||"Player"}`} onClose={()=>setActionModal(null)}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12}}>
            <span style={{fontSize:36}}>{CE[actionModal.character]||"🎮"}</span>
            <div>
              <div style={{color:"#fff",fontWeight:900,fontSize:16}}>{actionModal.username||"—"}</div>
              <div style={{color:"#2a1540",fontSize:11,fontFamily:"monospace"}}>{shortWallet(actionModal.wallet_address)}</div>
              {actionModal.is_banned&&<Pill status="banned"/>}
              {actionModal.disqualified&&<Pill status="disqualified"/>}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
            {!actionModal.is_banned?(
              <button onClick={()=>{const r=prompt("Ban reason:");if(r)banPlayer(actionModal,r);}} style={{padding:"12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,color:RED,fontWeight:800,cursor:"pointer",fontSize:13}}>
                🚫 Ban Account
              </button>
            ):(
              <button onClick={()=>unbanPlayer(actionModal)} style={{padding:"12px",background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.2)",borderRadius:12,color:GREEN,fontWeight:800,cursor:"pointer",fontSize:13}}>
                ✅ Unban Account
              </button>
            )}

            {!actionModal.disqualified?(
              <button onClick={()=>{const r=prompt("Disqualify reason:");if(r)disqualifyPlayer(actionModal,r);}} style={{padding:"12px",background:"rgba(255,102,0,0.08)",border:"1px solid rgba(255,102,0,0.2)",borderRadius:12,color:"#ff6600",fontWeight:800,cursor:"pointer",fontSize:13}}>
                ⛔ Disqualify from Rewards
              </button>
            ):(
              <button onClick={()=>clearFlags(actionModal)} style={{padding:"12px",background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.2)",borderRadius:12,color:GREEN,fontWeight:800,cursor:"pointer",fontSize:13}}>
                ✅ Reinstate (Clear Flags)
              </button>
            )}

            {(actionModal.flag_count||0)>0&&(
              <button onClick={()=>clearFlags(actionModal)} style={{padding:"12px",background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:12,color:PURPLE,fontWeight:800,cursor:"pointer",fontSize:13}}>
                🧹 Clear {actionModal.flag_count} Flag(s)
              </button>
            )}
          </div>

          {/* Account details */}
          <div style={{marginTop:18,background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{color:"#2a1540",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Account Details</div>
            {[
              {label:"Wallet Address",value:actionModal.wallet_address},
              {label:"SOL Wallet",value:actionModal.sol_wallet||"Not set"},
              {label:"IP Address",value:actionModal.ip_address||"Unknown"},
              {label:"Device FP",value:actionModal.device_fingerprint?.slice(0,20)||"Unknown"},
              {label:"Total Taps",value:fmt(actionModal.games_played||0)},
              {label:"Joined",value:new Date(actionModal.created_at).toLocaleString()},
              {label:"Ban Reason",value:actionModal.ban_reason||"—"},
              {label:"Disq Reason",value:actionModal.disqualify_reason||"—"},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                <span style={{color:"#443355",fontSize:11}}>{row.label}</span>
                <span style={{color:"#888",fontSize:10,fontFamily:"monospace",maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",textAlign:"right"}}>{row.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Reward review modal */}
      {rewardModal&&(
        <Modal title={`Reward Review: ${rewardModal.username||"Player"}`} onClose={()=>setRewardModal(null)}>
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
            {[
              {label:"Rank",value:`#${rewardModal.rank_position}`},
              {label:"Username",value:rewardModal.username||"—"},
              {label:"Total Taps",value:fmt(rewardModal.games_played||0)},
              {label:"Wallet",value:rewardModal.sol_wallet||"⚠ NOT SET"},
              {label:"Proposed USDC",value:rewardModal.reward_amount_usdc>0?"$"+rewardModal.reward_amount_usdc:"—"},
              {label:"Period",value:rewardModal.period_end?new Date(rewardModal.period_end).toLocaleDateString():"—"},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                <span style={{color:"#443355",fontSize:11}}>{row.label}</span>
                <span style={{color:row.label==="Wallet"&&!rewardModal.sol_wallet?RED:"#888",fontSize:11,fontFamily:"monospace"}}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{marginBottom:12}}>
            <label style={{color:"#443355",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Admin Note</label>
            <input value={adminNote} onChange={e=>setAdminNote(e.target.value)} placeholder="Optional review note…"
              style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:8,color:"#fff",fontSize:12,padding:"9px 12px",outline:"none",boxSizing:"border-box"}}/>
          </div>

          {rewardModal.status==="approved"&&(
            <div style={{marginBottom:12}}>
              <label style={{color:"#443355",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>TX Signature (Solana)</label>
              <input value={txSig} onChange={e=>setTxSig(e.target.value)} placeholder="Paste transaction signature…"
                style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:8,color:"#22d67a",fontSize:11,padding:"9px 12px",outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
            </div>
          )}

          {rewardModal.status==="pending"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={()=>approveReward(rewardModal)} style={{padding:"12px",background:"rgba(34,214,122,0.1)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:12,color:GREEN,fontWeight:800,cursor:"pointer",fontSize:13}}>✅ Approve</button>
              <button onClick={()=>denyReward(rewardModal)} style={{padding:"12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,color:RED,fontWeight:800,cursor:"pointer",fontSize:13}}>⛔ Deny</button>
            </div>
          )}
          {rewardModal.status==="approved"&&(
            <button onClick={()=>markPaid(rewardModal)} disabled={!txSig} style={{width:"100%",padding:"12px",background:txSig?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${txSig?"rgba(168,85,247,0.4)":BORDER}`,borderRadius:12,color:txSig?PURPLE:"#333",fontWeight:800,cursor:txSig?"pointer":"not-allowed",fontSize:13}}>💸 Mark as Paid</button>
          )}
        </Modal>
      )}

      {/* Flag review modal */}
      {flagModal&&(
        <Modal title="Review Flag" onClose={()=>setFlagModal(null)}>
          <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
            <div style={{color:RED,fontWeight:700,fontSize:13,marginBottom:6}}>{flagModal.flag_reason}</div>
            {Object.entries(flagModal.flag_details||{}).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                <span style={{color:"#443355",fontSize:11}}>{k}</span>
                <span style={{color:"#888",fontSize:11,fontFamily:"monospace"}}>{String(v)}</span>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <label style={{color:"#443355",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Admin Note</label>
            <input value={adminNote} onChange={e=>setAdminNote(e.target.value)} placeholder="Note why you cleared this flag…"
              style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:8,color:"#fff",fontSize:12,padding:"9px 12px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <button onClick={()=>clearFlag(flagModal)} style={{width:"100%",padding:"12px",background:"rgba(34,214,122,0.1)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:12,color:GREEN,fontWeight:800,cursor:"pointer",fontSize:13}}>✅ Clear Flag</button>
        </Modal>
      )}

      {/* Quick Pay modal */}
      {quickPayModal&&(
        <Modal title={`💸 Pay ${quickPayModal.username||"Player"}`} onClose={()=>setQuickPayModal(null)}>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12}}>
              <span style={{fontSize:32}}>{CE[quickPayModal.character]||"🎮"}</span>
              <div>
                <div style={{color:"#fff",fontWeight:900,fontSize:15}}>{quickPayModal.username||"—"}</div>
                <div style={{color:"#2a1540",fontSize:11}}>Rank #{players.indexOf(quickPayModal)+1} · 👆{fmt(quickPayModal.games_played||0)} taps</div>
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <div style={{color:"#443355",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>SOL Wallet Address</div>
              <div style={{display:"flex",gap:6,alignItems:"center",background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 12px"}}>
                <span style={{color:GREEN,fontSize:11,fontFamily:"monospace",flex:1,wordBreak:"break-all"}}>{quickPayModal.sol_wallet}</span>
                <button onClick={()=>copyToClipboard(quickPayModal.sol_wallet,quickPayModal.id+"_qp")} style={{
                  background:copiedId===quickPayModal.id+"_qp"?"rgba(34,214,122,0.2)":"rgba(34,214,122,0.08)",
                  border:`1px solid ${copiedId===quickPayModal.id+"_qp"?"rgba(34,214,122,0.5)":"rgba(34,214,122,0.2)"}`,
                  borderRadius:8,color:GREEN,fontSize:11,fontWeight:800,padding:"6px 14px",cursor:"pointer",flexShrink:0,
                }}>{copiedId===quickPayModal.id+"_qp"?"✅ Copied!":"📋 Copy"}</button>
              </div>
            </div>

            <div>
              <label style={{color:"#443355",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Payment Note (logged to payout history)</label>
              <input value={quickPayNote} onChange={e=>setQuickPayNote(e.target.value)} placeholder="e.g. Week 1 prize — $10 USDC, TX: abc123…"
                style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:8,color:"#fff",fontSize:12,padding:"9px 12px",outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>copyToClipboard(quickPayModal.sol_wallet,quickPayModal.id+"_qp2")} style={{padding:"12px",background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.25)",borderRadius:12,color:GREEN,fontWeight:800,cursor:"pointer",fontSize:13}}>
              {copiedId===quickPayModal.id+"_qp2"?"✅ Copied!":"📋 Copy Wallet"}
            </button>
            <button onClick={()=>logQuickPay(quickPayModal,quickPayNote)} style={{padding:"12px",background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:12,color:PURPLE,fontWeight:800,cursor:"pointer",fontSize:13}}>📝 Log to History</button>
          </div>
        </Modal>
      )}

      {/* Generate reward queue modal */}
      {generateModal&&(
        <Modal title="⚡ Generate Reward Queue" onClose={()=>setGenerateModal(false)}>
          <p style={{color:"#888",fontSize:13,lineHeight:1.6,marginBottom:16}}>
            This will create a new reward review queue with the current <strong style={{color:"#fff"}}>Top 20 players</strong> (excluding banned/disqualified).<br/><br/>
            You can then set USDC amounts and approve/deny/pay each player individually.
          </p>
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 14px",marginBottom:18}}>
            {players.filter(p=>!p.is_banned&&!p.disqualified).slice(0,5).map((p,i)=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                <span style={{color:"#888",fontSize:11}}>#{i+1} {p.username||"—"}</span>
                <span style={{color:p.sol_wallet?GREEN:RED,fontSize:10,fontFamily:"monospace"}}>{p.sol_wallet?shortWallet(p.sol_wallet):"⚠ No wallet"}</span>
              </div>
            ))}
            {players.filter(p=>!p.is_banned&&!p.disqualified).length>5&&(
              <div style={{color:"#2a1540",fontSize:11,padding:"4px 0"}}>… and {Math.min(20,players.filter(p=>!p.is_banned&&!p.disqualified).length)-5} more</div>
            )}
          </div>
          <button onClick={generateRewardQueue} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,rgba(245,200,66,0.15),rgba(245,200,66,0.08))",border:"1px solid rgba(245,200,66,0.3)",borderRadius:12,color:GOLD,fontWeight:900,cursor:"pointer",fontSize:14}}>
            ⚡ Generate Queue for Top 20
          </button>
        </Modal>
      )}
    </div>
  );
}
