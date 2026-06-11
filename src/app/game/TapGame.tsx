"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getLevelFromXP, getLevelProgress, getRankFromLevel, getNextRank } from "@/lib/progression";
import { useAuth } from "@/lib/auth";

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:"pepe",     name:"Pepe",      emoji:"🐸", image:"/characters/pepe.png",     color:"#4caf50", glow:"76,175,80",   baseCoins:1, ability:"Lucky Tap",   abilityDesc:"15% chance to triple coins",       specialName:"Comfy Mode",   specialDesc:"2× all earnings for 30s", specialDuration:30, passive:(c:number)=>Math.random()<0.15?c*3:c, specialMultiplier:2, energyRegen:1,   comboMax:10 },
  { id:"gigachad", name:"Gigachad",  emoji:"💪", image:"/characters/gigachad.png", color:"#e0b87a", glow:"224,184,122", baseCoins:1, ability:"Sigma Grind", abilityDesc:"Combo builds 2× faster, 20× max",  specialName:"Max Mode",     specialDesc:"20× combo instantly for 20s", specialDuration:20, passive:(c:number)=>c, specialMultiplier:5, energyRegen:1,   comboMax:20 },
  { id:"trump",    name:"Trump",     emoji:"🎩", image:"/characters/trump.png",    color:"#3b82f6", glow:"59,130,246",  baseCoins:2, ability:"Deal Maker",  abilityDesc:"Every 50 taps = 10× burst",        specialName:"MAGA Mode",    specialDesc:"Helpers 5× + tap 3× for 40s", specialDuration:40, passive:(c:number)=>c, specialMultiplier:3, energyRegen:0.8, comboMax:12 },
  { id:"troll",    name:"Trollface", emoji:"🧌", image:"/characters/troll.png",    color:"#a855f7", glow:"168,85,247",  baseCoins:1, ability:"Chaos Agent", abilityDesc:"Random 0.5–8× per tap",            specialName:"CHAOS MODE",   specialDesc:"10s of 1–15× random", specialDuration:10, passive:(c:number)=>c*(0.5+Math.random()*7.5), specialMultiplier:1, energyRegen:1.2, comboMax:10 },
  { id:"bonk",     name:"Bonk",      emoji:"🐕", image:"/characters/bonk.png",     color:"#e8853a", glow:"232,133,58",  baseCoins:1, ability:"BONK Speed",  abilityDesc:"3× energy regen",                  specialName:"BONK Frenzy",  specialDesc:"Infinite energy + 3× for 15s", specialDuration:15, passive:(c:number)=>c, specialMultiplier:3, energyRegen:3,   comboMax:10 },
];

// ─── Upgrades (40 items) ──────────────────────────────────────────────────────
// tapsPerSec: auto-tappers that add to both coins AND tap counter
// minLevel: rank gate (uses player level)
const UPGRADES: Array<{id:string;name:string;emoji:string;desc:string;baseCost:number;costMult:number;tapsPerSec?:number;minLevel?:number;category:string}> = [
  // ── AUTO-TAPPERS (rank-gated, also count as taps on leaderboard) ──────────
  { id:"helper_1",   name:"FUD Bear",         emoji:"🐻", desc:"5 auto-taps/sec",              baseCost:200,       costMult:2.8,  tapsPerSec:5,    minLevel:1,  category:"auto" },
  { id:"helper_2",   name:"Bot Army",         emoji:"🤖", desc:"10 auto-taps/sec",             baseCost:1000,      costMult:3.0,  tapsPerSec:10,   minLevel:1,  category:"auto" },
  { id:"helper_3",   name:"Click Farm",       emoji:"🏭", desc:"25 auto-taps/sec",             baseCost:5000,      costMult:3.2,  tapsPerSec:25,   minLevel:5,  category:"auto" },
  { id:"helper_4",   name:"Whale Wallet",     emoji:"🐋", desc:"50 auto-taps/sec",             baseCost:20000,     costMult:3.5,  tapsPerSec:50,   minLevel:8,  category:"auto" },
  { id:"helper_5",   name:"Hedge Fund",       emoji:"🏦", desc:"80 auto-taps/sec",             baseCost:80000,     costMult:3.8,  tapsPerSec:80,   minLevel:11, category:"auto" },
  { id:"helper_6",   name:"AI Engine",        emoji:"🧠", desc:"130 auto-taps/sec",            baseCost:300000,    costMult:4.0,  tapsPerSec:130,  minLevel:15, category:"auto" },
  { id:"helper_7",   name:"Quantum Farm",     emoji:"⚛️", desc:"250 auto-taps/sec",            baseCost:1200000,   costMult:4.2,  tapsPerSec:250,  minLevel:20, category:"auto" },
  { id:"helper_8",   name:"Sigma Mine",       emoji:"💪", desc:"500 auto-taps/sec",            baseCost:5000000,   costMult:4.5,  tapsPerSec:500,  minLevel:25, category:"auto" },
  { id:"helper_9",   name:"Tower Lord Farm",  emoji:"🏆", desc:"1000 auto-taps/sec 👑",        baseCost:20000000,  costMult:5.0,  tapsPerSec:1000, minLevel:30, category:"auto" },
  // ── TAP POWER (coins per manual tap) ─────────────────────────────────────
  { id:"tap_power",  name:"Power Tap",        emoji:"⚡", desc:"+1 coin per tap",              baseCost:50,        costMult:1.8,  category:"tap"  },
  { id:"tap_pow2",   name:"Double Strike",    emoji:"⚡⚡",desc:"+3 coins per tap",             baseCost:400,       costMult:2.0,  category:"tap"  },
  { id:"tap_pow3",   name:"Force Tap",        emoji:"🔥", desc:"+8 coins per tap",             baseCost:3000,      costMult:2.2,  category:"tap"  },
  { id:"tap_pow4",   name:"Mega Strike",      emoji:"💣", desc:"+20 coins per tap",            baseCost:25000,     costMult:2.5,  category:"tap"  },
  { id:"tap_pow5",   name:"God Tap",          emoji:"🌋", desc:"+60 coins per tap",            baseCost:200000,    costMult:2.8,  category:"tap"  },
  { id:"tap_pow6",   name:"Void Tap",         emoji:"🌌", desc:"+200 coins per tap",           baseCost:2000000,   costMult:3.0,  category:"tap"  },
  // ── COIN MULTIPLIER ───────────────────────────────────────────────────────
  { id:"multi_tap",  name:"Multi Tap",        emoji:"✖️", desc:"×2 coins per tap",             baseCost:500,       costMult:2.5,  category:"tap"  },
  { id:"multi_tap2", name:"Triple Tap",       emoji:"✖️✖️",desc:"×0.5 more multiplier",        baseCost:3000,      costMult:2.8,  category:"tap"  },
  { id:"multi_tap3", name:"Quad Tap",         emoji:"🔱", desc:"×1 more multiplier",           baseCost:20000,     costMult:3.0,  category:"tap"  },
  { id:"multi_tap4", name:"Omega Tap",        emoji:"♾️", desc:"×2 more multiplier",           baseCost:200000,    costMult:3.5,  category:"tap"  },
  // ── CRITICAL HIT ─────────────────────────────────────────────────────────
  { id:"crit_chance",name:"Crit Hit",         emoji:"💥", desc:"+10% crit chance",             baseCost:300,       costMult:2.2,  category:"crit" },
  { id:"crit_chan2", name:"Eagle Eye",         emoji:"🦅", desc:"+10% more crit chance",        baseCost:1500,      costMult:2.4,  category:"crit" },
  { id:"crit_chan3", name:"Laser Focus",       emoji:"🎯", desc:"+10% more crit chance",        baseCost:8000,      costMult:2.8,  category:"crit" },
  { id:"crit_pow",   name:"Crit Force",        emoji:"💢", desc:"Crit = 8× instead of 5×",     baseCost:5000,      costMult:2.5,  category:"crit" },
  { id:"crit_pow2",  name:"Crit Nuke",         emoji:"☢️", desc:"Crit = 15× instead",          baseCost:50000,     costMult:3.0,  category:"crit" },
  // ── ENERGY ───────────────────────────────────────────────────────────────
  { id:"energy_max", name:"Energy Tank",       emoji:"🔋", desc:"+200 max energy",              baseCost:100,       costMult:2.0,  category:"energy" },
  { id:"energy_max2",name:"Power Cell",        emoji:"⚡🔋",desc:"+500 max energy",             baseCost:700,       costMult:2.2,  category:"energy" },
  { id:"energy_max3",name:"Mega Battery",      emoji:"🏋️", desc:"+1000 max energy",            baseCost:5000,      costMult:2.5,  category:"energy" },
  { id:"energy_reg", name:"Quick Charge",      emoji:"⚡", desc:"Energy regen +0.5×",           baseCost:150,       costMult:1.9,  category:"energy" },
  { id:"energy_reg2",name:"Fast Charge",       emoji:"⚡⚡",desc:"Energy regen +1×",            baseCost:1000,      costMult:2.1,  category:"energy" },
  { id:"energy_reg3",name:"Turbo Charge",      emoji:"🌩️", desc:"Energy regen +2×",            baseCost:8000,      costMult:2.4,  category:"energy" },
  // ── COMBO ─────────────────────────────────────────────────────────────────
  { id:"combo_speed",name:"Combo Rush",        emoji:"🔥", desc:"Combo builds 20% faster",      baseCost:80,        costMult:1.9,  category:"combo" },
  { id:"combo_spd2", name:"Turbo Combo",        emoji:"🔥🔥",desc:"Combo builds 50% faster",   baseCost:600,       costMult:2.1,  category:"combo" },
  { id:"combo_spd3", name:"Lightning Combo",    emoji:"⚡🔥",desc:"Combo builds 100% faster",  baseCost:4000,      costMult:2.4,  category:"combo" },
  { id:"combo_max",  name:"Combo King",         emoji:"👑", desc:"+5 max combo",                baseCost:400,       costMult:2.3,  category:"combo" },
  { id:"combo_max2", name:"Combo God",          emoji:"👑👑",desc:"+15 max combo",             baseCost:3000,      costMult:2.6,  category:"combo" },
  { id:"combo_max3", name:"Infinite Combo",     emoji:"♾️🔥",desc:"+30 max combo",            baseCost:25000,     costMult:3.0,  category:"combo" },
  // ── SPECIAL ───────────────────────────────────────────────────────────────
  { id:"special_cd", name:"Special Charger",    emoji:"⏩", desc:"Special charges 50% faster",  baseCost:300,       costMult:2.2,  category:"special" },
  { id:"special_cd2",name:"Quick Special",      emoji:"⚡⏩",desc:"Special charges 100% faster",baseCost:2000,      costMult:2.5,  category:"special" },
  { id:"special_cd3",name:"Instant Special",    emoji:"💫", desc:"Special charges 200% faster", baseCost:15000,     costMult:2.8,  category:"special" },
  // ── BONUS ─────────────────────────────────────────────────────────────────
  { id:"lucky_strike",name:"Lucky Strike",      emoji:"🎰", desc:"+5% lucky tap chance",        baseCost:500,       costMult:2.8,  category:"bonus" },
  { id:"coin_aura",  name:"Coin Aura",          emoji:"💰", desc:"All coins +50%",              baseCost:10000,     costMult:3.2,  category:"bonus" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(n:number){ if(n>=1e9)return(n/1e9).toFixed(2)+"B"; if(n>=1e6)return(n/1e6).toFixed(2)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.floor(n).toString(); }
function getUpgCost(u:typeof UPGRADES[0], lv:number){ return Math.floor(u.baseCost*Math.pow(u.costMult,lv)); }
function getPlayerId(){ try{ let id=localStorage.getItem("degen_player_id"); if(!id){ id="p_"+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem("degen_player_id",id); } return id; }catch{ return "anon_"+Math.random().toString(36).slice(2,8); } }
function getPlayerName(){ try{ return localStorage.getItem("degen_username")||""; }catch{ return ""; } }
function setPlayerName(n:string){ try{ localStorage.setItem("degen_username",n); }catch{} }
function getPlayerWallet(){ try{ return localStorage.getItem("degen_sol_wallet")||""; }catch{ return ""; } }
function setPlayerWallet(w:string){ try{ localStorage.setItem("degen_sol_wallet",w); }catch{} }

interface SaveData { charId:string; coins:number; totalEarned:number; totalTaps:number; upgrades:Record<string,number>; highScore:number; }

function loadSave(charId:string):SaveData{
  try{ const r=localStorage.getItem(`degen_save_${charId}`); if(r){ const d=JSON.parse(r); return { charId:d.charId, coins:d.coins||0, totalEarned:d.totalEarned||0, totalTaps:d.totalTaps||0, upgrades:d.upgrades||{}, highScore:d.highScore||0 }; } }catch{}
  return { charId, coins:0, totalEarned:0, totalTaps:0, upgrades:{}, highScore:0 };
}
function persistSave(d:SaveData){ try{ localStorage.setItem(`degen_save_${d.charId}`,JSON.stringify(d)); }catch{} }

async function syncDB(pid:string,uname:string,charId:string,totalEarned:number,totalTaps:number,solWallet?:string){
  try{
    const{supabase}=await import("@/lib/supabase");
    await supabase.from("dt_players").upsert({
      wallet_address:pid, username:uname||("Degen_"+pid.slice(-6)), character:charId,
      total_score:Math.floor(totalEarned), games_played:Math.floor(totalTaps),
      is_verified:false,
      ...(solWallet?{sol_wallet:solWallet}:{}),
    },{onConflict:"wallet_address"});
  }catch{}
}

interface Particle { id:number; x:number; y:number; value:string; color:string; big:boolean; }
interface LBEntry { id:string; wallet_address:string; username:string; character:string; total_score:number; games_played:number; }

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(){
  const [t,setT]=useState("");
  useEffect(()=>{
    function c(){ const now=Date.now(),p=48*3600000,next=Math.ceil(now/p)*p,d=next-now; const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000); setT(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`); }
    c(); const id=setInterval(c,1000); return()=>clearInterval(id);
  },[]);
  return t;
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar({username,avatar,onSettings,onLogout}:{username:string;avatar:string;onSettings:()=>void;onLogout:()=>void}){
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"rgba(6,0,14,0.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
      <img src="/logo.png" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none";}} style={{width:22,height:22,objectFit:"contain",filter:"drop-shadow(0 0 6px rgba(168,85,247,0.6))"}}/>
      <span style={{color:"#fff",fontWeight:900,fontSize:13,letterSpacing:"-0.02em",flex:1}}>DEGEN CLICKER</span>
      <span style={{fontSize:18,lineHeight:1}}>{avatar||"🐸"}</span>
      <span style={{color:"#888",fontSize:12,fontWeight:700,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username||"Degen"}</span>
      <button onClick={onSettings} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#888",fontSize:13,padding:"5px 9px",cursor:"pointer"}}>⚙️</button>
      <button onClick={onLogout} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:"#ef4444",fontSize:11,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Log out</button>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const AVATARS=["🐸","💪","🎩","🧌","🐕","💀","🦊","🐉","🤖","👾","🦁","🐺","🦂","🎭","🔥","💎"];
function getAvatar(){ try{return localStorage.getItem("degen_avatar")||"";}catch{return "";} }
function setAvatarStore(a:string){ try{localStorage.setItem("degen_avatar",a);}catch{} }

function SettingsTab({username,solWallet,onSave}:{username:string;solWallet:string;onSave:(u:string,w:string,av:string)=>void}){
  const {user,signOut}=useAuth();
  const [name,setName]=useState(username);
  const [wallet,setWallet]=useState(solWallet);
  const [avatar,setAvatar]=useState(()=>getAvatar()||"🐸");
  const [pwMode,setPwMode]=useState(false);
  const [pwMsg,setPwMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [delConfirm,setDelConfirm]=useState(false);
  const [delText,setDelText]=useState("");

  async function handleSave(){
    setSaving(true);
    setAvatarStore(avatar);
    onSave(name.trim()||username, wallet.trim(), avatar);
    setTimeout(()=>{setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);},600);
  }

  async function handleResetPw(){
    if(!user?.email){setPwMsg("No email linked to account.");return;}
    try{
      const{supabase}=await import("@/lib/supabase");
      await supabase.auth.resetPasswordForEmail(user.email,{redirectTo:window.location.origin+"/login"});
      setPwMsg("✅ Password reset email sent to "+user.email);
    }catch{setPwMsg("Failed to send reset email.");}
  }

  async function handleDeleteAccount(){
    if(delText.toLowerCase()!=="delete"){return;}
    try{
      const{supabase}=await import("@/lib/supabase");
      await supabase.from("dt_players").delete().eq("wallet_address",user?.id||"");
      await supabase.auth.admin?.deleteUser?.(user?.id||"").catch(()=>{});
      await signOut();
    }catch{
      await signOut();
    }
  }

  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#e8e8f0",paddingTop:58,paddingBottom:100,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(120,40,200,0.18) 0%,transparent 55%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:440,margin:"0 auto",padding:"0 14px"}}>

        {/* Profile Header */}
        <div style={{textAlign:"center",padding:"24px 0 20px"}}>
          <div style={{fontSize:64,lineHeight:1,marginBottom:8}}>{avatar}</div>
          <div style={{color:"#fff",fontWeight:900,fontSize:18,marginBottom:2}}>{name||"Degen"}</div>
          {user?.email&&<div style={{color:"#443355",fontSize:11}}>{user.email}</div>}
        </div>

        {/* Avatar picker */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:16,marginBottom:10}}>
          <div style={{color:"#888",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Avatar</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)} style={{
                fontSize:24,background:avatar===a?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.03)",
                border:avatar===a?"2px solid rgba(168,85,247,0.6)":"2px solid transparent",
                borderRadius:10,padding:4,cursor:"pointer",lineHeight:1,
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:16,marginBottom:10}}>
          <div style={{color:"#888",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Username</div>
          <input value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder="Your display name"
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,padding:"10px 12px",outline:"none",boxSizing:"border-box"}}/>
        </div>

        {/* Wallet */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:16,marginBottom:10}}>
          <div style={{color:"#888",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Solana Wallet Address</div>
          <div style={{color:"#443355",fontSize:10,marginBottom:8}}>Required for prize payouts</div>
          <input value={wallet} onChange={e=>setWallet(e.target.value)} placeholder="Your Solana wallet address"
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#22d67a",fontSize:11,fontWeight:700,fontFamily:"monospace",padding:"10px 12px",outline:"none",boxSizing:"border-box"}}/>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",
          color:"#fff",fontWeight:900,fontSize:15,border:"none",borderRadius:14,
          padding:"14px",cursor:"pointer",marginBottom:10,
          boxShadow:"0 0 30px rgba(168,85,247,0.3)",
        }}>{saving?"Saving…":saved?"✅ Saved!":"Save Changes"}</button>

        {/* Divider */}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",margin:"12px 0"}}/>

        {/* Change password */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:16,marginBottom:10}}>
          <div style={{color:"#888",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Password</div>
          {!pwMode
            ?<button onClick={()=>setPwMode(true)} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#ccc",fontSize:13,fontWeight:700,padding:"10px 16px",cursor:"pointer",width:"100%"}}>Change Password</button>
            :<div>
              <p style={{color:"#553366",fontSize:12,marginBottom:10}}>We'll send a password reset link to your email: <strong style={{color:"#888"}}>{user?.email||"—"}</strong></p>
              <button onClick={handleResetPw} style={{background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:10,color:"#c084fc",fontSize:13,fontWeight:700,padding:"10px 16px",cursor:"pointer",width:"100%"}}>Send Reset Email</button>
              {pwMsg&&<div style={{color:pwMsg.startsWith("✅")?"#22d67a":"#ef4444",fontSize:12,marginTop:8,textAlign:"center"}}>{pwMsg}</div>}
            </div>
          }
        </div>

        {/* Log out */}
        <button onClick={signOut} style={{
          width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",
          color:"#888",fontWeight:700,fontSize:14,borderRadius:14,padding:"13px",cursor:"pointer",marginBottom:10,
        }}>Log Out</button>

        {/* Delete account */}
        <div style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:18,padding:16,marginBottom:10}}>
          <div style={{color:"#ef4444",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Danger Zone</div>
          {!delConfirm
            ?<button onClick={()=>setDelConfirm(true)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#ef4444",fontSize:13,fontWeight:700,padding:"10px 16px",cursor:"pointer",width:"100%"}}>Delete Account</button>
            :<div>
              <p style={{color:"#7a3333",fontSize:12,marginBottom:8}}>This will permanently delete your account and all game data. Type <strong>delete</strong> to confirm.</p>
              <input value={delText} onChange={e=>setDelText(e.target.value)} placeholder="Type delete to confirm"
                style={{width:"100%",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#ef4444",fontSize:13,padding:"9px 12px",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setDelConfirm(false);setDelText("");}} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#888",fontSize:13,fontWeight:700,padding:"10px",cursor:"pointer"}}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={delText.toLowerCase()!=="delete"} style={{flex:1,background:delText.toLowerCase()==="delete"?"rgba(239,68,68,0.8)":"rgba(239,68,68,0.15)",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,padding:"10px",cursor:delText.toLowerCase()==="delete"?"pointer":"not-allowed"}}>Delete Forever</button>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
const TABS=[{id:"home",label:"Home",emoji:"🏠"},{id:"play",label:"Play",emoji:"🎮"},{id:"shop",label:"Shop",emoji:"⚡"},{id:"ranks",label:"Ranks",emoji:"🏆"},{id:"settings",label:"Settings",emoji:"⚙️"}];

function BottomBar({active,onTab}:{active:string;onTab:(t:string)=>void}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(6,0,14,0.98)",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {TABS.map(tab=>(
        <button key={tab.id} onClick={()=>onTab(tab.id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",opacity:active===tab.id?1:0.38,transition:"opacity 0.15s",position:"relative"}}>
          {active===tab.id&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:`linear-gradient(90deg,transparent,${active==="play"?"#a855f7":active==="ranks"?"#f5c842":active==="shop"?"#22d67a":"#888"},transparent)`,borderRadius:"0 0 2px 2px"}}/>}
          <span style={{fontSize:18}}>{tab.emoji}</span>
          <span style={{fontSize:9,fontWeight:active===tab.id?800:500,color:active===tab.id?"#fff":"#666",textTransform:"uppercase",letterSpacing:"0.05em"}}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Username Modal ───────────────────────────────────────────────────────────
function UsernameModal({onConfirm}:{onConfirm:(name:string,wallet:string)=>void}){
  const [name,setName]=useState("");
  const [wallet,setWallet]=useState("");
  const [walletErr,setWalletErr]=useState("");
  const adj=["Degen","Sigma","Giga","Based","Ape","Moon","Chad","Ngmi","Rekt","Diamond","Gold","Paper","Bull","Bear"];
  const noun=["Tapper","Clicker","Frog","Whale","Pepe","Lord","King","God","Pump","Hands","Degen","Grinder"];
  const [sug]=useState(()=>adj[Math.floor(Math.random()*adj.length)]+noun[Math.floor(Math.random()*noun.length)]+Math.floor(Math.random()*999));

  function validate(){
    if(wallet.trim()&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.trim())){
      setWalletErr("Doesn't look like a valid Solana address");return;
    }
    setWalletErr("");
    onConfirm(name.trim()||sug, wallet.trim());
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(16px)"}}>
      <div style={{background:"linear-gradient(145deg,#120828,#08001a)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:24,padding:"28px 22px",width:"100%",maxWidth:340,textAlign:"center",boxShadow:"0 0 80px rgba(168,85,247,0.25)"}}>
        <div style={{fontSize:44,marginBottom:10}}>🎮</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:20,marginBottom:4}}>Set Up Your Profile</h2>
        <p style={{color:"#553366",fontSize:12,marginBottom:18,lineHeight:1.5}}>Choose a name for the leaderboard.<br/>Add your Solana wallet to receive prize payouts.</p>
        <div style={{marginBottom:10,textAlign:"left"}}>
          <label style={{color:"#6644aa",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5}}>Name</label>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,18))} onKeyDown={e=>e.key==="Enter"&&validate()} placeholder={sug} autoFocus
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:10,color:"#fff",fontSize:15,padding:"11px 14px",outline:"none",boxSizing:"border-box"}}/>
          <div style={{color:"#332244",fontSize:10,marginTop:3}}>Leave blank → {sug}</div>
        </div>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label style={{color:"#6644aa",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5}}>
            Solana Wallet <span style={{color:"#332244",fontWeight:500,textTransform:"none"}}>— optional</span>
          </label>
          <input value={wallet} onChange={e=>{setWallet(e.target.value);setWalletErr("");}} placeholder="e.g. 7xKXt…qF2P" onKeyDown={e=>e.key==="Enter"&&validate()}
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${walletErr?"rgba(255,60,60,0.6)":"rgba(168,85,247,0.2)"}`,borderRadius:10,color:"#fff",fontSize:12,padding:"11px 14px",outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
          {walletErr
            ?<div style={{color:"#ff6060",fontSize:10,marginTop:3}}>⚠ {walletErr}</div>
            :<div style={{color:"#332244",fontSize:10,marginTop:3}}>Used to send USDC if you win 🏆 — no sign-in needed</div>
          }
        </div>
        <button onClick={validate} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:13,color:"#fff",fontWeight:900,fontSize:15,padding:"13px",cursor:"pointer",boxShadow:"0 0 32px rgba(168,85,247,0.4)"}}>
          Let&apos;s Go! 🚀
        </button>
      </div>
    </div>
  );
}

// ─── Character Stage ──────────────────────────────────────────────────────────
function ModelStage({ char, specialActive, charPulse, onTap, firstPlay }:{
  char:typeof CHARACTERS[0]; specialActive:boolean; charPulse:boolean; onTap:(e:React.MouseEvent|React.TouchEvent)=>void; firstPlay:boolean;
}){
  const SIZE = 240;
  return (
    <div style={{position:"relative", width:SIZE, height:SIZE, margin:"0 auto", flexShrink:0}}>
      <div style={{position:"absolute",inset:-12,borderRadius:"50%",background:`radial-gradient(ellipse at 50% 80%,rgba(${char.glow},${specialActive?0.45:0.18}) 0%,transparent 65%)`,pointerEvents:"none",transition:"background 0.5s"}}/>
      {specialActive&&<>
        <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.5)`,animation:"orbit1 3s linear infinite",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:-16,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.25)`,animation:"orbit2 6s linear infinite reverse",pointerEvents:"none"}}/>
      </>}
      <div
        onMouseDown={onTap} onTouchStart={onTap}
        style={{
          position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",
          cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",
          border:specialActive?`2px solid rgba(${char.glow},0.9)`:`2px solid rgba(${char.glow},0.3)`,
          boxShadow:specialActive?`0 0 50px rgba(${char.glow},0.7),0 0 100px rgba(${char.glow},0.3),inset 0 0 30px rgba(${char.glow},0.1)`:`0 0 20px rgba(${char.glow},0.25)`,
          transition:"box-shadow 0.4s,border 0.4s,transform 0.1s",
          transform:charPulse?"scale(0.94)":"scale(1)",
          background:`radial-gradient(ellipse at 50% 30%,rgba(${char.glow},0.08) 0%,#0a0016 100%)`,
        }}
      >
        <img src={char.image} alt={char.name} draggable={false}
          style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block",pointerEvents:"none",
            filter:specialActive?`brightness(1.15) saturate(1.3) drop-shadow(0 0 12px rgba(${char.glow},0.5))`:"none",transition:"filter 0.4s"}}
          onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:100px">${char.emoji}</div>`;}}
        />
      </div>
      {firstPlay&&(
        <div style={{position:"absolute",bottom:-26,left:"50%",transform:"translateX(-50%)",fontSize:11,color:"#6644aa",fontWeight:600,whiteSpace:"nowrap",animation:"floatHint 1.5s ease-in-out infinite"}}>
          TAP TO EARN 👆
        </div>
      )}
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({onPlay,username,avatar,totalEarned,totalTaps,level,rank,xpProgress,nextRank,charId}:{
  onPlay:()=>void;username:string;avatar:string;totalEarned:number;totalTaps:number;
  level:number;rank:ReturnType<typeof getRankFromLevel>;xpProgress:{pct:number;current:number;needed:number};
  nextRank:ReturnType<typeof getNextRank>;charId:string|null;
}){
  const cd=useCountdown();
  const char=CHARACTERS.find(c=>c.id===charId);
  const [pulse,setPulse]=useState(false);
  useEffect(()=>{const id=setInterval(()=>{setPulse(p=>!p);},2000);return()=>clearInterval(id);},[]);

  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#e8e8f0",paddingTop:46,paddingBottom:90,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:`radial-gradient(ellipse at 50% 20%,rgba(${char?char.glow:"120,40,200"},0.22) 0%,transparent 60%)`,pointerEvents:"none",zIndex:0,transition:"background 1s"}}/>

      {/* Hero greeting */}
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"22px 16px 12px"}}>
        <div style={{fontSize:56,lineHeight:1,marginBottom:6,filter:`drop-shadow(0 0 20px rgba(${char?char.glow:"168,85,247"},0.5))`,transform:pulse?"scale(1.06)":"scale(1)",transition:"transform 0.4s ease"}}>{avatar||"🐸"}</div>
        <div style={{color:"#443355",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Welcome back</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,marginBottom:6,letterSpacing:"-0.02em"}}>{username||"Degen"}</h2>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(168,85,247,0.1)",border:`1px solid ${rank.color}44`,borderRadius:20,padding:"5px 14px"}}>
          <span style={{fontSize:14}}>{rank.emoji}</span>
          <span style={{color:rank.color,fontWeight:800,fontSize:12}}>{rank.name}</span>
          <span style={{color:"#443355",fontSize:11,marginLeft:2}}>Lv.{level}</span>
        </div>
      </div>

      {/* XP progress */}
      <div style={{position:"relative",zIndex:1,padding:"10px 14px 12px"}}>
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:"#555",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>XP Progress</span>
            {nextRank&&<span style={{color:nextRank.color,fontSize:10,fontWeight:700}}>{nextRank.emoji} {nextRank.name} →</span>}
          </div>
          <div style={{height:7,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}88,${rank.color})`,borderRadius:4,transition:"width 0.6s ease",boxShadow:`0 0 8px ${rank.color}88`}}/>
          </div>
          <div style={{color:"#333",fontSize:10,marginTop:4,textAlign:"right"}}>{fmt(xpProgress.current)} / {fmt(xpProgress.needed)} XP</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[
            {emoji:"💰",label:"Earned",value:fmt(totalEarned),color:"#f5c842"},
            {emoji:"👆",label:"Taps",value:fmt(totalTaps),color:"#a855f7"},
            {emoji:"⏱",label:"Reset In",value:cd,color:"#22d67a"},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.emoji}</div>
              <div style={{color:s.color,fontWeight:900,fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
              <div style={{color:"#333",fontSize:9,marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current character card */}
      {char?(
        <div style={{position:"relative",zIndex:1,padding:"0 14px 12px"}}>
          <div style={{background:`rgba(${char.glow},0.05)`,border:`1px solid rgba(${char.glow},0.2)`,borderRadius:16,padding:"14px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:42,filter:`drop-shadow(0 0 14px rgba(${char.glow},0.5))`}}>{char.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#555",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Active Legend</div>
              <div style={{color:"#fff",fontWeight:900,fontSize:15,marginBottom:2}}>{char.name}</div>
              <div style={{color:`rgb(${char.glow})`,fontSize:10}}>⚡ {char.ability}</div>
            </div>
            <button onClick={onPlay} style={{background:`rgba(${char.glow},0.18)`,border:`1px solid rgba(${char.glow},0.4)`,borderRadius:10,color:`rgb(${char.glow})`,fontWeight:800,fontSize:11,padding:"8px 12px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>Change</button>
          </div>
        </div>
      ):(
        <div style={{position:"relative",zIndex:1,padding:"0 14px 12px"}}>
          <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:16,padding:"14px",textAlign:"center"}}>
            <div style={{color:"#553366",fontSize:12,marginBottom:4}}>No character selected</div>
            <button onClick={onPlay} style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:10,color:"#a855f7",fontWeight:800,fontSize:12,padding:"8px 16px",cursor:"pointer"}}>Pick Your Legend →</button>
          </div>
        </div>
      )}

      {/* Big play button */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 14px"}}>
        <button onClick={onPlay} style={{
          width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",
          color:"#fff",fontWeight:900,fontSize:18,border:"none",borderRadius:18,
          padding:"18px",cursor:"pointer",letterSpacing:"-0.01em",
          boxShadow:"0 0 60px rgba(168,85,247,0.45),0 0 120px rgba(168,85,247,0.12)",
          position:"relative",overflow:"hidden",
        }}>
          <span style={{position:"relative",zIndex:1}}>🎮 Play Now</span>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.1),transparent)",pointerEvents:"none"}}/>
        </button>
      </div>

      {/* Feature tiles */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 8px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {emoji:"🔥",title:"Combo Multiplier",desc:"Tap fast — stack up to 20× coins"},
            {emoji:"🤖",title:"Auto-Tappers",desc:"Hire helpers to earn while AFK"},
            {emoji:"⚡",title:"Upgrades",desc:"Power up in the Shop tab"},
            {emoji:"🏆",title:"Win USDC",desc:"Top 20 players paid every 48hrs"},
          ].map(f=>(
            <div key={f.title} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:14,padding:"13px 11px"}}>
              <div style={{fontSize:22,marginBottom:5}}>{f.emoji}</div>
              <div style={{color:"#ccc",fontWeight:800,fontSize:12,marginBottom:3}}>{f.title}</div>
              <div style={{color:"#333",fontSize:10,lineHeight:1.4}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD TAB ──────────────────────────────────────────────────────────
function LeaderboardTab({myPlayerId}:{myPlayerId:string}){
  const [players,setPlayers]=useState<LBEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const cd=useCountdown();
  const [view,setView]=useState<"podium"|"list">("podium");
  const CE:Record<string,string>={pepe:"🐸",gigachad:"💪",trump:"🎩",troll:"🧌",bonk:"🐕"};

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const{supabase}=await import("@/lib/supabase");
      const{data}=await supabase.from("dt_players").select("id,wallet_address,username,character,total_score,games_played").order("games_played",{ascending:false}).limit(200);
      // Deduplicate by username — keep the record with highest taps per user
      const seen=new Map<string,LBEntry>();
      for(const p of (data||[]) as LBEntry[]){
        const key=(p.username||"").toLowerCase();
        if(!seen.has(key)||( p.games_played>(seen.get(key)!.games_played))){ seen.set(key,p); }
      }
      setPlayers(Array.from(seen.values()).sort((a,b)=>b.games_played-a.games_played));
    }catch{}
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const rank=(lv:number)=>getRankFromLevel(lv);

  return(
    <div style={{minHeight:"100vh",background:"#080010",paddingBottom:90,overflowY:"auto"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(8,0,20,0.98)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"10px 14px",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div>
            <h2 style={{color:"#fff",fontWeight:900,fontSize:16,margin:0}}>🏆 Leaderboard</h2>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:1}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#22d67a",boxShadow:"0 0 5px #22d67a",animation:"pulseDot 1s infinite"}}/>
              <span style={{color:"#22d67a",fontSize:9,fontWeight:700}}>LIVE</span>
              <span style={{color:"#443355",fontSize:9,marginLeft:3}}>Resets in</span>
              <span style={{color:"#f5c842",fontWeight:900,fontSize:11,fontVariantNumeric:"tabular-nums"}}>{cd}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <div style={{display:"flex",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,overflow:"hidden"}}>
              {(["podium","list"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{background:view===v?"rgba(168,85,247,0.2)":"transparent",border:"none",color:view===v?"#a855f7":"#555",fontSize:11,fontWeight:700,padding:"5px 10px",cursor:"pointer",textTransform:"capitalize"}}>{v==="podium"?"🏅":"📋"} {v}</button>
              ))}
            </div>
            <button onClick={load} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"#666",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11}}>↻</button>
          </div>
        </div>
      </div>
      {loading?(
        <div style={{padding:56,textAlign:"center",color:"#333"}}>⏳ Loading...</div>
      ):players.length===0?(
        <div style={{padding:56,textAlign:"center"}}><div style={{fontSize:48,marginBottom:8}}>🏆</div><div style={{color:"#443355",fontSize:14,fontWeight:700}}>No players yet — be first!</div></div>
      ):view==="podium"?(
        <div style={{padding:"12px 10px 0"}}>
          {players.length>=1&&(
            <div style={{display:"flex",gap:8,alignItems:"flex-end",justifyContent:"center",marginBottom:14}}>
              {players[1]&&(()=>{const p=players[1];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.08)":"rgba(180,180,180,0.04)",border:`1px solid ${me?"rgba(168,85,247,0.35)":"rgba(180,180,180,0.15)"}`,borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>🥈</div>
                  <div style={{fontSize:18,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#ddd",fontWeight:700,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}</div>
                  <div style={{background:`${r.color}20`,border:`1px solid ${r.color}33`,borderRadius:4,padding:"1px 5px",fontSize:8,color:r.color,fontWeight:700,marginBottom:4,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.05)",borderRadius:1,marginBottom:4,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:r.color}}/></div>
                  <div style={{color:"#aaa",fontWeight:800,fontSize:11}}>👆{fmt(p.games_played||0)} taps</div>
                </div>);
              })()}
              {players[0]&&(()=>{const p=players[0];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.1)":"rgba(245,200,66,0.06)",border:`2px solid ${me?"rgba(168,85,247,0.5)":"rgba(245,200,66,0.3)"}`,borderRadius:16,padding:"14px 10px",textAlign:"center",boxShadow:"0 0 30px rgba(245,200,66,0.15)",marginBottom:10}}>
                  <div style={{fontSize:24,marginBottom:3}}>👑</div>
                  <div style={{fontSize:22,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}{me&&" ← You"}</div>
                  <div style={{background:`${r.color}22`,border:`1px solid ${r.color}44`,borderRadius:5,padding:"2px 7px",fontSize:9,color:r.color,fontWeight:800,marginBottom:6,display:"inline-block"}}>{r.emoji} Lv.{lv} {r.name}</div>
                  <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginBottom:5,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:`linear-gradient(90deg,${r.color}66,${r.color})`,borderRadius:2}}/></div>
                  <div style={{color:"#f5c842",fontWeight:900,fontSize:13}}>👆{fmt(p.games_played||0)} taps</div>
                </div>);
              })()}
              {players[2]&&(()=>{const p=players[2];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.08)":"rgba(205,127,50,0.04)",border:`1px solid ${me?"rgba(168,85,247,0.35)":"rgba(205,127,50,0.15)"}`,borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>🥉</div>
                  <div style={{fontSize:18,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#ddd",fontWeight:700,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}</div>
                  <div style={{background:`${r.color}20`,border:`1px solid ${r.color}33`,borderRadius:4,padding:"1px 5px",fontSize:8,color:r.color,fontWeight:700,marginBottom:4,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.05)",borderRadius:1,marginBottom:4,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:r.color}}/></div>
                  <div style={{color:"#cd7f32",fontWeight:800,fontSize:11}}>👆{fmt(p.games_played||0)} taps</div>
                </div>);
              })()}
            </div>
          )}
          {players.slice(3).map((p,i)=>{
            const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const me=p.wallet_address===myPlayerId;const isPrize=i+3<20;
            return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:i+3===19?"2px solid rgba(34,214,122,0.3)":"1px solid rgba(255,255,255,0.04)",background:me?"rgba(168,85,247,0.06)":isPrize?"rgba(34,214,122,0.015)":"transparent"}}>
              <div style={{color:isPrize?"#22d67a":"#333",fontWeight:900,fontSize:13,width:24,textAlign:"center"}}>#{i+4}</div>
              <div style={{fontSize:20}}>{CE[p.character]||"🎮"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:me?"#c084fc":"#ddd",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}{me&&" ← You"}{isPrize&&<span style={{marginLeft:5,fontSize:9,color:"#22d67a",fontWeight:800}}>💰PRIZE</span>}</div>
                <div style={{color:r.color,fontSize:9,fontWeight:700}}>{r.emoji} Lv.{lv} {r.name}</div>
              </div>
              <div style={{color:"#f5c842",fontWeight:800,fontSize:12}}>👆{fmt(p.games_played||0)}</div>
            </div>);
          })}
        </div>
      ):(
        <div style={{padding:"8px 10px"}}>
          {players.map((p,i)=>{
            const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const me=p.wallet_address===myPlayerId;const isPrize=i<20;
            return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderBottom:i===19?"2px solid rgba(34,214,122,0.3)":"1px solid rgba(255,255,255,0.04)",background:me?"rgba(168,85,247,0.06)":isPrize?"rgba(34,214,122,0.015)":"transparent",borderRadius:me?8:0}}>
              <div style={{color:i===0?"#f5c842":i===1?"#aaa":i===2?"#cd7f32":isPrize?"#22d67a":"#333",fontWeight:900,fontSize:12,width:22,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
              <div style={{fontSize:18}}>{CE[p.character]||"🎮"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:me?"#c084fc":"#ccc",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}{me&&" ← You"}{isPrize&&<span style={{marginLeft:4,fontSize:9,color:"#22d67a",fontWeight:800}}>💰</span>}</div>
                <div style={{color:r.color,fontSize:9}}>{r.emoji} Lv.{lv}</div>
              </div>
              <div style={{color:"#f5c842",fontWeight:800,fontSize:11}}>👆{fmt(p.games_played||0)}</div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ─── SHOP TAB (upgrades only) ─────────────────────────────────────────────────
const SHOP_CATEGORIES=[
  {id:"auto",   label:"🤖 Auto-Tappers", desc:"Earn taps automatically — counts on leaderboard"},
  {id:"tap",    label:"⚡ Tap Power",     desc:"More coins per manual tap"},
  {id:"crit",   label:"💥 Critical Hit",  desc:"Chance to massively multiply earnings"},
  {id:"energy", label:"🔋 Energy",        desc:"Bigger energy pool and faster regen"},
  {id:"combo",  label:"🔥 Combo",         desc:"Build and maintain combo multiplier"},
  {id:"special",label:"💫 Special",       desc:"Charge your special ability faster"},
  {id:"bonus",  label:"🎰 Bonus",         desc:"Global multipliers and lucky effects"},
];
function ShopTab({coins,charId,upgrades,onBuyUpgrade,playerLevel}:{
  coins:number;charId:string|null;upgrades:Record<string,number>;
  onBuyUpgrade:(id:string)=>void;playerLevel:number;
}){
  const [cat,setCat]=useState<string>("auto");
  const catItems=UPGRADES.filter(u=>u.category===cat);
  const RANK_NAMES:Record<number,string>={5:"Normie",8:"Bronze Ape",11:"Silver Degen",15:"Gold Degen",20:"Diamond Hands",25:"Sigma",30:"Tower Lord"};
  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#fff",paddingBottom:80}}>
      <div style={{background:"rgba(8,0,20,0.98)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"12px 14px 0",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <h2 style={{fontWeight:900,fontSize:16,margin:0}}>🛒 Shop</h2>
          <div style={{marginLeft:"auto",background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:800,color:"#f5c842"}}>💰 {fmt(coins)}</div>
        </div>
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:10,WebkitOverflowScrolling:"touch" as any}}>
          {SHOP_CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flex:"0 0 auto",background:cat===c.id?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${cat===c.id?"rgba(168,85,247,0.5)":"rgba(255,255,255,0.06)"}`,color:cat===c.id?"#c084fc":"#666",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{c.label}</button>
          ))}
        </div>
      </div>
      {!charId?(
        <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:44,marginBottom:10}}>🛒</div><div style={{color:"#443355",fontSize:14,fontWeight:700}}>Start a game first to access the shop</div></div>
      ):(
        <div style={{padding:10}}>
          <div style={{color:"#443355",fontSize:11,padding:"4px 4px 10px"}}>{SHOP_CATEGORIES.find(c=>c.id===cat)?.desc}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {catItems.map(u=>{
              const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv);
              const locked=(u.minLevel||0)>playerLevel;
              const can=!locked&&coins>=cost;
              const reqRank=u.minLevel?RANK_NAMES[u.minLevel]:"";
              return(
                <button key={u.id} onClick={()=>!locked&&onBuyUpgrade(u.id)} disabled={locked||!can}
                  style={{background:locked?"rgba(255,255,255,0.01)":can?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${locked?"rgba(255,0,0,0.1)":can?"rgba(245,200,66,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:"12px 10px",cursor:can?"pointer":"not-allowed",textAlign:"left",opacity:locked?0.4:can?1:0.6,transition:"all 0.15s",position:"relative"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                    <span style={{fontSize:20}}>{locked?"🔒":u.emoji}</span>
                    <span style={{fontWeight:800,fontSize:11,color:"#fff",flex:1,lineHeight:1.2}}>{u.name}</span>
                    {lv>0&&<span style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:4,padding:"1px 5px",fontSize:9,color:"#a855f7",fontWeight:700}}>Lv{lv}</span>}
                  </div>
                  {u.tapsPerSec&&<div style={{fontSize:9,color:"#22d67a",fontWeight:700,marginBottom:2}}>👆 +{u.tapsPerSec}/sec auto-taps</div>}
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>{u.desc}</div>
                  {locked?(
                    <div style={{color:"#ff4466",fontSize:10,fontWeight:700}}>🔒 Requires {reqRank} rank (Lv.{u.minLevel})</div>
                  ):(
                    <div style={{color:can?"#f5c842":"#444",fontWeight:800,fontSize:12}}>💰 {fmt(cost)}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUICK UPGRADE STRIP ──────────────────────────────────────────────────────
function QuickStrip({coins,upgrades,onBuyUpgrade}:{
  coins:number;upgrades:Record<string,number>;
  onBuyUpgrade:(id:string)=>void;
}){
  return(
    <div style={{width:"100%"}}>
      <div style={{color:"#333",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"5px 14px 3px"}}>⚡ Quick Upgrades</div>
      <div style={{overflowX:"auto",display:"flex",gap:7,padding:"4px 14px 10px",WebkitOverflowScrolling:"touch" as any}}>
        {UPGRADES.map(u=>{
          const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
          return(<button key={u.id} onClick={()=>onBuyUpgrade(u.id)} style={{flex:"0 0 80px",height:88,background:can?"rgba(245,200,66,0.04)":"rgba(255,255,255,0.015)",border:`1px solid ${can?"rgba(245,200,66,0.25)":"rgba(255,255,255,0.04)"}`,borderRadius:12,padding:"7px 5px",cursor:can?"pointer":"not-allowed",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",opacity:can?1:0.45,position:"relative"}}>
            {lv>0&&<div style={{position:"absolute",top:3,right:4,background:"rgba(168,85,247,0.7)",borderRadius:3,fontSize:8,fontWeight:900,color:"#fff",padding:"1px 3px"}}>Lv{lv}</div>}
            <div style={{fontSize:22}}>{u.emoji}</div>
            <div style={{color:"#bbb",fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{u.name}</div>
            <div style={{color:can?"#f5c842":"#444",fontSize:10,fontWeight:900}}>💰{fmt(cost)}</div>
          </button>);
        })}
      </div>
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────
export default function TapGame() {
  const {user,signOut}=useAuth();
  const [activeTab,setActiveTab]=useState<"home"|"play"|"shop"|"ranks"|"settings">("home");
  const [screen,setScreen]=useState<"select"|"game">("select");
  const [charId,setCharId]=useState<string|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [pendingChar,setPendingChar]=useState<string|null>(null);
  const [playerId,setPlayerId]=useState("");
  const [username,setUsername]=useState("");
  const [solWallet,setSolWallet]=useState("");
  const [avatar,setAvatar]=useState(()=>getAvatar()||"🐸");

  const [coins,setCoins]=useState(0);
  const [energy,setEnergy]=useState(1000);
  const [maxEnergy,setMaxEnergy]=useState(1000);
  const [combo,setCombo]=useState(1);
  const [comboTimer,setComboTimer]=useState(0);
  const [tapCount,setTapCount]=useState(0);
  const [totalTaps,setTotalTaps]=useState(0);
  const [totalEarned,setTotalEarned]=useState(0);
  const [specialCharge,setSpecialCharge]=useState(0);
  const [specialActive,setSpecialActive]=useState(false);
  const [specialTimer,setSpecialTimer]=useState(0);
  const [particles,setParticles]=useState<Particle[]>([]);
  const [charPulse,setCharPulse]=useState(false);
  const [shaking,setShaking]=useState(false);
  const [upgrades,setUpgrades]=useState<Record<string,number>>({});
  const [critFlash,setCritFlash]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [newAchiev,setNewAchiev]=useState<string|null>(null);
  const [achievSet,setAchievSet]=useState<Set<string>>(new Set());

  const pidRef=useRef(0);
  const saveRef=useRef<SaveData|null>(null);

  const char=CHARACTERS.find(c=>c.id===charId);
  const level=getLevelFromXP(totalEarned);
  const xpProgress=getLevelProgress(totalEarned);
  const rank=getRankFromLevel(level);
  const nextRank=getNextRank(level);
  const autoRate=UPGRADES.filter(u=>u.tapsPerSec).reduce((sum,u)=>{
    const lvl=upgrades[u.id]||0;
    return sum + lvl*(u.tapsPerSec!);
  },0);

  // Use Supabase auth user ID as the player ID — prevents all users sharing the same localStorage ID
  useEffect(()=>{
    if(!user?.id) return;
    const authId = user.id;
    setPlayerId(authId);
    // Load player profile from Supabase keyed by auth user ID
    import("@/lib/supabase").then(async ({supabase})=>{
      const {data} = await supabase.from("dt_players").select("username,sol_wallet,games_played,total_score,character").eq("wallet_address",authId).maybeSingle();
      if(data){
        if(data.username){ setUsername(data.username); setPlayerName(data.username); }
        if(data.sol_wallet){ setSolWallet(data.sol_wallet); setPlayerWallet(data.sol_wallet); }
      } else {
        // No record for this auth ID — check if there's an OLD localStorage-based record to migrate
        const oldLocalId = getPlayerId(); // old random localStorage ID
        const {data: oldData} = await supabase.from("dt_players").select("*").eq("wallet_address",oldLocalId).maybeSingle();
        if(oldData){
          // Migrate: update wallet_address to auth UUID so the record is now owned by this account
          await supabase.from("dt_players").update({wallet_address:authId}).eq("wallet_address",oldLocalId);
          if(oldData.username){ setUsername(oldData.username); setPlayerName(oldData.username); }
          if(oldData.sol_wallet){ setSolWallet(oldData.sol_wallet); setPlayerWallet(oldData.sol_wallet); }
        } else {
          // Brand new user — use email prefix as default username
          const defaultName = user.email?.split("@")[0] || "Degen_"+authId.slice(-6);
          setUsername(defaultName); setPlayerName(defaultName);
        }
      }
    });
  },[user?.id]);

  function tryStart(id:string){
    if(!getPlayerName()){setPendingChar(id);setShowModal(true);}
    else startGame(id,getPlayerName(),getPlayerWallet());
  }
  function onUsername(name:string,wallet:string){
    setPlayerName(name);setUsername(name);
    setPlayerWallet(wallet);setSolWallet(wallet);
    setShowModal(false);
    if(pendingChar)startGame(pendingChar,name,wallet);
  }

  function startGame(id:string,name:string,wallet?:string){
    const s=loadSave(id);
    setCharId(id);setCoins(s.coins);setTotalEarned(s.totalEarned);setTotalTaps(s.totalTaps);
    setUpgrades(s.upgrades);
    const mx=1000+(s.upgrades["energy_max"]||0)*200+(s.upgrades["energy_max2"]||0)*500+(s.upgrades["energy_max3"]||0)*1000;setMaxEnergy(mx);setEnergy(mx);
    setScreen("game");setActiveTab("play");saveRef.current=s;
    const w=wallet??getPlayerWallet();
    syncDB(user?.id||playerId,name,id,s.totalEarned,s.totalTaps,w||undefined);
  }

  const doSave=useCallback(()=>{
    if(!charId)return;
    const s:SaveData={charId:charId!,coins,totalEarned,totalTaps,upgrades,highScore:Math.max(coins,saveRef.current?.highScore||0)};
    persistSave(s);saveRef.current=s;
    syncDB(user?.id||playerId,username||getPlayerName(),charId!,totalEarned,totalTaps,solWallet||getPlayerWallet()||undefined);
  },[charId,coins,totalEarned,totalTaps,upgrades,playerId,username,solWallet]);

  useEffect(()=>{ if(screen!=="game"||!charId)return; const id=setInterval(doSave,8000); return()=>clearInterval(id); },[screen,charId,doSave]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const rate=autoRate*(specialActive&&char.id==="trump"?5:1);
    if(rate<=0)return;
    const id=setInterval(()=>{const pt=rate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt);setTotalTaps(t=>t+pt);},50);
    return()=>clearInterval(id);
  },[autoRate,activeTab,screen,char,specialActive]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const regenBonus=(upgrades["energy_reg"]||0)*0.5+(upgrades["energy_reg2"]||0)*1+(upgrades["energy_reg3"]||0)*2;
    const r=(char.energyRegen+regenBonus)*(specialActive&&char.id==="bonk"?999:1);
    const id=setInterval(()=>setEnergy(e=>Math.min(maxEnergy,e+r*0.05)),50);
    return()=>clearInterval(id);
  },[activeTab,screen,char,maxEnergy,specialActive,upgrades]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game")return;
    const id=setInterval(()=>setComboTimer(t=>{ if(t<=0){setCombo(1);return 0;} return t-0.05; }),50);
    return()=>clearInterval(id);
  },[activeTab,screen]);

  useEffect(()=>{
    if(!specialActive)return;
    const id=setInterval(()=>setSpecialTimer(t=>{ if(t<=0){setSpecialActive(false);return 0;} return t-0.1; }),100);
    return()=>clearInterval(id);
  },[specialActive]);

  const showToast=(msg:string)=>{ setToast(msg); setTimeout(()=>setToast(null),1800); };

  const checkAchievements=useCallback((taps:number,earned:number)=>{
    const checks=[
      {id:"first_tap",text:"First Tap! 👆",cond:taps>=1},
      {id:"taps_100",text:"100 Taps! 💯",cond:taps>=100},
      {id:"taps_1000",text:"1,000 Taps! 🔥",cond:taps>=1000},
      {id:"coins_1k",text:"1K Coins! 💰",cond:earned>=1000},
      {id:"coins_10k",text:"10K Earned! 🤑",cond:earned>=10000},
      {id:"coins_1m",text:"MILLIONAIRE! 💎",cond:earned>=1e6},
    ];
    checks.forEach(c=>{ if(c.cond&&!achievSet.has(c.id)){ setAchievSet(a=>new Set([...a,c.id])); setNewAchiev(c.text); setTimeout(()=>setNewAchiev(null),3000); } });
  },[achievSet]);

  const spawn=useCallback((x:number,y:number,v:string,color:string,big:boolean)=>{
    const id=pidRef.current++;
    setParticles(p=>[...p.slice(-30),{id,x,y,value:v,color,big}]);
    setTimeout(()=>setParticles(p=>p.filter(pp=>pp.id!==id)),1100);
  },[]);

  const handleTap=useCallback((e:React.MouseEvent|React.TouchEvent)=>{
    if(!char)return;
    e.preventDefault();
    let tx=window.innerWidth/2,ty=window.innerHeight/2;
    if("touches" in e&&e.touches.length>0){tx=e.touches[0].clientX;ty=e.touches[0].clientY;}
    else if("clientX" in e){tx=(e as React.MouseEvent).clientX;ty=(e as React.MouseEvent).clientY;}
    if(energy<=0)return;

    const tapPow=(upgrades["tap_power"]||0)*1+(upgrades["tap_pow2"]||0)*3+(upgrades["tap_pow3"]||0)*8+(upgrades["tap_pow4"]||0)*20+(upgrades["tap_pow5"]||0)*60+(upgrades["tap_pow6"]||0)*200;
    const multiTap=1+(upgrades["multi_tap"]||0)*1+(upgrades["multi_tap2"]||0)*0.5+(upgrades["multi_tap3"]||0)*1+(upgrades["multi_tap4"]||0)*2;
    const critChance=Math.min(0.9,((upgrades["crit_chance"]||0)+(upgrades["crit_chan2"]||0)+(upgrades["crit_chan3"]||0))*0.1);
    const critMult=(upgrades["crit_pow2"]?15:upgrades["crit_pow"]?8:5);
    const coinAura=1+((upgrades["coin_aura"]||0)*0.5);
    const tapBase=(char.baseCoins+tapPow)*multiTap*coinAura;
    const specMult=specialActive?char.specialMultiplier:1;
    const isCrit=Math.random()<critChance;
    let earned=tapBase*combo*specMult*(isCrit?critMult:1);
    earned=char.passive(earned);
    const newTapCount=tapCount+1;setTapCount(newTapCount);

    if(char.id==="trump"&&newTapCount%50===0){earned*=10;spawn(tx,ty,"💼 DEAL! 10×","#f5c842",true);}
    if(specialActive&&char.id==="troll")earned*=(1+Math.random()*14);
    earned=Math.max(0.1,earned);

    if(isCrit){setCritFlash(true);setTimeout(()=>setCritFlash(false),120);spawn(tx,ty,"CRIT! ⚡","#ff3344",true);}
    const coinColors=(a:number)=>a>=100?"#ff3344":a>=50?"#f5c842":a>=10?"#22d67a":a>=3?"#a855f7":"#aaa";
    spawn(tx,ty,`+${fmt(Math.round(earned*10)/10)}`,coinColors(earned),false);

    setCoins(c=>c+earned);
    setTotalEarned(t=>{const nt=t+earned;checkAchievements(newTapCount,nt);return nt;});
    setTotalTaps(t=>t+1);

    const ec=specialActive&&char.id==="bonk"?0:1;
    setEnergy(e=>Math.max(0,e-ec));

    const cspeed=1+(upgrades["combo_speed"]||0)*0.2+(upgrades["combo_spd2"]||0)*0.5+(upgrades["combo_spd3"]||0)*1;
    const gcBonus=char.id==="gigachad"?2:1;
    const maxCombo=char.comboMax+(upgrades["combo_max"]||0)*5+(upgrades["combo_max2"]||0)*15+(upgrades["combo_max3"]||0)*30;
    setCombo(c=>Math.min(maxCombo,c+0.3*cspeed*gcBonus));
    setComboTimer(0.8);
    const spCharge=2+(upgrades["special_cd"]||0)*1+(upgrades["special_cd2"]||0)*2+(upgrades["special_cd3"]||0)*4;
    setSpecialCharge(s=>Math.min(100,s+spCharge));
    setCharPulse(true);setTimeout(()=>setCharPulse(false),90);
    if(earned>tapBase*5){setShaking(true);setTimeout(()=>setShaking(false),180);}
  },[char,energy,combo,tapCount,upgrades,specialActive,checkAchievements,spawn]);

  const launchSpecial=useCallback(()=>{
    if(!char||specialCharge<100||specialActive)return;
    setSpecialActive(true);setSpecialCharge(0);setSpecialTimer(char.specialDuration);
    if(char.id==="gigachad")setCombo(char.comboMax);
    for(let i=0;i<12;i++)setTimeout(()=>spawn(window.innerWidth/2+(Math.random()-0.5)*260,window.innerHeight/2+(Math.random()-0.5)*220,["💥","⚡","🔥","✨","💫","🚀","💎","🌙","🎯","👑"][Math.floor(Math.random()*10)],char.color,true),i*55);
  },[char,specialCharge,specialActive,spawn]);

  const buyUpgrade=useCallback((id:string)=>{
    const u=UPGRADES.find(u=>u.id===id)!;
    const lv=upgrades[id]||0,cost=getUpgCost(u,lv);
    if(coins<cost)return;
    setCoins(c=>c-cost);
    setUpgrades(u=>({...u,[id]:(u[id]||0)+1}));
    if(id==="energy_max"||id==="energy_max2"||id==="energy_max3"){
      const nu={...upgrades,[id]:(upgrades[id]||0)+1};
      setMaxEnergy(1000+(nu["energy_max"]||0)*200+(nu["energy_max2"]||0)*500+(nu["energy_max3"]||0)*1000);
    }
    showToast(`${u.emoji} ${u.name} Lv.${lv+1}!`);
  },[coins,upgrades]);

  // suppress unused warning from comboTimer
  void comboTimer;

  function handleSettingsSave(u:string,w:string,av:string){
    setUsername(u); setPlayerName(u);
    setSolWallet(w); setPlayerWallet(w);
    setAvatar(av); setAvatarStore(av);
    syncDB(user?.id||playerId,u,charId||"pepe",totalEarned,totalTaps,w||undefined);
  }

  return(
    <div style={{background:"#080010",minHeight:"100vh",position:"relative"}}>
      <TopBar username={username} avatar={avatar} onSettings={()=>setActiveTab("settings")} onLogout={signOut}/>

      {showModal&&<UsernameModal onConfirm={onUsername}/>}

      {newAchiev&&(
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:300,background:"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:14,padding:"9px 18px",color:"#fff",fontWeight:900,fontSize:13,boxShadow:"0 0 40px rgba(168,85,247,0.6)",whiteSpace:"nowrap",animation:"slideDown 0.3s ease-out"}}>
          🏅 {newAchiev}
        </div>
      )}
      {toast&&(
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:299,background:"rgba(34,214,122,0.15)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:14,padding:"7px 16px",color:"#22d67a",fontWeight:800,fontSize:12,whiteSpace:"nowrap",animation:"slideDown 0.2s ease-out"}}>
          {toast}
        </div>
      )}
      {critFlash&&<div style={{position:"fixed",inset:0,background:"rgba(255,40,40,0.07)",zIndex:150,pointerEvents:"none"}}/>}

      {activeTab==="home"&&<HomeTab onPlay={()=>setActiveTab("play")} username={username} avatar={avatar} totalEarned={totalEarned} totalTaps={totalTaps} level={level} rank={rank} xpProgress={xpProgress} nextRank={nextRank} charId={charId}/>}
      {activeTab==="ranks"&&<LeaderboardTab myPlayerId={playerId}/>}
      {activeTab==="shop"&&<ShopTab coins={coins} charId={charId} upgrades={upgrades} onBuyUpgrade={buyUpgrade} playerLevel={level}/>}
      {activeTab==="settings"&&<SettingsTab username={username} solWallet={solWallet} onSave={handleSettingsSave}/>}

      {activeTab==="play"&&(
        <>
          {screen==="select"&&(
            <div style={{minHeight:"100vh",background:"#080010",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"24px 16px 100px",position:"relative",overflowY:"auto"}}>
              <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 35%,rgba(120,40,200,0.22) 0%,transparent 65%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1,textAlign:"center",marginBottom:24}}>
                <img src="/logo.png" alt="Degen Clicker" onError={e=>{(e.target as HTMLImageElement).style.display="none";}} style={{width:110,height:110,objectFit:"contain",marginBottom:4,filter:"drop-shadow(0 0 28px rgba(168,85,247,0.6))"}}/>
                <p style={{color:"#6644aa",fontSize:13,margin:0}}>Choose your legend</p>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:440,position:"relative",zIndex:1}}>
                {CHARACTERS.map(c=>{
                  const s=loadSave(c.id);
                  return(<button key={c.id} onClick={()=>tryStart(c.id)} style={{width:120,background:`rgba(${c.glow},0.04)`,border:`2px solid rgba(${c.glow},0.22)`,borderRadius:18,cursor:"pointer",padding:"16px 8px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:7,transition:"all 0.2s"}}
                    onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor=`rgb(${c.glow})`;el.style.background=`rgba(${c.glow},0.12)`;el.style.transform="translateY(-4px)";el.style.boxShadow=`0 12px 36px rgba(${c.glow},0.35)`;}}
                    onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.22)`;el.style.background=`rgba(${c.glow},0.04)`;el.style.transform="";el.style.boxShadow="";}}>
                    <div style={{fontSize:46}}>{c.emoji}</div>
                    <div style={{color:"#fff",fontWeight:800,fontSize:13}}>{c.name}</div>
                    <div style={{background:`rgba(${c.glow},0.15)`,border:`1px solid rgba(${c.glow},0.35)`,borderRadius:5,padding:"2px 7px",fontSize:9,color:`rgb(${c.glow})`,fontWeight:700,textAlign:"center"}}>{c.ability}</div>
                    <div style={{fontSize:9,color:"#333",lineHeight:1.4,textAlign:"center"}}>{c.abilityDesc}</div>
                    {s.totalEarned>0&&<div style={{fontSize:9,color:"#4a3a5a"}}>💰 {fmt(s.totalEarned)}</div>}
                  </button>);
                })}
              </div>
            </div>
          )}

          {screen==="game"&&char&&(
            <div style={{minHeight:"100vh",background:"#080010",display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:80,position:"relative",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none"}} className={shaking?"shake":""}>
              <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse at 50% 45%,rgba(${char.glow},${specialActive?0.28:0.12}) 0%,transparent 60%)`,transition:"background 0.5s"}}/>

              {/* Top bar */}
              <div style={{width:"100%",maxWidth:440,padding:"10px 14px 4px",zIndex:10,position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                  <button onClick={()=>setScreen("select")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"#555",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12}}>⬅</button>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#f5c842"}}>💰 {fmt(coins)}</div>
                    <div style={{fontSize:8,color:"#333",textTransform:"uppercase",letterSpacing:"0.08em"}}>$TOWER</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:rank.color,fontWeight:800,fontSize:11}}>{rank.emoji} {rank.name}</div>
                    <div style={{color:"#333",fontSize:9}}>Level {level}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:8,color:"#333",fontWeight:700}}>Lv.{level}</span>
                  <div style={{flex:1,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}66,${rank.color})`,borderRadius:2,transition:"width 0.4s"}}/>
                  </div>
                  <span style={{fontSize:8,color:"#333"}}>
                    {fmt(xpProgress.current)}/{fmt(xpProgress.needed)}
                    {nextRank&&<span style={{color:nextRank.color,marginLeft:3}}>→{nextRank.emoji}</span>}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{width:"100%",maxWidth:440,padding:"0 14px 5px",display:"flex",gap:5,zIndex:10,position:"relative"}}>
                {[
                  {label:"Total",value:`💰${fmt(totalEarned)}`,color:"#ccc"},
                  {label:"Taps",value:`👆${fmt(totalTaps)}`,color:"#ccc"},
                  ...(autoRate>0?[{label:"Auto",value:`🤖${autoRate}/s`,color:"#22d67a"}]:[]),
                  ...(combo>1.5?[{label:"Combo",value:`×${(Math.floor(combo*10)/10).toFixed(1)}`,color:`rgb(${char.glow})`}]:[]),
                ].map(s=>(
                  <div key={s.label} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:8,padding:"4px 6px",textAlign:"center"}}>
                    <div style={{color:"#333",fontSize:7,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
                    <div style={{color:s.color,fontWeight:800,fontSize:10}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {specialActive&&(
                <div style={{position:"relative",zIndex:10,background:`linear-gradient(135deg,rgba(${char.glow},0.8),rgba(${char.glow},0.5))`,borderRadius:20,padding:"3px 18px",marginBottom:4,fontSize:11,fontWeight:900,color:"#fff",boxShadow:`0 0 24px rgba(${char.glow},0.7)`,animation:"pulseBanner 0.4s infinite"}}>
                  ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
                </div>
              )}

              {/* Character */}
              <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:260,height:260,margin:"0 auto 8px"}}>
                <ModelStage char={char} specialActive={specialActive} charPulse={charPulse} onTap={handleTap} firstPlay={totalTaps<3}/>
              </div>

              {/* Energy bar */}
              <div style={{width:"100%",maxWidth:300,padding:"0 0 4px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:8,color:"#333",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>⚡ Energy</span>
                  <span style={{fontSize:8,color:"#333"}}>{Math.floor(energy)}/{maxEnergy}</span>
                </div>
                <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,width:`${(energy/maxEnergy)*100}%`,background:(energy/maxEnergy)>0.5?`linear-gradient(90deg,rgba(${char.glow},0.7),rgb(${char.glow}))`:energy/maxEnergy>0.2?"linear-gradient(90deg,#ffaa00,#ffcc44)":"linear-gradient(90deg,#ff3355,#ff6677)",transition:"width 0.1s"}}/>
                </div>
              </div>

              {/* Special charge */}
              <div style={{width:"100%",maxWidth:300,padding:"0 0 5px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:8,color:"#333",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>✨ {char.specialName}</span>
                  <span style={{fontSize:8,color:specialCharge>=100?`rgb(${char.glow})`:"#333"}}>{Math.floor(specialCharge)}%</span>
                </div>
                <div onClick={launchSpecial} style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden",cursor:specialCharge>=100&&!specialActive?"pointer":"default",border:specialCharge>=100&&!specialActive?`1px solid rgba(${char.glow},0.5)`:"1px solid transparent"}}>
                  <div style={{height:"100%",borderRadius:3,width:`${specialCharge}%`,background:`linear-gradient(90deg,rgba(${char.glow},0.6),rgb(${char.glow}))`,transition:"width 0.15s"}}/>
                </div>
                {specialCharge>=100&&!specialActive&&(
                  <button onClick={launchSpecial} style={{width:"100%",marginTop:5,padding:"8px",background:`linear-gradient(135deg,rgba(${char.glow},0.7),rgb(${char.glow}))`,border:"none",borderRadius:9,color:"#fff",fontWeight:900,fontSize:12,cursor:"pointer",boxShadow:`0 0 20px rgba(${char.glow},0.6)`,animation:"pulseBanner 0.5s infinite"}}>
                    ✨ {char.specialName.toUpperCase()} — ACTIVATE!
                  </button>
                )}
              </div>

              {/* Quick upgrades */}
              <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:10}}>
                <QuickStrip coins={coins} upgrades={upgrades} onBuyUpgrade={buyUpgrade}/>
              </div>

              {/* Particles */}
              <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:50}}>
                {particles.map(p=>(
                  <div key={p.id} style={{position:"absolute",left:p.x,top:p.y,color:p.color,fontWeight:900,fontSize:p.big?17:12,textShadow:`0 0 8px ${p.color}`,pointerEvents:"none",animation:"floatUp 1.1s ease-out forwards",whiteSpace:"nowrap",transform:"translate(-50%,-50%)"}}>
                    {p.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BottomBar active={activeTab} onTab={t=>setActiveTab(t as any)}/>

      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,calc(-50% - 100px)) scale(0.6)} }
        @keyframes slideDown { 0%{opacity:0;transform:translateX(-50%) translateY(-12px)} 100%{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulseBanner { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes floatHint { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-5px)} }
        @keyframes orbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbit2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .shake { animation: shakeFx 0.2s ease-out; }
        @keyframes shakeFx { 0%,100%{transform:translate(0)} 25%{transform:translate(-3px,2px)} 50%{transform:translate(3px,-2px)} 75%{transform:translate(-2px,3px)} }
        * { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { height:3px; width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.3); border-radius:2px; }
      `}</style>
    </div>
  );
}
