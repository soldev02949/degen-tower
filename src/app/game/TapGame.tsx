"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getLevelFromXP, getLevelProgress, getRankFromLevel, getNextRank, RANKS } from "@/lib/progression";

// ─── Characters ──────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:"pepe",     name:"Pepe",      emoji:"🐸", image:"/characters/pepe.png",     color:"#4caf50", glow:"76,175,80",   baseCoins:1, ability:"Lucky Tap",   abilityDesc:"15% chance to triple coins",       specialName:"Comfy Mode",   specialDesc:"2× all earnings for 30s", specialDuration:30, passive:(c:number)=>Math.random()<0.15?c*3:c, specialMultiplier:2, energyRegen:1,   comboMax:10 },
  { id:"gigachad", name:"Gigachad",  emoji:"💪", image:"/characters/gigachad.png", color:"#e0b87a", glow:"224,184,122", baseCoins:1, ability:"Sigma Grind", abilityDesc:"Combo builds 2× faster, 20× max",  specialName:"Max Mode",     specialDesc:"20× combo instantly for 20s", specialDuration:20, passive:(c:number)=>c, specialMultiplier:5, energyRegen:1,   comboMax:20 },
  { id:"trump",    name:"Trump",     emoji:"🎩", image:"/characters/trump.png",    color:"#3b82f6", glow:"59,130,246",  baseCoins:2, ability:"Deal Maker",  abilityDesc:"Every 50 taps = 10× burst",        specialName:"MAGA Mode",    specialDesc:"Helpers 5× + tap 3× for 40s", specialDuration:40, passive:(c:number)=>c, specialMultiplier:3, energyRegen:0.8, comboMax:12 },
  { id:"troll",    name:"Trollface", emoji:"🧌", image:"/characters/troll.png",    color:"#a855f7", glow:"168,85,247",  baseCoins:1, ability:"Chaos Agent", abilityDesc:"Random 0.5–8× per tap",            specialName:"CHAOS MODE",   specialDesc:"10s of 1–15× random", specialDuration:10, passive:(c:number)=>c*(0.5+Math.random()*7.5), specialMultiplier:1, energyRegen:1.2, comboMax:10 },
  { id:"bonk",     name:"Bonk",      emoji:"🐕", image:"/characters/bonk.png",     color:"#e8853a", glow:"232,133,58",  baseCoins:1, ability:"BONK Speed",  abilityDesc:"3× energy regen",                  specialName:"BONK Frenzy",  specialDesc:"Infinite energy + 3× for 15s", specialDuration:15, passive:(c:number)=>c, specialMultiplier:3, energyRegen:3,   comboMax:10 },
];

// ─── Upgrades ─────────────────────────────────────────────────────────────────
const UPGRADES = [
  { id:"tap_power",    name:"Tap Power",       emoji:"⚡", desc:"+1 coin per tap",            baseCost:50,    costMult:1.8  },
  { id:"energy_max",  name:"Energy Tank",      emoji:"🔋", desc:"+200 max energy",             baseCost:100,   costMult:2.0  },
  { id:"combo_speed", name:"Combo Rush",       emoji:"🔥", desc:"Combo builds faster",         baseCost:80,    costMult:1.9  },
  { id:"multi_tap",   name:"Multi Tap",        emoji:"👆", desc:"Each tap counts as 2",        baseCost:400,   costMult:2.5  },
  { id:"crit_chance", name:"Critical Hit",     emoji:"💥", desc:"+10% crit tap (5× coins)",    baseCost:300,   costMult:2.2  },
  { id:"helper_1",    name:"FUD Bear",         emoji:"🐻", desc:"+1 auto-tap/sec",             baseCost:200,   costMult:2.5  },
  { id:"helper_2",    name:"Bot Army",         emoji:"🤖", desc:"+3 auto-taps/sec",            baseCost:800,   costMult:3.0  },
  { id:"helper_3",    name:"Whale Wallet",     emoji:"🐋", desc:"+10 auto-taps/sec",           baseCost:3000,  costMult:3.5  },
  { id:"helper_4",    name:"Hedge Fund",       emoji:"🏦", desc:"+30 auto-taps/sec",           baseCost:15000, costMult:4.0  },
  { id:"special_cd",  name:"Cooldown Reduce",  emoji:"⏩", desc:"Charge special 50% faster",   baseCost:300,   costMult:2.2  },
  { id:"lucky_strike",name:"Lucky Strike",     emoji:"🎰", desc:"+5% lucky tap chance",        baseCost:500,   costMult:2.8  },
  { id:"combo_max",   name:"Combo King",       emoji:"👑", desc:"+5 max combo",                baseCost:600,   costMult:2.6  },
];

// ─── Cosmetics ────────────────────────────────────────────────────────────────
// Positions are % of the 240×240 character circle container.
// Characters are square images (1920×1920) displayed object-fit:cover in the circle.
// Face occupies roughly top 5–30% of the image.
// Hat: sits on top of head ~5-8% from top, centered (~47% left)
// Glasses: eye level ~19-22% from top, centered
// Mouth/cigar: ~29-33% from top, slightly right
// Neck/chain: ~37-44% from top, centered
// Hand: side of body ~55-65%
export const COSMETICS = [
  // ── Hats ──────────────────────────────────────────────────────────────────
  { id:"top_hat",   name:"Top Hat",        emoji:"🎩", slot:"hat",     cost:500,  rarity:"rare",      top:"3%",  left:"50%", transform:"translateX(-50%)", size:30 },
  { id:"crown",     name:"Crown",          emoji:"👑", slot:"hat",     cost:2000, rarity:"epic",      top:"1%",  left:"50%", transform:"translateX(-50%)", size:28 },
  { id:"cowboy",    name:"Cowboy Hat",     emoji:"🤠", slot:"hat",     cost:800,  rarity:"rare",      top:"3%",  left:"50%", transform:"translateX(-50%)", size:32 },
  { id:"santa",     name:"Santa Hat",      emoji:"🎅", slot:"hat",     cost:350,  rarity:"common",    top:"2%",  left:"50%", transform:"translateX(-50%)", size:28 },
  { id:"party_hat", name:"Party Hat",      emoji:"🎉", slot:"hat",     cost:250,  rarity:"common",    top:"3%",  left:"50%", transform:"translateX(-50%)", size:26 },
  // ── Glasses ───────────────────────────────────────────────────────────────
  { id:"shades",    name:"Chad Shades",    emoji:"😎", slot:"glasses", cost:300,  rarity:"common",    top:"20%", left:"50%", transform:"translateX(-50%)", size:28 },
  { id:"monocle",   name:"Monocle",        emoji:"🧐", slot:"glasses", cost:600,  rarity:"rare",      top:"20%", left:"54%", transform:"translateX(-50%)", size:22 },
  { id:"vr",        name:"VR Headset",     emoji:"🥽", slot:"glasses", cost:1200, rarity:"epic",      top:"19%", left:"50%", transform:"translateX(-50%)", size:30 },
  { id:"nerd",      name:"Nerd Glasses",   emoji:"🤓", slot:"glasses", cost:400,  rarity:"common",    top:"20%", left:"50%", transform:"translateX(-50%)", size:28 },
  // ── Mouth ─────────────────────────────────────────────────────────────────
  { id:"cigar",     name:"Degen Cigar",    emoji:"🚬", slot:"mouth",   cost:400,  rarity:"common",    top:"29%", left:"57%", transform:"translateX(-50%)", size:18 },
  // ── Neck / chain ──────────────────────────────────────────────────────────
  { id:"chain",     name:"Diamond Chain",  emoji:"📿", slot:"neck",    cost:1000, rarity:"epic",      top:"37%", left:"50%", transform:"translateX(-50%)", size:26 },
  { id:"watch",     name:"Gold Watch",     emoji:"⌚", slot:"neck",    cost:800,  rarity:"rare",      top:"55%", left:"68%", transform:"translateX(-50%)", size:20 },
  // ── Hand-held ─────────────────────────────────────────────────────────────
  { id:"bag",       name:"Money Bag",      emoji:"💰", slot:"hand",    cost:600,  rarity:"rare",      top:"58%", left:"14%", transform:"none",             size:24 },
  { id:"diamond",   name:"Diamond Ring",   emoji:"💍", slot:"hand",    cost:2500, rarity:"legendary", top:"62%", left:"72%", transform:"none",             size:18 },
  { id:"sword",     name:"Based Sword",    emoji:"⚔️",  slot:"hand",    cost:1800, rarity:"epic",      top:"50%", left:"8%",  transform:"none",             size:28 },
];

const RARITY_COLOR:Record<string,string> = { common:"#6b6b8a", rare:"#3b82f6", epic:"#a855f7", legendary:"#f5c842" };
const SLOT_LIMIT:Record<string,1> = { hat:1, glasses:1, mouth:1, neck:1, hand:1 };

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(n:number){ if(n>=1e9)return(n/1e9).toFixed(2)+"B"; if(n>=1e6)return(n/1e6).toFixed(2)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.floor(n).toString(); }
function getUpgCost(u:typeof UPGRADES[0], lv:number){ return Math.floor(u.baseCost*Math.pow(u.costMult,lv)); }
function getPlayerId(){ try{ let id=localStorage.getItem("degen_player_id"); if(!id){ id="p_"+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem("degen_player_id",id); } return id; }catch{ return "anon_"+Math.random().toString(36).slice(2,8); } }
function getPlayerName(){ try{ return localStorage.getItem("degen_username")||""; }catch{ return ""; } }
function setPlayerName(n:string){ try{ localStorage.setItem("degen_username",n); }catch{} }
function getPlayerWallet(){ try{ return localStorage.getItem("degen_sol_wallet")||""; }catch{ return ""; } }
function setPlayerWallet(w:string){ try{ localStorage.setItem("degen_sol_wallet",w); }catch{} }

interface SaveData { charId:string; coins:number; totalEarned:number; totalTaps:number; upgrades:Record<string,number>; highScore:number; ownedCosmetics:string[]; equippedCosmetics:Record<string,string>; }

function loadSave(charId:string):SaveData{
  try{ const r=localStorage.getItem(`degen_save_${charId}`); if(r)return JSON.parse(r); }catch{}
  return { charId, coins:0, totalEarned:0, totalTaps:0, upgrades:{}, highScore:0, ownedCosmetics:[], equippedCosmetics:{} };
}
function persistSave(d:SaveData){ try{ localStorage.setItem(`degen_save_${d.charId}`,JSON.stringify(d)); }catch{} }

async function syncDB(pid:string,uname:string,charId:string,totalEarned:number,totalTaps:number,equipped:Record<string,string>,owned:string[],solWallet?:string){
  try{
    const{supabase}=await import("@/lib/supabase");
    await supabase.from("dt_players").upsert({
      wallet_address:pid, username:uname||("Degen_"+pid.slice(-6)), character:charId,
      total_score:Math.floor(totalEarned), games_played:Math.floor(totalTaps),
      is_verified:false, equipped_cosmetics:equipped, owned_cosmetics:owned,
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

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
const TABS=[{id:"home",label:"Home",emoji:"🏠"},{id:"play",label:"Play",emoji:"🎮"},{id:"shop",label:"Shop",emoji:"⚡"},{id:"ranks",label:"Ranks",emoji:"🏆"}];

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

        {/* Name */}
        <div style={{marginBottom:10,textAlign:"left"}}>
          <label style={{color:"#6644aa",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5}}>Name</label>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,18))} onKeyDown={e=>e.key==="Enter"&&validate()} placeholder={sug} autoFocus
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:10,color:"#fff",fontSize:15,padding:"11px 14px",outline:"none",boxSizing:"border-box"}}/>
          <div style={{color:"#332244",fontSize:10,marginTop:3}}>Leave blank → {sug}</div>
        </div>

        {/* Wallet */}
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

// ─── Character Stage with real PNG images + cosmetic overlays ─────────────────
function ModelStage({ char, equippedCosmetics, specialActive, charPulse, onTap, firstPlay }:{
  char:typeof CHARACTERS[0]; equippedCosmetics:Record<string,string>; specialActive:boolean; charPulse:boolean; onTap:(e:React.MouseEvent|React.TouchEvent)=>void; firstPlay:boolean;
}){
  const equippedItems = Object.values(equippedCosmetics)
    .map(id => COSMETICS.find(c => c.id === id))
    .filter(Boolean) as typeof COSMETICS[0][];

  const SIZE = 240;

  return (
    <div style={{position:"relative", width:SIZE, height:SIZE, margin:"0 auto", flexShrink:0}}>
      {/* Outer glow ring */}
      <div style={{
        position:"absolute", inset:-12, borderRadius:"50%",
        background:`radial-gradient(ellipse at 50% 80%, rgba(${char.glow},${specialActive?0.45:0.18}) 0%, transparent 65%)`,
        pointerEvents:"none", transition:"background 0.5s",
      }}/>
      {/* Orbit rings when special active */}
      {specialActive && <>
        <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.5)`,animation:"orbit1 3s linear infinite",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:-16,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.25)`,animation:"orbit2 6s linear infinite reverse",pointerEvents:"none"}}/>
      </>}

      {/* Circle clip + character image */}
      <div
        onMouseDown={onTap} onTouchStart={onTap}
        style={{
          position:"absolute", inset:0,
          borderRadius:"50%", overflow:"hidden",
          cursor:"pointer", userSelect:"none", WebkitUserSelect:"none",
          border:specialActive?`2px solid rgba(${char.glow},0.9)`:`2px solid rgba(${char.glow},0.3)`,
          boxShadow:specialActive
            ?`0 0 50px rgba(${char.glow},0.7), 0 0 100px rgba(${char.glow},0.3), inset 0 0 30px rgba(${char.glow},0.1)`
            :`0 0 20px rgba(${char.glow},0.25)`,
          transition:"box-shadow 0.4s, border 0.4s, transform 0.1s",
          transform:charPulse?"scale(0.94)":"scale(1)",
          background:`radial-gradient(ellipse at 50% 30%, rgba(${char.glow},0.08) 0%, #0a0016 100%)`,
        }}
      >
        <img
          src={char.image}
          alt={char.name}
          draggable={false}
          style={{
            width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center top",
            display:"block", pointerEvents:"none",
            filter:specialActive?`brightness(1.15) saturate(1.3) drop-shadow(0 0 12px rgba(${char.glow},0.5))`:"none",
            transition:"filter 0.4s",
          }}
          onError={e=>{
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            if(el.parentElement) el.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:100px">${char.emoji}</div>`;
          }}
        />
      </div>

      {/* Cosmetic overlays — positioned relative to the 240×240 container */}
      {equippedItems.map(cos => (
        <div key={cos.id} style={{
          position:"absolute",
          top: cos.top,
          left: cos.left,
          transform: cos.transform,
          fontSize: cos.size,
          lineHeight: 1,
          pointerEvents: "none",
          zIndex: 20,
          filter: "drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 6px rgba(0,0,0,0.9))",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}>
          {cos.emoji}
        </div>
      ))}

      {/* First-play hint */}
      {firstPlay && (
        <div style={{
          position:"absolute", bottom:-26, left:"50%", transform:"translateX(-50%)",
          fontSize:11, color:"#6644aa", fontWeight:600, whiteSpace:"nowrap",
          animation:"floatHint 1.5s ease-in-out infinite",
        }}>
          TAP TO EARN 👆
        </div>
      )}
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({onPlay}:{onPlay:()=>void}){
  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#e8e8f0",paddingBottom:80,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% -5%,rgba(120,40,200,0.35) 0%,transparent 55%)",pointerEvents:"none",zIndex:0}}/>
      {/* Hero */}
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"28px 20px 16px"}}>
        <img src="/logo.png" alt="Degen Clicker" onError={e=>{(e.target as HTMLImageElement).style.display="none";}} style={{width:150,height:150,objectFit:"contain",marginBottom:4,filter:"drop-shadow(0 0 40px rgba(168,85,247,0.6))"}}/>
        <h1 style={{color:"#fff",fontWeight:900,fontSize:26,marginBottom:6,letterSpacing:"-0.02em",lineHeight:1.1}}>Degen Clicker</h1>
        <p style={{color:"#7755aa",fontSize:14,marginBottom:20,lineHeight:1.6}}>Pick your legend · Tap to earn · Win USDC</p>
        <button onClick={onPlay} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",fontWeight:900,fontSize:17,border:"none",borderRadius:18,padding:"16px 48px",cursor:"pointer",boxShadow:"0 0 50px rgba(168,85,247,0.5),0 0 100px rgba(168,85,247,0.15)",letterSpacing:"-0.01em"}}>
          🎮 Play Free
        </button>
        {/* Stats row */}
        <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:20,flexWrap:"wrap"}}>
          {[["💰","Tap to Earn","$TOWER coins"],["⏱","48hr","Reset cycle"],["🏆","USDC","Top players win"],["👕","Drip","Dress your character"]].map(([e,v,l])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:18}}>{e}</div><div style={{color:"#fff",fontWeight:900,fontSize:14}}>{v}</div><div style={{color:"#444",fontSize:10}}>{l}</div></div>
          ))}
        </div>
      </div>
      {/* Character cards */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 16px"}}>
        <div style={{fontSize:10,color:"#443355",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,textAlign:"center"}}>Choose Your Fighter</div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" as any}}>
          {CHARACTERS.map(c=>(
            <button key={c.id} onClick={onPlay} style={{flex:"0 0 102px",background:`rgba(${c.glow},0.05)`,border:`1px solid rgba(${c.glow},0.22)`,borderRadius:16,padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",transition:"all 0.2s"}}
              onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor=`rgb(${c.glow})`;el.style.background=`rgba(${c.glow},0.12)`;el.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.22)`;el.style.background=`rgba(${c.glow},0.05)`;el.style.transform="";}} >
              <div style={{fontSize:40}}>{c.emoji}</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:12}}>{c.name}</div>
              <div style={{background:`rgba(${c.glow},0.15)`,borderRadius:5,padding:"2px 7px",fontSize:9,color:`rgb(${c.glow})`,fontWeight:700,textAlign:"center",lineHeight:1.3}}>{c.ability}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Feature grid */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["🔥","Combo System","Tap fast for up to 20× multiplier"],["👕","Drip Shop","Hats, glasses, chains on your character"],["🤖","Auto-Tappers","Hire helpers to earn while AFK"],["🏆","Live Rankings","48hr season resets, USDC prizes"]].map(([e,t,d])=>(
            <div key={t} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"14px 12px"}}>
              <div style={{fontSize:22,marginBottom:6}}>{e}</div>
              <div style={{color:"#ddd",fontWeight:800,fontSize:12,marginBottom:3}}>{t}</div>
              <div style={{color:"#444",fontSize:11,lineHeight:1.4}}>{d}</div>
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
      const{data}=await supabase.from("dt_players").select("id,wallet_address,username,character,total_score,games_played").gt("total_score",0).order("total_score",{ascending:false}).limit(100);
      setPlayers((data||[]) as LBEntry[]);
    }catch{}
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const rank=(lv:number)=>getRankFromLevel(lv);

  return(
    <div style={{minHeight:"100vh",background:"#080010",paddingBottom:90,overflowY:"auto"}}>
      {/* Header */}
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
          {/* Podium top 3 */}
          {players.length>=1&&(
            <div style={{display:"flex",gap:8,alignItems:"flex-end",justifyContent:"center",marginBottom:14}}>
              {/* 2nd */}
              {players[1]&&(()=>{const p=players[1];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.08)":"rgba(180,180,180,0.04)",border:`1px solid ${me?"rgba(168,85,247,0.35)":"rgba(180,180,180,0.15)"}`,borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>🥈</div>
                  <div style={{fontSize:18,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#ddd",fontWeight:700,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}</div>
                  <div style={{background:`${r.color}20`,border:`1px solid ${r.color}33`,borderRadius:4,padding:"1px 5px",fontSize:8,color:r.color,fontWeight:700,marginBottom:4,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.05)",borderRadius:1,marginBottom:4,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:r.color}}/></div>
                  <div style={{color:"#bbb",fontWeight:800,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                </div>);
              })()}
              {/* 1st */}
              {players[0]&&(()=>{const p=players[0];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.1)":"rgba(245,200,66,0.06)",border:`2px solid ${me?"rgba(168,85,247,0.5)":"rgba(245,200,66,0.3)"}`,borderRadius:16,padding:"14px 10px",textAlign:"center",boxShadow:"0 0 30px rgba(245,200,66,0.15)",marginBottom:10}}>
                  <div style={{fontSize:24,marginBottom:3}}>👑</div>
                  <div style={{fontSize:22,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}{me&&" ← You"}</div>
                  <div style={{background:`${r.color}22`,border:`1px solid ${r.color}44`,borderRadius:5,padding:"2px 7px",fontSize:9,color:r.color,fontWeight:800,marginBottom:6,display:"inline-block"}}>{r.emoji} Lv.{lv} {r.name}</div>
                  <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginBottom:5,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:`linear-gradient(90deg,${r.color}66,${r.color})`,borderRadius:2}}/></div>
                  <div style={{color:"#f5c842",fontWeight:900,fontSize:14}}>💰{fmt(p.total_score||0)}</div>
                </div>);
              })()}
              {/* 3rd */}
              {players[2]&&(()=>{const p=players[2];const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(<div style={{flex:1,background:me?"rgba(168,85,247,0.08)":"rgba(205,127,50,0.04)",border:`1px solid ${me?"rgba(168,85,247,0.35)":"rgba(205,127,50,0.15)"}`,borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>🥉</div>
                  <div style={{fontSize:18,marginBottom:3}}>{CE[p.character]||"🎮"}</div>
                  <div style={{color:"#ddd",fontWeight:700,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}</div>
                  <div style={{background:`${r.color}20`,border:`1px solid ${r.color}33`,borderRadius:4,padding:"1px 5px",fontSize:8,color:r.color,fontWeight:700,marginBottom:4,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.05)",borderRadius:1,marginBottom:4,overflow:"hidden"}}><div style={{width:`${xp.pct}%`,height:"100%",background:r.color}}/></div>
                  <div style={{color:"#cd7f32",fontWeight:800,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                </div>);
              })()}
            </div>
          )}
          {/* Rest */}
          {players.slice(3).map((p,i)=>{
            const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
            return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:8,background:me?"rgba(168,85,247,0.06)":"rgba(255,255,255,0.01)",border:`1px solid ${me?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.03)"}`,borderRadius:10,padding:"8px 10px",marginBottom:5}}>
              <div style={{width:22,textAlign:"center",fontSize:10,fontWeight:700,color:"#333",flexShrink:0}}>#{i+4}</div>
              <div style={{fontSize:14,flexShrink:0}}>{CE[p.character]||"🎮"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                  <span style={{color:me?"#a855f7":"#ccc",fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anon"}{me&&" ← You"}</span>
                  <span style={{flexShrink:0,background:`${r.color}18`,borderRadius:3,padding:"1px 4px",fontSize:8,color:r.color,fontWeight:700}}>{r.emoji} Lv.{lv}</span>
                </div>
                <div style={{height:2,background:"rgba(255,255,255,0.04)",borderRadius:1,overflow:"hidden"}}>
                  <div style={{width:`${xp.pct}%`,height:"100%",background:r.color}}/>
                </div>
              </div>
              <div style={{color:"#f5c842",fontWeight:800,fontSize:11,flexShrink:0}}>💰{fmt(p.total_score||0)}</div>
            </div>);
          })}
        </div>
      ):(
        /* Full list view */
        <div style={{padding:"10px 10px 0"}}>
          {players.map((p,i)=>{
            const lv=getLevelFromXP(p.total_score||0);const r=rank(lv);const xp=getLevelProgress(p.total_score||0);const me=p.wallet_address===myPlayerId;
            const medalMap:Record<number,string>={0:"👑",1:"🥈",2:"🥉"};
            return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:9,background:me?"rgba(168,85,247,0.08)":i<3?"rgba(255,255,255,0.025)":"rgba(255,255,255,0.01)",border:`1px solid ${me?"rgba(168,85,247,0.25)":i<3?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)"}`,borderRadius:12,padding:"10px 12px",marginBottom:6}}>
              <div style={{width:26,textAlign:"center",fontSize:i<3?16:10,fontWeight:700,color:i<3?undefined:"#444",flexShrink:0}}>{i<3?medalMap[i]:`#${i+1}`}</div>
              <div style={{fontSize:16,flexShrink:0}}>{CE[p.character]||"🎮"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{color:me?"#a855f7":"#ddd",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anonymous"}{me&&" ← You"}</span>
                  <span style={{flexShrink:0,background:`${r.color}18`,border:`1px solid ${r.color}30`,borderRadius:4,padding:"1px 5px",fontSize:8,color:r.color,fontWeight:700}}>{r.emoji} {r.name} Lv.{lv}</span>
                </div>
                <div style={{height:3,background:"rgba(255,255,255,0.04)",borderRadius:2,overflow:"hidden",marginBottom:2}}>
                  <div style={{width:`${xp.pct}%`,height:"100%",background:`linear-gradient(90deg,${r.color}55,${r.color})`,borderRadius:2}}/>
                </div>
                <div style={{color:"#2a2a3a",fontSize:8}}>{fmt(xp.current)}/{fmt(xp.needed)} XP to Lv.{lv+1}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:"#f5c842",fontWeight:900,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                <div style={{color:"#333",fontSize:8}}>#{i+1}</div>
              </div>
            </div>);
          })}
        </div>
      )}

      {/* Rank ladder */}
      <div style={{margin:"14px 10px 0",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:14,padding:"12px"}}>
        <div style={{fontSize:9,color:"#443355",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>🪜 Rank Ladder</div>
        {RANKS.map(r=>(
          <div key={r.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div style={{width:28,flexShrink:0,fontSize:9,color:"#333",fontWeight:700}}>Lv{r.minLevel}+</div>
            <div style={{fontSize:13}}>{r.emoji}</div>
            <div style={{flex:1}}><div style={{color:r.color,fontWeight:700,fontSize:11}}>{r.name}</div></div>
            <div style={{color:"#2a2a3a",fontSize:9}}>{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SHOP TAB ─────────────────────────────────────────────────────────────────
function ShopTab({coins,charId,upgrades,ownedCosmetics,equippedCosmetics,onBuyUpgrade,onBuyCos,onEquipCos}:{
  coins:number;charId:string|null;upgrades:Record<string,number>;ownedCosmetics:string[];equippedCosmetics:Record<string,string>;
  onBuyUpgrade:(id:string)=>void;onBuyCos:(id:string)=>void;onEquipCos:(id:string)=>void;
}){
  const [tab,setTab]=useState<"upgrades"|"drip">("upgrades");
  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#fff",paddingBottom:80}}>
      <div style={{background:"rgba(8,0,20,0.98)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"12px 14px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <h2 style={{fontWeight:900,fontSize:16,margin:0}}>🛒 Shop</h2>
          <div style={{marginLeft:"auto",background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:800,color:"#f5c842"}}>💰 {fmt(coins)}</div>
        </div>
        <div style={{display:"flex",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,overflow:"hidden"}}>
          {(["upgrades","drip"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"rgba(168,85,247,0.2)":"transparent",border:"none",color:tab===t?"#a855f7":"#555",fontWeight:700,fontSize:11,padding:"7px 0",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em"}}>
              {t==="upgrades"?"⚡ Upgrades":"👕 Drip"}
            </button>
          ))}
        </div>
      </div>
      {!charId?(
        <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:44,marginBottom:10}}>🛒</div><div style={{color:"#443355",fontSize:14,fontWeight:700}}>Start a game first to access the shop</div></div>
      ):tab==="upgrades"?(
        <div style={{padding:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {UPGRADES.map(u=>{
            const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
            return(<button key={u.id} onClick={()=>onBuyUpgrade(u.id)} disabled={!can} style={{background:can?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.01)",border:`1px solid ${can?"rgba(245,200,66,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:14,padding:"12px 10px",cursor:can?"pointer":"not-allowed",textAlign:"left",opacity:can?1:0.45,transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                <span style={{fontSize:20}}>{u.emoji}</span>
                <span style={{fontWeight:800,fontSize:12,color:"#fff",flex:1}}>{u.name}</span>
                {lv>0&&<span style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:4,padding:"1px 5px",fontSize:9,color:"#a855f7",fontWeight:700}}>Lv.{lv}</span>}
              </div>
              <div style={{color:"#555",fontSize:10,marginBottom:6}}>{u.desc}</div>
              <div style={{color:can?"#f5c842":"#444",fontWeight:800,fontSize:12}}>💰 {fmt(cost)}</div>
            </button>);
          })}
        </div>
      ):(
        <div style={{padding:10}}>
          {/* Preview of character with current drip */}
          {(()=>{
            const previewChar = CHARACTERS.find(c=>c.id===charId);
            if(!previewChar) return null;
            const previewItems = Object.values(equippedCosmetics).map(id=>COSMETICS.find(c=>c.id===id)).filter(Boolean) as typeof COSMETICS[0][];
            return (
              <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                <div style={{position:"relative",width:140,height:140,flexShrink:0}}>
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",border:`2px solid rgba(${previewChar.glow},0.4)`,background:`radial-gradient(ellipse at 50% 30%,rgba(${previewChar.glow},0.08) 0%,#0a0016 100%)`}}>
                    <img src={previewChar.image} alt={previewChar.name} draggable={false}
                      style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}
                      onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:60px">${previewChar.emoji}</div>`;}}
                    />
                  </div>
                  {previewItems.map(cos=>(
                    <div key={cos.id} style={{position:"absolute",top:cos.top,left:cos.left,transform:cos.transform,fontSize:Math.round(cos.size*140/240),lineHeight:1,pointerEvents:"none",zIndex:20,filter:"drop-shadow(0 1px 4px rgba(0,0,0,1))",userSelect:"none"}}>
                      {cos.emoji}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* Group by slot */}
          {(["hat","glasses","mouth","neck","hand"] as const).map(slot=>{
            const items=COSMETICS.filter(c=>c.slot===slot);
            const slotLabel:{[k:string]:string}={hat:"🎩 Hats",glasses:"😎 Glasses",mouth:"🚬 Mouth",neck:"📿 Neck",hand:"✊ Hand"};
            return(<div key={slot} style={{marginBottom:16}}>
              <div style={{color:"#443355",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:7}}>{slotLabel[slot]}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {items.map(cos=>{
                  const owned=ownedCosmetics.includes(cos.id);
                  const equipped=Object.values(equippedCosmetics).includes(cos.id);
                  const can=coins>=cos.cost;
                  return(<button key={cos.id} onClick={()=>owned?onEquipCos(cos.id):onBuyCos(cos.id)} style={{background:equipped?"rgba(168,85,247,0.1)":owned?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.015)",border:`1px solid ${equipped?"rgba(168,85,247,0.4)":owned?"rgba(255,255,255,0.08)":can?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)"}`,borderRadius:12,padding:"12px 10px",cursor:"pointer",textAlign:"left",opacity:(!owned&&!can)?0.45:1,transition:"all 0.15s",position:"relative"}}>
                    {equipped&&<div style={{position:"absolute",top:4,right:4,background:"#a855f7",borderRadius:3,fontSize:7,fontWeight:900,color:"#fff",padding:"1px 4px"}}>ON</div>}
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                      <span style={{fontSize:22}}>{cos.emoji}</span>
                      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:"#fff"}}>{cos.name}</div><div style={{background:`${RARITY_COLOR[cos.rarity]}18`,border:`1px solid ${RARITY_COLOR[cos.rarity]}30`,borderRadius:3,padding:"1px 5px",fontSize:8,color:RARITY_COLOR[cos.rarity],fontWeight:700,display:"inline-block",marginTop:2,textTransform:"uppercase"}}>{cos.rarity}</div></div>
                    </div>
                    {owned?(<div style={{color:equipped?"#a855f7":"#22d67a",fontWeight:700,fontSize:11}}>{equipped?"✓ Equipped":"Tap to equip"}</div>)
                          :(<div style={{color:can?"#f5c842":"#444",fontWeight:800,fontSize:12}}>💰 {fmt(cos.cost)}</div>)}
                  </button>);
                })}
              </div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ─── QUICK BUY STRIP ──────────────────────────────────────────────────────────
function QuickStrip({coins,upgrades,ownedCosmetics,equippedCosmetics,onBuyUpgrade,onBuyCos,onEquipCos}:{
  coins:number;upgrades:Record<string,number>;ownedCosmetics:string[];equippedCosmetics:Record<string,string>;
  onBuyUpgrade:(id:string)=>void;onBuyCos:(id:string)=>void;onEquipCos:(id:string)=>void;
}){
  const [tab,setTab]=useState<"upg"|"drip">("upg");
  return(
    <div style={{width:"100%"}}>
      <div style={{display:"flex",gap:0,padding:"0 14px",marginBottom:0}}>
        {(["upg","drip"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"rgba(255,255,255,0.04)":"transparent",border:`1px solid ${tab===t?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)"}`,color:tab===t?"#aaa":"#444",fontWeight:700,fontSize:10,padding:"5px 0",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em",
            borderRadius:t==="upg"?"7px 0 0 7px":"0 7px 7px 0"}}>
            {t==="upg"?"⚡ Upgrades":"👕 Drip"}
          </button>
        ))}
      </div>
      <div style={{overflowX:"auto",display:"flex",gap:7,padding:"7px 14px 10px",WebkitOverflowScrolling:"touch" as any}}>
        {tab==="upg"?UPGRADES.map(u=>{
          const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
          return(<button key={u.id} onClick={()=>onBuyUpgrade(u.id)} style={{flex:"0 0 80px",height:88,background:can?"rgba(245,200,66,0.04)":"rgba(255,255,255,0.015)",border:`1px solid ${can?"rgba(245,200,66,0.25)":"rgba(255,255,255,0.04)"}`,borderRadius:12,padding:"7px 5px",cursor:can?"pointer":"not-allowed",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",opacity:can?1:0.45,position:"relative"}}>
            {lv>0&&<div style={{position:"absolute",top:3,right:4,background:"rgba(168,85,247,0.7)",borderRadius:3,fontSize:8,fontWeight:900,color:"#fff",padding:"1px 3px"}}>Lv{lv}</div>}
            <div style={{fontSize:22}}>{u.emoji}</div>
            <div style={{color:"#bbb",fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{u.name}</div>
            <div style={{color:can?"#f5c842":"#444",fontSize:10,fontWeight:900}}>💰{fmt(cost)}</div>
          </button>);
        }):COSMETICS.map(c=>{
          const owned=ownedCosmetics.includes(c.id);
          const equipped=Object.values(equippedCosmetics).includes(c.id);
          return(<button key={c.id} onClick={()=>owned?onEquipCos(c.id):onBuyCos(c.id)} style={{flex:"0 0 80px",height:88,background:equipped?"rgba(168,85,247,0.1)":owned?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.015)",border:`1px solid ${equipped?"rgba(168,85,247,0.5)":owned?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)"}`,borderRadius:12,padding:"7px 5px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
            {equipped&&<div style={{position:"absolute",top:3,right:4,background:"#a855f7",borderRadius:3,fontSize:7,fontWeight:900,color:"#fff",padding:"1px 3px"}}>ON</div>}
            <div style={{fontSize:24}}>{c.emoji}</div>
            <div style={{color:"#bbb",fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{c.name}</div>
            {owned?<div style={{color:equipped?"#a855f7":"#22d67a",fontSize:9,fontWeight:800}}>{equipped?"Equipped":"Equip"}</div>
                  :<div style={{color:coins>=c.cost?"#f5c842":"#444",fontSize:10,fontWeight:900}}>💰{fmt(c.cost)}</div>}
          </button>);
        })}
      </div>
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────
export default function TapGame() {
  const [activeTab,setActiveTab]=useState<"home"|"play"|"shop"|"ranks">("home");
  const [screen,setScreen]=useState<"select"|"game">("select");
  const [charId,setCharId]=useState<string|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [pendingChar,setPendingChar]=useState<string|null>(null);
  const [playerId,setPlayerId]=useState("");
  const [username,setUsername]=useState("");
  const [solWallet,setSolWallet]=useState("");

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
  const [ownedCosmetics,setOwnedCosmetics]=useState<string[]>([]);
  const [equippedCosmetics,setEquippedCosmetics]=useState<Record<string,string>>({});
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
  const autoRate=(upgrades["helper_1"]||0)*1+(upgrades["helper_2"]||0)*3+(upgrades["helper_3"]||0)*10+(upgrades["helper_4"]||0)*30;

  useEffect(()=>{ setPlayerId(getPlayerId()); setUsername(getPlayerName()); setSolWallet(getPlayerWallet()); },[]);

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
    setUpgrades(s.upgrades);setOwnedCosmetics(s.ownedCosmetics||[]);setEquippedCosmetics(s.equippedCosmetics||{});
    const mx=1000+(s.upgrades["energy_max"]||0)*200;setMaxEnergy(mx);setEnergy(mx);
    setScreen("game");setActiveTab("play");saveRef.current=s;
    const w=wallet??getPlayerWallet();
    syncDB(getPlayerId(),name,id,s.totalEarned,s.totalTaps,s.equippedCosmetics||{},s.ownedCosmetics||[],w||undefined);
  }

  const doSave=useCallback(()=>{
    if(!charId)return;
    const s:SaveData={charId:charId!,coins,totalEarned,totalTaps,upgrades,highScore:Math.max(coins,saveRef.current?.highScore||0),ownedCosmetics,equippedCosmetics};
    persistSave(s);saveRef.current=s;
    syncDB(playerId||getPlayerId(),username||getPlayerName(),charId!,totalEarned,totalTaps,equippedCosmetics,ownedCosmetics,solWallet||getPlayerWallet()||undefined);
  },[charId,coins,totalEarned,totalTaps,upgrades,ownedCosmetics,equippedCosmetics,playerId,username,solWallet]);

  useEffect(()=>{ if(screen!=="game"||!charId)return; const id=setInterval(doSave,8000); return()=>clearInterval(id); },[screen,charId,doSave]);

  // Auto-tappers
  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const rate=autoRate*(specialActive&&char.id==="trump"?5:1);
    if(rate<=0)return;
    const id=setInterval(()=>{const pt=rate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt);},50);
    return()=>clearInterval(id);
  },[autoRate,activeTab,screen,char,specialActive]);

  // Energy regen
  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const r=char.energyRegen*(specialActive&&char.id==="bonk"?999:1);
    const id=setInterval(()=>setEnergy(e=>Math.min(maxEnergy,e+r*0.05)),50);
    return()=>clearInterval(id);
  },[activeTab,screen,char,maxEnergy,specialActive]);

  // Combo decay
  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game")return;
    const id=setInterval(()=>setComboTimer(t=>{ if(t<=0){setCombo(1);return 0;} return t-0.05; }),50);
    return()=>clearInterval(id);
  },[activeTab,screen]);

  // Special timer
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

    const tapPow=upgrades["tap_power"]||0;
    const multiTap=upgrades["multi_tap"]||0;
    const critChance=(upgrades["crit_chance"]||0)*0.1;
    const tapBase=(char.baseCoins+tapPow)*(1+multiTap);
    const specMult=specialActive?char.specialMultiplier:1;
    const isCrit=Math.random()<critChance;
    let earned=tapBase*combo*specMult*(isCrit?5:1);
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

    const cspeed=upgrades["combo_speed"]?1+upgrades["combo_speed"]*0.2:1;
    const gcBonus=char.id==="gigachad"?2:1;
    const maxCombo=char.comboMax+(upgrades["combo_max"]||0)*5;
    setCombo(c=>Math.min(maxCombo,c+0.3*cspeed*gcBonus));
    setComboTimer(0.8);
    setSpecialCharge(s=>Math.min(100,s+(upgrades["special_cd"]?3:2)));
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
    if(id==="energy_max")setMaxEnergy(1000+((upgrades["energy_max"]||0)+1)*200);
    showToast(`${u.emoji} ${u.name} Lv.${lv+1}!`);
  },[coins,upgrades]);

  const buyCosmetic=useCallback((id:string)=>{
    const cos=COSMETICS.find(c=>c.id===id)!;
    if(coins<cos.cost||ownedCosmetics.includes(id))return;
    setCoins(c=>c-cos.cost);
    setOwnedCosmetics(o=>[...o,id]);
    setEquippedCosmetics(eq=>({...eq,[cos.slot]:id}));
    showToast(`${cos.emoji} ${cos.name} equipped!`);
  },[coins,ownedCosmetics]);

  const equipCosmetic=useCallback((id:string)=>{
    const cos=COSMETICS.find(c=>c.id===id)!;
    setEquippedCosmetics(eq=>{
      const already=eq[cos.slot]===id;
      if(already){ const n={...eq}; delete n[cos.slot]; return n; }
      return {...eq,[cos.slot]:id};
    });
  },[]);

  return(
    <div style={{background:"#080010",minHeight:"100vh",position:"relative"}}>
      {showModal&&<UsernameModal onConfirm={onUsername}/>}

      {/* Achievement popup */}
      {newAchiev&&(
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:200,background:"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:14,padding:"9px 18px",color:"#fff",fontWeight:900,fontSize:13,boxShadow:"0 0 40px rgba(168,85,247,0.6)",whiteSpace:"nowrap",animation:"slideDown 0.3s ease-out"}}>
          🏅 {newAchiev}
        </div>
      )}
      {toast&&(
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:199,background:"rgba(34,214,122,0.15)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:14,padding:"7px 16px",color:"#22d67a",fontWeight:800,fontSize:12,whiteSpace:"nowrap",animation:"slideDown 0.2s ease-out"}}>
          {toast}
        </div>
      )}
      {critFlash&&<div style={{position:"fixed",inset:0,background:"rgba(255,40,40,0.07)",zIndex:150,pointerEvents:"none"}}/>}

      {/* HOME */}
      {activeTab==="home"&&<HomeTab onPlay={()=>setActiveTab("play")}/>}
      {/* RANKS */}
      {activeTab==="ranks"&&<LeaderboardTab myPlayerId={playerId}/>}
      {/* SHOP */}
      {activeTab==="shop"&&<ShopTab coins={coins} charId={charId} upgrades={upgrades} ownedCosmetics={ownedCosmetics} equippedCosmetics={equippedCosmetics} onBuyUpgrade={buyUpgrade} onBuyCos={buyCosmetic} onEquipCos={equipCosmetic}/>}

      {/* PLAY */}
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
                {/* XP bar */}
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

              {/* Special active banner */}
              {specialActive&&(
                <div style={{position:"relative",zIndex:10,background:`linear-gradient(135deg,rgba(${char.glow},0.8),rgba(${char.glow},0.5))`,borderRadius:20,padding:"3px 18px",marginBottom:4,fontSize:11,fontWeight:900,color:"#fff",boxShadow:`0 0 24px rgba(${char.glow},0.7)`,animation:"pulseBanner 0.4s infinite"}}>
                  ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
                </div>
              )}

              {/* 3D Model Stage */}
              <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:260,height:260,marginBottom:8,margin:"0 auto 8px"}}>
                <ModelStage char={char} equippedCosmetics={equippedCosmetics} specialActive={specialActive} charPulse={charPulse} onTap={handleTap} firstPlay={totalTaps<3}/>
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

              {/* Quick strip */}
              <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:10}}>
                <QuickStrip coins={coins} upgrades={upgrades} ownedCosmetics={ownedCosmetics} equippedCosmetics={equippedCosmetics} onBuyUpgrade={buyUpgrade} onBuyCos={buyCosmetic} onEquipCos={equipCosmetic}/>
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
