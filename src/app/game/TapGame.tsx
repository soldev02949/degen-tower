"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id: "pepe",     name: "Pepe",     emoji: "🐸", image: "/characters/pepe.png",     color: "#4caf50", glow: "76,175,80",    baseCoins: 1, ability: "Lucky Tap",   abilityDesc: "15% chance to triple coins",              specialName: "Comfy Mode",              specialDesc: "2× all earnings for 30s",                  specialDuration: 30, passive: (c:number)=>Math.random()<0.15?c*3:c, specialMultiplier:2, energyRegen:1,   comboMax:10 },
  { id: "gigachad", name: "Gigachad", emoji: "💪", image: "/characters/gigachad.png", color: "#e0b87a", glow: "224,184,122",  baseCoins: 1, ability: "Sigma Grind", abilityDesc: "Combo builds 2× faster, 20× max",          specialName: "Max Mode",                specialDesc: "Instant max combo + 5× for 20s",            specialDuration: 20, passive: (c:number)=>c,                        specialMultiplier:5, energyRegen:1,   comboMax:20 },
  { id: "trump",    name: "Trump",    emoji: "🎩", image: "/characters/trump.png",    color: "#3b82f6", glow: "59,130,246",  baseCoins: 2, ability: "Deal Maker",  abilityDesc: "Every 50 taps = 10× burst",               specialName: "MAGA Mode",               specialDesc: "Helpers 5× + tap 3× for 40s",               specialDuration: 40, passive: (c:number)=>c,                        specialMultiplier:3, energyRegen:0.8, comboMax:12 },
  { id: "troll",    name: "Trollface",emoji: "🧌", image: "/characters/troll.png",    color: "#a855f7", glow: "168,85,247",  baseCoins: 1, ability: "Chaos Agent", abilityDesc: "Random 0.5–8× per tap",                   specialName: "CHAOS MODE",              specialDesc: "10s of 1–15× random multiplier",            specialDuration: 10, passive: (c:number)=>c*(0.5+Math.random()*7.5), specialMultiplier:1, energyRegen:1.2, comboMax:10 },
  { id: "bonk",     name: "Bonk",     emoji: "🐕", image: "/characters/bonk.png",     color: "#e8853a", glow: "232,133,58",  baseCoins: 1, ability: "BONK Speed",  abilityDesc: "3× energy regen, no cooldown",            specialName: "BONK Frenzy",             specialDesc: "Infinite energy + 3× for 15s",              specialDuration: 15, passive: (c:number)=>c,                        specialMultiplier:3, energyRegen:3,   comboMax:10 },
];

// ─── Upgrades (gameplay) ──────────────────────────────────────────────────────
const UPGRADES = [
  { id:"tap_power",    name:"Tap Power",       emoji:"⚡", desc:"+1 coin per tap",          baseCost:50,   costMult:1.8, tag:"power" },
  { id:"energy_max",  name:"Energy Tank",      emoji:"🔋", desc:"+200 max energy",          baseCost:100,  costMult:2.0, tag:"energy" },
  { id:"combo_speed", name:"Combo Rush",       emoji:"🔥", desc:"Combo builds faster",      baseCost:80,   costMult:1.9, tag:"combo" },
  { id:"multi_tap",   name:"Multi Tap",        emoji:"👆", desc:"Each tap counts as 2",     baseCost:400,  costMult:2.5, tag:"power" },
  { id:"crit_chance", name:"Critical Hit",     emoji:"💥", desc:"+10% crit tap (5× coins)", baseCost:300,  costMult:2.2, tag:"power" },
  { id:"helper_1",    name:"FUD Bear",         emoji:"🐻", desc:"+1 auto-tap/sec",          baseCost:200,  costMult:2.5, tag:"auto"  },
  { id:"helper_2",    name:"Bot Army",         emoji:"🤖", desc:"+3 auto-taps/sec",         baseCost:800,  costMult:3.0, tag:"auto"  },
  { id:"helper_3",    name:"Whale Wallet",     emoji:"🐋", desc:"+10 auto-taps/sec",        baseCost:3000, costMult:3.5, tag:"auto"  },
  { id:"helper_4",    name:"Hedge Fund",       emoji:"🏦", desc:"+30 auto-taps/sec",        baseCost:15000,costMult:4.0, tag:"auto"  },
  { id:"special_cd",  name:"Special Cooldown", emoji:"⏩", desc:"Charge special 50% faster",baseCost:300,  costMult:2.2, tag:"special"},
  { id:"lucky_strike",name:"Lucky Strike",     emoji:"🎰", desc:"+5% lucky tap chance",     baseCost:500,  costMult:2.8, tag:"power" },
  { id:"combo_max",   name:"Combo King",       emoji:"👑", desc:"+5 max combo cap",         baseCost:600,  costMult:2.6, tag:"combo" },
];

// ─── Cosmetics ────────────────────────────────────────────────────────────────
export const COSMETICS = [
  // Hats
  { id:"top_hat",    name:"Top Hat",         emoji:"🎩", type:"hat",       cost:500,  rarity:"rare",    style:{ top:"-14%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(28px,8vw,36px)" } },
  { id:"crown",      name:"Diamond Crown",   emoji:"👑", type:"hat",       cost:2000, rarity:"epic",    style:{ top:"-18%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(26px,7vw,32px)" } },
  { id:"cowboy",     name:"Cowboy Hat",      emoji:"🤠", type:"hat",       cost:800,  rarity:"rare",    style:{ top:"-12%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(30px,8vw,38px)" } },
  { id:"santa",      name:"Santa Hat",       emoji:"🎅", type:"hat",       cost:350,  rarity:"common",  style:{ top:"-14%", left:"52%", transform:"translateX(-50%)", fontSize:"clamp(26px,7vw,32px)" } },
  { id:"party_hat",  name:"Party Hat",       emoji:"🎉", type:"hat",       cost:250,  rarity:"common",  style:{ top:"-12%", left:"54%", transform:"translateX(-50%)", fontSize:"clamp(24px,6vw,28px)" } },
  // Glasses
  { id:"shades",     name:"Chad Shades",     emoji:"😎", type:"glasses",   cost:300,  rarity:"common",  style:{ top:"28%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(26px,7vw,32px)" } },
  { id:"monocle",    name:"Monocle",         emoji:"🧐", type:"glasses",   cost:600,  rarity:"rare",    style:{ top:"28%", left:"56%", transform:"translateX(-50%)", fontSize:"clamp(22px,6vw,26px)" } },
  { id:"vr",         name:"VR Headset",      emoji:"🥽", type:"glasses",   cost:1200, rarity:"epic",    style:{ top:"26%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(28px,8vw,36px)" } },
  { id:"nerd",       name:"Nerd Glasses",    emoji:"🤓", type:"glasses",   cost:400,  rarity:"common",  style:{ top:"28%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(26px,7vw,30px)" } },
  // Accessories
  { id:"chain",      name:"Diamond Chain",   emoji:"📿", type:"accessory", cost:1000, rarity:"epic",    style:{ top:"60%", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(22px,6vw,28px)" } },
  { id:"cigar",      name:"Degen Cigar",     emoji:"🚬", type:"accessory", cost:400,  rarity:"common",  style:{ top:"52%", left:"68%", transform:"translateX(-50%)", fontSize:"clamp(18px,5vw,22px)" } },
  { id:"watch",      name:"Gold Watch",      emoji:"⌚", type:"accessory", cost:800,  rarity:"rare",    style:{ top:"65%", left:"72%", transform:"translateX(-50%)", fontSize:"clamp(18px,5vw,22px)" } },
  { id:"bag",        name:"Money Bag",       emoji:"💰", type:"held",      cost:600,  rarity:"rare",    style:{ top:"62%", left:"20%", transform:"translateX(-50%)", fontSize:"clamp(22px,6vw,26px)" } },
  { id:"diamond",    name:"Diamond Ring",    emoji:"💍", type:"accessory", cost:2500, rarity:"legendary",style:{ top:"70%", left:"76%", transform:"translateX(-50%)", fontSize:"clamp(16px,4vw,20px)" } },
  { id:"sword",      name:"Based Sword",     emoji:"⚔️",  type:"held",      cost:1800, rarity:"epic",    style:{ top:"55%", left:"18%", transform:"translateX(-50%) rotate(-30deg)", fontSize:"clamp(22px,6vw,28px)" } },
];

const RARITY_COLOR: Record<string,string> = { common:"#6b6b8a", rare:"#3b82f6", epic:"#a855f7", legendary:"#f5c842" };

// ─── Rank System (imported from lib/progression) ──────────────────────────────
import { getLevelFromXP, getLevelProgress, getRankFromLevel, getNextRank, xpForNextLevel, RANKS } from "@/lib/progression";
function getLevel(t:number){ return getLevelFromXP(t); }
function getRank(lv:number){ const r=getRankFromLevel(lv); return {name:r.name,color:r.color,emoji:r.emoji}; }

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle { id:number; x:number; y:number; value:string; color:string; big:boolean; }
interface LBEntry  { id:string; wallet_address:string; username:string; character:string; total_score:number; games_played:number; }
interface SaveData { charId:string; coins:number; totalEarned:number; totalTaps:number; level:number; upgrades:Record<string,number>; highScore:number; ownedCosmetics:string[]; equippedCosmetics:Record<string,string>; }

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(n:number){ if(n>=1e9)return(n/1e9).toFixed(2)+"B"; if(n>=1e6)return(n/1e6).toFixed(2)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.floor(n).toString(); }
function getUpgCost(u:typeof UPGRADES[0], lv:number){ return Math.floor(u.baseCost*Math.pow(u.costMult,lv)); }
function getPlayerId(){ try{ let id=localStorage.getItem("degen_player_id"); if(!id){ id="p_"+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem("degen_player_id",id); } return id; }catch{ return "anon"; } }
function getPlayerName(){ try{ return localStorage.getItem("degen_username")||""; }catch{ return ""; } }
function setPlayerName(n:string){ try{ localStorage.setItem("degen_username",n); }catch{} }
function loadSave(charId:string):SaveData{
  try{ const r=localStorage.getItem(`degen_save_${charId}`); if(r)return JSON.parse(r); }catch{}
  return { charId, coins:0, totalEarned:0, totalTaps:0, level:1, upgrades:{}, highScore:0, ownedCosmetics:[], equippedCosmetics:{} };
}
function persistSave(d:SaveData){ try{ localStorage.setItem(`degen_save_${d.charId}`,JSON.stringify(d)); }catch{} }

async function syncDB(playerId:string, username:string, charId:string, totalEarned:number, totalTaps:number, equipped:Record<string,string>, owned:string[]){
  try{
    const {supabase}=await import("@/lib/supabase");
    await supabase.from("dt_players").upsert({
      wallet_address: playerId,
      username: username||("Degen_"+playerId.slice(-6)),
      character: charId,
      total_score: Math.floor(totalEarned),
      games_played: Math.floor(totalTaps),
      is_verified: false,
      equipped_cosmetics: equipped,
      owned_cosmetics: owned,
    },{ onConflict:"wallet_address" });
  }catch{}
}

// ─── 48hr countdown ───────────────────────────────────────────────────────────
function useCountdown(){
  const [t,setT]=useState("");
  useEffect(()=>{
    function c(){ const now=Date.now(),p=48*3600000,next=Math.ceil(now/p)*p,d=next-now; const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000); setT(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`); }
    c(); const id=setInterval(c,1000); return()=>clearInterval(id);
  },[]);
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOTTOM TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
const TABS=[{id:"home",label:"Home",emoji:"🏠"},{id:"play",label:"Play",emoji:"🎮"},{id:"shop",label:"Shop",emoji:"⚡"},{id:"leaderboard",label:"Ranks",emoji:"🏆"}];

function BottomBar({active,onTab}:{active:string;onTab:(t:string)=>void}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(6,0,14,0.98)",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {TABS.map(tab=>(
        <button key={tab.id} onClick={()=>onTab(tab.id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",opacity:active===tab.id?1:0.4,transition:"opacity 0.15s",position:"relative"}}>
          {active===tab.id&&<div style={{position:"absolute",top:0,left:"15%",right:"15%",height:2,background:"linear-gradient(90deg,transparent,#a855f7,transparent)",borderRadius:"0 0 2px 2px"}}/>}
          <span style={{fontSize:20}}>{tab.emoji}</span>
          <span style={{fontSize:10,fontWeight:active===tab.id?800:500,color:active===tab.id?"#fff":"#666",textTransform:"uppercase",letterSpacing:"0.05em"}}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  USERNAME MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UsernameModal({onConfirm}:{onConfirm:(n:string)=>void}){
  const [val,setVal]=useState("");
  const adj=["Degen","Sigma","Giga","Based","Ape","Moon","Chad","Ngmi","Fud","Rekt","Diamond","Gold"];
  const noun=["Tapper","Clicker","Frog","Whale","Pepe","Lord","King","God","Pump","Hands"];
  const suggested=adj[Math.floor(Math.random()*adj.length)]+noun[Math.floor(Math.random()*noun.length)]+Math.floor(Math.random()*999);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)"}}>
      <div style={{background:"linear-gradient(145deg,rgba(20,5,40,0.99),rgba(10,0,20,0.99))",border:"1px solid rgba(168,85,247,0.4)",borderRadius:24,padding:"32px 24px",width:"100%",maxWidth:340,textAlign:"center",boxShadow:"0 0 80px rgba(168,85,247,0.2)"}}>
        <div style={{fontSize:44,marginBottom:12}}>🎮</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,marginBottom:6,letterSpacing:"-0.02em"}}>Choose Your Name</h2>
        <p style={{color:"#664488",fontSize:13,marginBottom:20}}>Shows up on the leaderboard</p>
        <input type="text" value={val} onChange={e=>setVal(e.target.value.slice(0,18))} onKeyDown={e=>e.key==="Enter"&&onConfirm(val.trim()||suggested)} placeholder={suggested} autoFocus
          style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:12,color:"#fff",fontSize:16,padding:"13px 16px",outline:"none",marginBottom:14,boxSizing:"border-box"}}/>
        <button onClick={()=>onConfirm(val.trim()||suggested)} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:14,color:"#fff",fontWeight:900,fontSize:16,padding:"14px",cursor:"pointer",boxShadow:"0 0 32px rgba(168,85,247,0.4)"}}>
          Let&apos;s Go! 🚀
        </button>
        <div style={{color:"#332244",fontSize:11,marginTop:10}}>Leave blank → {suggested}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHARACTER SHOWCASE (3D-style stage)
// ─────────────────────────────────────────────────────────────────────────────
function CharacterShowcase({ char, equippedCosmetics, specialActive, charPulse, comboLevel }:{
  char: typeof CHARACTERS[0];
  equippedCosmetics: Record<string,string>;
  specialActive: boolean;
  charPulse: boolean;
  comboLevel: number;
}) {
  const equipped = Object.values(equippedCosmetics);
  return(
    <div style={{position:"relative",width:220,height:220,margin:"0 auto",perspective:600}}>
      {/* Glow floor */}
      <div style={{position:"absolute",bottom:-10,left:"10%",right:"10%",height:30,background:`radial-gradient(ellipse,rgba(${char.glow},0.5) 0%,transparent 70%)`,filter:"blur(8px)",zIndex:0}}/>
      {/* Orbit rings */}
      <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:`1px solid rgba(${char.glow},${specialActive?0.7:0.25})`,animation:"orbit1 4s linear infinite",zIndex:0}}/>
      <div style={{position:"absolute",inset:-20,borderRadius:"50%",border:`1px solid rgba(${char.glow},${specialActive?0.4:0.1})`,animation:"orbit2 8s linear infinite reverse",zIndex:0}}/>
      {/* Character circle */}
      <div style={{
        position:"absolute",inset:10,
        borderRadius:"50%",
        background:`radial-gradient(circle at 40% 35%, rgba(${char.glow},0.25) 0%, rgba(0,0,0,0.6) 70%)`,
        border:`3px solid rgba(${char.glow},${specialActive?1:0.6})`,
        boxShadow: specialActive
          ? `0 0 60px rgba(${char.glow},0.9), 0 0 120px rgba(${char.glow},0.4), inset 0 0 40px rgba(${char.glow},0.2)`
          : `0 0 30px rgba(${char.glow},0.4), inset 0 0 20px rgba(${char.glow},0.1)`,
        overflow:"hidden",
        transform: charPulse ? "scale(0.92)" : "scale(1)",
        transition:"transform 0.1s, box-shadow 0.3s",
        animation: charPulse ? "none" : "float3d 3s ease-in-out infinite",
        zIndex:1,
      }}>
        <img src={char.image} alt={char.name} draggable={false}
          style={{width:"100%",height:"100%",objectFit:"cover",pointerEvents:"none",
            filter: specialActive ? `brightness(1.4) saturate(1.3) drop-shadow(0 0 12px rgba(${char.glow},0.8))` : "none",
            transition:"filter 0.3s"}}
          onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";el.parentElement!.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px">${char.emoji}</div>`;}}
        />
        {/* Cosmetic overlays on character */}
        {equipped.map(cosId=>{
          const cos=COSMETICS.find(c=>c.id===cosId);
          if(!cos) return null;
          return(
            <div key={cos.id} style={{position:"absolute",...cos.style as any,zIndex:5,pointerEvents:"none",lineHeight:1,textShadow:"0 2px 8px rgba(0,0,0,0.8)",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.9))"}}>
              {cos.emoji}
            </div>
          );
        })}
      </div>
      {/* Combo ring glow */}
      {comboLevel > 2 && (
        <div style={{position:"absolute",inset:5,borderRadius:"50%",border:`2px solid rgba(${char.glow},${Math.min(0.9,(comboLevel-2)*0.1)})`,animation:"comboRing 0.5s ease-in-out infinite alternate",zIndex:2,pointerEvents:"none"}}/>
      )}
      {/* Special flash overlay */}
      {specialActive && (
        <div style={{position:"absolute",inset:10,borderRadius:"50%",background:`radial-gradient(circle,rgba(${char.glow},0.15) 0%,transparent 70%)`,animation:"specialPulse 0.4s ease-in-out infinite",zIndex:2,pointerEvents:"none"}}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUICK BUY STRIP
// ─────────────────────────────────────────────────────────────────────────────
function QuickBuyStrip({ coins, upgrades, ownedCosmetics, equippedCosmetics, onBuyUpgrade, onBuyCos, onEquipCos }:{
  coins:number; upgrades:Record<string,number>; ownedCosmetics:string[]; equippedCosmetics:Record<string,string>;
  onBuyUpgrade:(id:string)=>void; onBuyCos:(id:string)=>void; onEquipCos:(id:string)=>void;
}) {
  const [tab, setTab] = useState<"upgrades"|"drip">("upgrades");

  const upgItems = UPGRADES.map(u=>({ ...u, level: upgrades[u.id]||0, cost: getUpgCost(u, upgrades[u.id]||0), canAfford: coins >= getUpgCost(u, upgrades[u.id]||0) }));
  const cosItems = COSMETICS.map(c=>({ ...c, owned: ownedCosmetics.includes(c.id), equipped: Object.values(equippedCosmetics).includes(c.id) }));

  return(
    <div style={{width:"100%",maxWidth:480}}>
      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:0,padding:"0 14px"}}>
        {(["upgrades","drip"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"rgba(168,85,247,0.15)":"transparent",border:`1px solid ${tab===t?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.06)"}`,color:tab===t?"#a855f7":"#555",fontWeight:800,fontSize:11,padding:"7px 0",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",
            borderRadius:t==="upgrades"?"8px 0 0 8px":"0 8px 8px 0"}}>
            {t==="upgrades"?"⚡ Upgrades":"👕 Drip"}
          </button>
        ))}
      </div>

      {/* Strip */}
      <div style={{overflowX:"auto",display:"flex",gap:8,padding:"8px 14px 10px",WebkitOverflowScrolling:"touch" as any}}>
        {tab==="upgrades" ? (
          upgItems.map(u=>(
            <button key={u.id} onClick={()=>onBuyUpgrade(u.id)} style={{
              flex:"0 0 88px",height:96,
              background:u.canAfford?"rgba(245,200,66,0.06)":"rgba(255,255,255,0.02)",
              border:`1px solid ${u.canAfford?"rgba(245,200,66,0.3)":"rgba(255,255,255,0.05)"}`,
              borderRadius:14,padding:"8px 6px",cursor:u.canAfford?"pointer":"not-allowed",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
              opacity:u.canAfford?1:0.5,transition:"all 0.15s",position:"relative",
            }}>
              {u.level>0&&<div style={{position:"absolute",top:4,right:5,background:"rgba(168,85,247,0.8)",borderRadius:4,fontSize:9,fontWeight:900,color:"#fff",padding:"1px 4px"}}>Lv{u.level}</div>}
              <div style={{fontSize:24}}>{u.emoji}</div>
              <div style={{color:"#ccc",fontSize:10,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{u.name}</div>
              <div style={{color:u.canAfford?"#f5c842":"#555",fontSize:11,fontWeight:900}}>💰{fmt(u.cost)}</div>
            </button>
          ))
        ) : (
          cosItems.map(c=>{
            const owned=c.owned; const equipped=c.equipped;
            return(
              <button key={c.id} onClick={()=>owned?onEquipCos(c.id):onBuyCos(c.id)} style={{
                flex:"0 0 88px",height:96,
                background:equipped?"rgba(168,85,247,0.15)":owned?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",
                border:`1px solid ${equipped?"rgba(168,85,247,0.6)":owned?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)"}`,
                borderRadius:14,padding:"8px 6px",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
                transition:"all 0.15s",position:"relative",
              }}>
                {equipped&&<div style={{position:"absolute",top:3,right:4,background:"#a855f7",borderRadius:4,fontSize:8,fontWeight:900,color:"#fff",padding:"1px 4px"}}>ON</div>}
                <div style={{fontSize:26}}>{c.emoji}</div>
                <div style={{color:"#ccc",fontSize:10,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{c.name}</div>
                {owned?(
                  <div style={{color:equipped?"#a855f7":"#22d67a",fontSize:10,fontWeight:900}}>{equipped?"Equipped":"Equip"}</div>
                ):(
                  <div style={{color: coins>=c.cost?"#f5c842":"#555",fontSize:11,fontWeight:900}}>💰{fmt(c.cost)}</div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOME TAB
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab({onPlay}:{onPlay:()=>void}){
  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#e8e8f0",paddingBottom:80,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% -10%,rgba(120,40,200,0.3) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      {/* Hero */}
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"36px 20px 24px"}}>
        <img src="/logo.png" alt="Degen Clicker" style={{width:170,height:170,objectFit:"contain",marginBottom:8,filter:"drop-shadow(0 0 40px rgba(168,85,247,0.5))"}}/>
        <p style={{color:"#9966bb",fontSize:15,marginBottom:24,lineHeight:1.6}}>
          Pick a meme legend · Tap to earn $TOWER<br/>
          Dress your character · Win the USDC pool
        </p>
        <button onClick={onPlay} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",fontWeight:900,fontSize:18,border:"none",borderRadius:18,padding:"18px 52px",cursor:"pointer",boxShadow:"0 0 50px rgba(168,85,247,0.5),0 0 100px rgba(168,85,247,0.2)",letterSpacing:"-0.01em"}}>
          🎮 Play Now — Free
        </button>
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
          {[["💰","$TOWER","Tap to Earn"],["⏱","48hrs","Reset Cycle"],["🏆","Top 10","Win USDC"],["👕","Drip","Dress Your Char"]].map(([e,v,l])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:18}}>{e}</div><div style={{color:"#fff",fontWeight:900,fontSize:16}}>{v}</div><div style={{color:"#555",fontSize:10}}>{l}</div></div>
          ))}
        </div>
      </div>
      {/* Character Strip */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 20px"}}>
        <h2 style={{textAlign:"center",fontSize:14,fontWeight:900,color:"#fff",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>Choose Your Fighter</h2>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
          {CHARACTERS.map(c=>(
            <button key={c.id} onClick={onPlay} style={{flex:"0 0 100px",background:`rgba(${c.glow},0.06)`,border:`1px solid rgba(${c.glow},0.25)`,borderRadius:16,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}}>
              <div style={{width:54,height:54,borderRadius:"50%",overflow:"hidden",border:`2px solid rgba(${c.glow},0.5)`,background:`rgba(${c.glow},0.15)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <img src={c.image} alt={c.name} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";(e.target as HTMLImageElement).parentElement!.innerHTML=`<span style="font-size:30px">${c.emoji}</span>`;}}/>
              </div>
              <div style={{color:"#fff",fontWeight:800,fontSize:11}}>{c.name}</div>
              <div style={{color:`rgb(${c.glow})`,fontSize:9,fontWeight:700,textAlign:"center"}}>{c.ability}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Feature grid */}
      <div style={{position:"relative",zIndex:1,padding:"0 14px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["🔥","Combo Multiplier","Tap fast — up to 20× coins"],["👕","Drip System","Buy hats, glasses, chains & more"],["🤖","Auto-Tappers","Hire helpers to earn while idle"],["🏆","Live Leaderboard","48hr cycles, real USDC prizes"]].map(([e,t,d])=>(
            <div key={t} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 12px"}}>
              <div style={{fontSize:22,marginBottom:6}}>{e}</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:12,marginBottom:4}}>{t}</div>
              <div style={{color:"#555",fontSize:11}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LEADERBOARD TAB
// ─────────────────────────────────────────────────────────────────────────────
function LeaderboardTab({myPlayerId}:{myPlayerId:string}){
  const [players,setPlayers]=useState<LBEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const cd=useCountdown();
  const CHAR_EMOJI:Record<string,string>={pepe:"🐸",gigachad:"💪",trump:"🎩",troll:"🧌",bonk:"🐕"};

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

  const topThree=players.slice(0,3);
  const rest=players.slice(3);

  return(
    <div style={{minHeight:"100vh",background:"#080010",paddingBottom:90,overflowY:"auto"}}>
      {/* Sticky header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(8,0,20,0.98)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"12px 16px",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div>
            <h2 style={{color:"#fff",fontWeight:900,fontSize:17,margin:0}}>🏆 Leaderboard</h2>
            <div style={{color:"#554466",fontSize:10,marginTop:1}}>Season resets every 48hrs — top scores win USDC</div>
          </div>
          <button onClick={load} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>🔄</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22d67a",boxShadow:"0 0 6px #22d67a",animation:"pulse-glow 1s infinite"}}/>
          <span style={{color:"#22d67a",fontSize:10,fontWeight:700}}>LIVE</span>
          <span style={{color:"#554466",fontSize:10,marginLeft:4}}>Resets in</span>
          <span style={{color:"#f5c842",fontWeight:900,fontSize:12,fontVariantNumeric:"tabular-nums"}}>{cd}</span>
        </div>
      </div>

      {loading?(
        <div style={{padding:56,textAlign:"center",color:"#444"}}>⏳ Loading...</div>
      ):players.length===0?(
        <div style={{padding:56,textAlign:"center"}}><div style={{fontSize:52,marginBottom:10}}>🏆</div><div style={{color:"#554466",fontSize:15,fontWeight:700}}>No players yet — be the first!</div></div>
      ):(
        <>
          {/* Podium — top 3 */}
          {topThree.length>0&&(
            <div style={{padding:"16px 12px 10px"}}>
              <div style={{fontSize:10,color:"#554466",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Top Players</div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end",justifyContent:"center"}}>
                {/* 2nd place */}
                {topThree[1]&&(()=>{
                  const p=topThree[1];const lv=getLevel(p.total_score||0);const rank=getRank(lv);const xp=getLevelProgress(p.total_score||0);const isMe=p.wallet_address===myPlayerId;
                  return(
                    <div style={{flex:1,background:"rgba(180,180,180,0.06)",border:`1px solid ${isMe?"rgba(168,85,247,0.4)":"rgba(180,180,180,0.2)"}`,borderRadius:16,padding:"10px 8px",textAlign:"center",marginBottom:0}}>
                      <div style={{fontSize:22,marginBottom:4}}>🥈</div>
                      <div style={{fontSize:20,marginBottom:4}}>{CHAR_EMOJI[p.character]||"🎮"}</div>
                      <div style={{color:"#fff",fontWeight:800,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anonymous"}</div>
                      <div style={{background:`${rank.color}22`,border:`1px solid ${rank.color}44`,borderRadius:5,padding:"2px 5px",fontSize:9,color:rank.color,fontWeight:700,marginBottom:5,display:"inline-block"}}>{rank.emoji} Lv.{lv} {rank.name}</div>
                      <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",marginBottom:4}}><div style={{width:`${xp.pct}%`,height:"100%",background:rank.color,borderRadius:2}}/></div>
                      <div style={{color:"#c0c0c0",fontWeight:900,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                    </div>
                  );
                })()}
                {/* 1st place */}
                {topThree[0]&&(()=>{
                  const p=topThree[0];const lv=getLevel(p.total_score||0);const rank=getRank(lv);const xp=getLevelProgress(p.total_score||0);const isMe=p.wallet_address===myPlayerId;
                  return(
                    <div style={{flex:1,background:"rgba(245,200,66,0.08)",border:`2px solid ${isMe?"rgba(168,85,247,0.6)":"rgba(245,200,66,0.4)"}`,borderRadius:18,padding:"14px 10px",textAlign:"center",boxShadow:"0 0 30px rgba(245,200,66,0.2)",marginBottom:8}}>
                      <div style={{fontSize:26,marginBottom:4}}>👑</div>
                      <div style={{fontSize:24,marginBottom:4}}>{CHAR_EMOJI[p.character]||"🎮"}</div>
                      <div style={{color:"#fff",fontWeight:900,fontSize:13,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anonymous"}</div>
                      <div style={{background:`${rank.color}22`,border:`1px solid ${rank.color}55`,borderRadius:5,padding:"2px 7px",fontSize:10,color:rank.color,fontWeight:800,marginBottom:6,display:"inline-block"}}>{rank.emoji} Lv.{lv} {rank.name}</div>
                      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:5}}><div style={{width:`${xp.pct}%`,height:"100%",background:`linear-gradient(90deg,${rank.color}88,${rank.color})`,borderRadius:2}}/></div>
                      <div style={{color:"#f5c842",fontWeight:900,fontSize:15}}>💰{fmt(p.total_score||0)}</div>
                    </div>
                  );
                })()}
                {/* 3rd place */}
                {topThree[2]&&(()=>{
                  const p=topThree[2];const lv=getLevel(p.total_score||0);const rank=getRank(lv);const xp=getLevelProgress(p.total_score||0);const isMe=p.wallet_address===myPlayerId;
                  return(
                    <div style={{flex:1,background:"rgba(205,127,50,0.06)",border:`1px solid ${isMe?"rgba(168,85,247,0.4)":"rgba(205,127,50,0.2)"}`,borderRadius:16,padding:"10px 8px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>🥉</div>
                      <div style={{fontSize:20,marginBottom:4}}>{CHAR_EMOJI[p.character]||"🎮"}</div>
                      <div style={{color:"#fff",fontWeight:800,fontSize:11,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anonymous"}</div>
                      <div style={{background:`${rank.color}22`,border:`1px solid ${rank.color}44`,borderRadius:5,padding:"2px 5px",fontSize:9,color:rank.color,fontWeight:700,marginBottom:5,display:"inline-block"}}>{rank.emoji} Lv.{lv} {rank.name}</div>
                      <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",marginBottom:4}}><div style={{width:`${xp.pct}%`,height:"100%",background:rank.color,borderRadius:2}}/></div>
                      <div style={{color:"#cd7f32",fontWeight:900,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Ranks 4–100 */}
          {rest.length>0&&(
            <div style={{padding:"0 10px"}}>
              <div style={{fontSize:10,color:"#554466",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingTop:4}}>Full Rankings</div>
              {rest.map((p,i)=>{
                const lv=getLevel(p.total_score||0);
                const rank=getRank(lv);
                const xp=getLevelProgress(p.total_score||0);
                const isMe=p.wallet_address===myPlayerId;
                return(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:9,background:isMe?"rgba(168,85,247,0.08)":"rgba(255,255,255,0.01)",border:`1px solid ${isMe?"rgba(168,85,247,0.25)":"rgba(255,255,255,0.03)"}`,borderRadius:12,padding:"9px 10px",marginBottom:5}}>
                    <div style={{width:24,textAlign:"center",fontSize:11,fontWeight:700,color:"#444",flexShrink:0}}>#{i+4}</div>
                    <div style={{fontSize:16,flexShrink:0}}>{CHAR_EMOJI[p.character]||"🎮"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{color:isMe?"#a855f7":"#ddd",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Anonymous"}{isMe&&" ← You"}</span>
                        <span style={{flexShrink:0,background:`${rank.color}18`,border:`1px solid ${rank.color}33`,borderRadius:4,padding:"1px 5px",fontSize:8,color:rank.color,fontWeight:700}}>{rank.emoji} Lv.{lv} {rank.name}</span>
                      </div>
                      <div style={{height:2,background:"rgba(255,255,255,0.04)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{width:`${xp.pct}%`,height:"100%",background:`linear-gradient(90deg,${rank.color}55,${rank.color})`,borderRadius:2}}/>
                      </div>
                      <div style={{color:"#333",fontSize:8,marginTop:2}}>
                        {fmt(xp.current)} / {fmt(xp.needed)} XP to Lv.{lv+1}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{color:"#f5c842",fontWeight:900,fontSize:12}}>💰{fmt(p.total_score||0)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Rank Ladder */}
      <div style={{margin:"16px 10px 0",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px"}}>
        <div style={{fontSize:10,color:"#554466",marginBottom:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>🪜 Rank Ladder</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {RANKS.map(r=>(
            <div key={r.name} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:36,flexShrink:0,fontSize:9,color:"#333",fontWeight:700}}>Lv.{r.minLevel}</div>
              <div style={{width:20,textAlign:"center",fontSize:14}}>{r.emoji}</div>
              <div style={{flex:1}}>
                <div style={{color:r.color,fontWeight:700,fontSize:11}}>{r.name}</div>
                <div style={{color:"#333",fontSize:9}}>{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL SHOP TAB
// ─────────────────────────────────────────────────────────────────────────────
function FullShopTab({ coins, charId, upgrades, ownedCosmetics, equippedCosmetics, onBuyUpgrade, onBuyCos, onEquipCos }:{
  coins:number;charId:string|null;upgrades:Record<string,number>;ownedCosmetics:string[];equippedCosmetics:Record<string,string>;
  onBuyUpgrade:(id:string)=>void;onBuyCos:(id:string)=>void;onEquipCos:(id:string)=>void;
}){
  const [tab,setTab]=useState<"upgrades"|"drip">("upgrades");
  return(
    <div style={{minHeight:"100vh",background:"#080010",color:"#fff",paddingBottom:80}}>
      <div style={{background:"rgba(8,0,20,0.98)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <h2 style={{fontWeight:900,fontSize:17,margin:0}}>🛒 Shop</h2>
          {charId&&<div style={{marginLeft:"auto",background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:10,padding:"5px 12px",fontSize:14,fontWeight:800,color:"#f5c842"}}>💰 {fmt(coins)}</div>}
        </div>
        <div style={{display:"flex",gap:0}}>
          {(["upgrades","drip"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"rgba(168,85,247,0.15)":"transparent",border:`1px solid ${tab===t?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.06)"}`,color:tab===t?"#a855f7":"#555",fontWeight:800,fontSize:12,padding:"8px 0",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em",
              ...(t==="upgrades"?{borderRadius:"8px 0 0 8px"}:{borderRadius:"0 8px 8px 0"})}}>
              {t==="upgrades"?"⚡ Upgrades":"👕 Drip Shop"}
            </button>
          ))}
        </div>
      </div>
      {!charId?(
        <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><div style={{color:"#554466",fontSize:15,fontWeight:700}}>Pick a character first</div></div>
      ):tab==="upgrades"?(
        <div style={{padding:"12px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {UPGRADES.map(u=>{
              const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
              return(
                <button key={u.id} onClick={()=>onBuyUpgrade(u.id)} disabled={!can} style={{background:can?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.015)",border:`1px solid ${can?"rgba(245,200,66,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:"14px 12px",cursor:can?"pointer":"not-allowed",textAlign:"left",opacity:can?1:0.5,transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <span style={{fontSize:22}}>{u.emoji}</span>
                    <span style={{fontWeight:800,fontSize:13,color:"#fff"}}>{u.name}</span>
                    {lv>0&&<span style={{marginLeft:"auto",background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:5,padding:"1px 6px",fontSize:10,color:"#a855f7",fontWeight:700}}>Lv.{lv}</span>}
                  </div>
                  <div style={{color:"#6b6b8a",fontSize:11,marginBottom:8}}>{u.desc}</div>
                  <div style={{color:can?"#f5c842":"#555",fontWeight:800,fontSize:13}}>💰 {fmt(cost)}</div>
                </button>
              );
            })}
          </div>
        </div>
      ):(
        <div style={{padding:"12px"}}>
          {["hat","glasses","accessory","held"].map(type=>{
            const items=COSMETICS.filter(c=>c.type===type);
            const typeLabel:{[k:string]:string}={hat:"🎩 Hats",glasses:"😎 Glasses",accessory:"📿 Accessories",held:"✊ Held Items"};
            return(
              <div key={type} style={{marginBottom:20}}>
                <div style={{color:"#554466",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{typeLabel[type]}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {items.map(cos=>{
                    const owned=ownedCosmetics.includes(cos.id);
                    const equipped=Object.values(equippedCosmetics).includes(cos.id);
                    const can=coins>=cos.cost;
                    return(
                      <button key={cos.id} onClick={()=>owned?onEquipCos(cos.id):onBuyCos(cos.id)} style={{background:equipped?"rgba(168,85,247,0.12)":owned?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${equipped?"rgba(168,85,247,0.5)":owned?"rgba(255,255,255,0.1)":can?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)"}`,borderRadius:14,padding:"14px 12px",cursor:"pointer",textAlign:"left",opacity:(!owned&&!can)?0.5:1,transition:"all 0.15s"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                          <span style={{fontSize:24}}>{cos.emoji}</span>
                          <span style={{fontWeight:800,fontSize:13,color:"#fff",flex:1}}>{cos.name}</span>
                          <span style={{flexShrink:0,background:`${RARITY_COLOR[cos.rarity]}22`,border:`1px solid ${RARITY_COLOR[cos.rarity]}44`,borderRadius:4,padding:"1px 5px",fontSize:8,color:RARITY_COLOR[cos.rarity],fontWeight:700,textTransform:"uppercase"}}>{cos.rarity}</span>
                        </div>
                        {owned?(
                          <div style={{color:equipped?"#a855f7":"#22d67a",fontWeight:800,fontSize:13}}>{equipped?"✓ Equipped — Tap to remove":"Tap to equip"}</div>
                        ):(
                          <div style={{color:can?"#f5c842":"#555",fontWeight:800,fontSize:13}}>💰 {fmt(cos.cost)}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN GAME COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TapGame() {
  const [activeTab, setActiveTab] = useState<"home"|"play"|"shop"|"leaderboard">("home");
  const [screen, setScreen] = useState<"select"|"game">("select");
  const [charId, setCharId] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingChar, setPendingChar] = useState<string|null>(null);
  const [playerId, setPlayerId] = useState("");
  const [username, setUsername] = useState("");

  // game state
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
  const [charPulse, setCharPulse] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [upgrades, setUpgrades] = useState<Record<string,number>>({});
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string,string>>({});
  const [critFlash, setCritFlash] = useState(false);
  const [floatingText, setFloatingText] = useState<string|null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string|null>(null);

  const pidRef = useRef(0);
  const saveRef = useRef<SaveData|null>(null);

  const char = CHARACTERS.find(c=>c.id===charId);

  useEffect(()=>{setPlayerId(getPlayerId());setUsername(getPlayerName());},[]);

  function tryStart(id:string){
    if(!getPlayerName()){setPendingChar(id);setShowModal(true);}
    else startGame(id,getPlayerName());
  }
  function onUsername(name:string){setPlayerName(name);setUsername(name);setShowModal(false);if(pendingChar)startGame(pendingChar,name);}

  function startGame(id:string,name:string){
    const s=loadSave(id);
    setCharId(id);setCoins(s.coins);setTotalEarned(s.totalEarned);setTotalTaps(s.totalTaps);
    setUpgrades(s.upgrades);setOwnedCosmetics(s.ownedCosmetics||[]);setEquippedCosmetics(s.equippedCosmetics||{});
    const mx=1000+(s.upgrades["energy_max"]||0)*200;setMaxEnergy(mx);setEnergy(mx);
    setScreen("game");saveRef.current=s;setActiveTab("play");
    syncDB(getPlayerId(),name,id,s.totalEarned,s.totalTaps,s.equippedCosmetics||{},s.ownedCosmetics||[]);
  }

  // Save + sync
  const doSave=useCallback(()=>{
    if(!charId)return;
    const s:SaveData={charId:charId!,coins,totalEarned,totalTaps,level:getLevel(totalEarned),upgrades,highScore:Math.max(coins,saveRef.current?.highScore||0),ownedCosmetics,equippedCosmetics};
    persistSave(s);saveRef.current=s;
    syncDB(playerId||getPlayerId(),username||getPlayerName(),charId!,totalEarned,totalTaps,equippedCosmetics,ownedCosmetics);
  },[charId,coins,totalEarned,totalTaps,upgrades,ownedCosmetics,equippedCosmetics,playerId,username]);

  useEffect(()=>{
    if(screen!=="game"||!charId)return;
    const id=setInterval(doSave,8000);
    return()=>clearInterval(id);
  },[screen,charId,doSave]);

  // Auto-tappers
  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const rate=((upgrades["helper_1"]||0)*1+(upgrades["helper_2"]||0)*3+(upgrades["helper_3"]||0)*10+(upgrades["helper_4"]||0)*30)*(specialActive?5:1);
    if(rate<=0)return;
    const id=setInterval(()=>{const pt=rate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt)},50);
    return()=>clearInterval(id);
  },[upgrades,activeTab,screen,char,specialActive]);

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
    const id=setInterval(()=>setComboTimer(t=>{if(t<=0){setCombo(1);return 0;}return t-0.05;}),50);
    return()=>clearInterval(id);
  },[activeTab,screen]);

  // Special timer
  useEffect(()=>{
    if(!specialActive)return;
    const id=setInterval(()=>setSpecialTimer(t=>{if(t<=0){setSpecialActive(false);return 0;}return t-0.1;}),100);
    return()=>clearInterval(id);
  },[specialActive]);

  // Achievement checker
  const checkAchievements=useCallback((taps:number,earned:number)=>{
    const checks=[
      {id:"first_tap",text:"First Tap! 👆",cond:taps>=1},
      {id:"taps_100",text:"100 Taps! 💯",cond:taps>=100},
      {id:"taps_1000",text:"1,000 Taps! 🔥",cond:taps>=1000},
      {id:"coins_1000",text:"First 1K Coins! 💰",cond:earned>=1000},
      {id:"coins_10000",text:"10K Earned! 🤑",cond:earned>=10000},
      {id:"coins_1m",text:"MILLIONAIRE! 💎",cond:earned>=1000000},
    ];
    checks.forEach(c=>{
      if(c.cond&&!achievements.includes(c.id)){
        setAchievements(a=>[...a,c.id]);
        setNewAchievement(c.text);
        setTimeout(()=>setNewAchievement(null),3000);
      }
    });
  },[achievements]);

  // Tap handler
  const handleTap=useCallback((e:React.MouseEvent|React.TouchEvent)=>{
    if(!char)return;
    e.preventDefault();
    if(energy<=0)return;

    let tx=0,ty=0;
    if("touches" in e&&e.touches.length>0){tx=e.touches[0].clientX;ty=e.touches[0].clientY;}
    else if("clientX" in e){tx=e.clientX;ty=e.clientY;}

    // Calculate coins
    const tapPow=(upgrades["tap_power"]||0);
    const multiTap=(upgrades["multi_tap"]||0);
    const critChance=((upgrades["crit_chance"]||0)*0.1);
    const tapBase=(char.baseCoins+tapPow)*(1+multiTap);
    const specMult=specialActive?char.specialMultiplier:1;
    const isCrit=Math.random()<critChance;

    let earned=tapBase*combo*specMult*(isCrit?5:1);
    earned=char.passive(earned);
    const newCount=tapCount+1;
    setTapCount(newCount);

    // Trump special
    if(char.id==="trump"&&newCount%50===0){earned*=10;spawn(tx,ty,"💼 DEAL! 10×","#f5c842",true);}
    // Troll chaos
    if(specialActive&&char.id==="troll")earned*=(1+Math.random()*14);
    earned=Math.max(0.1,earned);

    // Crit flash
    if(isCrit){setCritFlash(true);setTimeout(()=>setCritFlash(false),150);spawn(tx,ty,"CRIT! ⚡","#ff4444",true);}

    spawn(tx,ty,`+${fmt(Math.round(earned*10)/10)}`,coinColor(earned),false);
    setCoins(c=>c+earned);
    setTotalEarned(t=>{
      const nt=t+earned;
      checkAchievements(newCount,nt);
      return nt;
    });
    setTotalTaps(t=>t+1);

    const energyCost=specialActive&&char.id==="bonk"?0:1;
    setEnergy(e=>Math.max(0,e-energyCost));

    const cspeed=upgrades["combo_speed"]?1+upgrades["combo_speed"]*0.2:1;
    const gbonus=char.id==="gigachad"?2:1;
    const maxCombo=char.comboMax+(upgrades["combo_max"]||0)*5+(char.id==="gigachad"?(upgrades["combo_speed"]||0)*2:0);
    setCombo(c=>Math.min(maxCombo,c+0.3*cspeed*gbonus));
    setComboTimer(0.8);
    setSpecialCharge(s=>Math.min(100,s+(upgrades["special_cd"]?3:2)));

    setCharPulse(true);
    setTimeout(()=>setCharPulse(false),120);
    if(earned>tapBase*4){setShaking(true);setTimeout(()=>setShaking(false),200);}
  },[char,energy,combo,tapCount,upgrades,specialActive,checkAchievements]);

  // Launch special
  const launchSpecial=useCallback(()=>{
    if(!char||specialCharge<100||specialActive)return;
    setSpecialActive(true);setSpecialCharge(0);setSpecialTimer(char.specialDuration);
    if(char.id==="gigachad")setCombo(char.comboMax);
    for(let i=0;i<10;i++) setTimeout(()=>spawn(window.innerWidth/2+(Math.random()-0.5)*240,window.innerHeight/2+(Math.random()-0.5)*200,["💥","⚡","🔥","✨","💫","🚀","💎","🌙"][Math.floor(Math.random()*8)],char.color,true),i*60);
  },[char,specialCharge,specialActive]);

  // Buy upgrade
  const buyUpgrade=useCallback((id:string)=>{
    const u=UPGRADES.find(u=>u.id===id)!;
    const lv=upgrades[id]||0,cost=getUpgCost(u,lv);
    if(coins<cost)return;
    setCoins(c=>c-cost);
    setUpgrades(u=>({...u,[id]:(u[id]||0)+1}));
    if(id==="energy_max")setMaxEnergy(1000+((upgrades["energy_max"]||0)+1)*200);
    setFloatingText(`${u.emoji} ${u.name} upgraded!`);
    setTimeout(()=>setFloatingText(null),1500);
  },[coins,upgrades]);

  // Buy cosmetic
  const buyCosmetic=useCallback((id:string)=>{
    const cos=COSMETICS.find(c=>c.id===id)!;
    if(coins<cos.cost||ownedCosmetics.includes(id))return;
    setCoins(c=>c-cos.cost);
    setOwnedCosmetics(o=>[...o,id]);
    // Auto-equip on purchase
    equipCosmetic(id);
    setFloatingText(`${cos.emoji} ${cos.name} equipped!`);
    setTimeout(()=>setFloatingText(null),1500);
  },[coins,ownedCosmetics]);

  // Equip/unequip cosmetic
  const equipCosmetic=useCallback((id:string)=>{
    const cos=COSMETICS.find(c=>c.id===id)!;
    setEquippedCosmetics(eq=>{
      const already=Object.values(eq).includes(id);
      if(already){
        // unequip
        const next={...eq};
        Object.keys(next).forEach(k=>{ if(next[k]===id)delete next[k]; });
        return next;
      } else {
        return {...eq,[cos.type]:id};
      }
    });
  },[]);

  // Helpers
  function spawn(x:number,y:number,v:string,color:string,big:boolean){
    const id=pidRef.current++;
    setParticles(p=>[...p.slice(-30),{id,x,y,value:v,color,big}]);
    setTimeout(()=>setParticles(p=>p.filter(pp=>pp.id!==id)),1000);
  }
  function coinColor(a:number){ if(a>=100)return"#ff4444";if(a>=50)return"#f5c842";if(a>=10)return"#22d67a";if(a>=3)return"#a855f7";return"#e8e8f0"; }

  function handleTab(t:string){
    setActiveTab(t as any);
  }

  const level=getLevel(totalEarned);
  const rank=getRank(level);
  const xpProgress=getLevelProgress(totalEarned);
  const nextRank=getNextRank(level);
  const autoRate=(upgrades["helper_1"]||0)*1+(upgrades["helper_2"]||0)*3+(upgrades["helper_3"]||0)*10+(upgrades["helper_4"]||0)*30;

  return(
    <div style={{background:"#080010",minHeight:"100vh",position:"relative"}}>

      {showModal&&<UsernameModal onConfirm={onUsername}/>}

      {/* Achievement popup */}
      {newAchievement&&(
        <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:16,padding:"10px 20px",color:"#fff",fontWeight:900,fontSize:14,boxShadow:"0 0 40px rgba(168,85,247,0.6)",whiteSpace:"nowrap",animation:"achieveSlide 0.3s ease-out"}}>
          🏅 {newAchievement}
        </div>
      )}

      {/* Crit flash overlay */}
      {critFlash&&<div style={{position:"fixed",inset:0,background:"rgba(255,50,50,0.08)",zIndex:150,pointerEvents:"none",animation:"critPop 0.15s ease-out"}}/>}

      {/* HOME */}
      {activeTab==="home"&&<HomeTab onPlay={()=>setActiveTab("play")}/>}

      {/* LEADERBOARD */}
      {activeTab==="leaderboard"&&<LeaderboardTab myPlayerId={playerId}/>}

      {/* SHOP */}
      {activeTab==="shop"&&<FullShopTab coins={coins} charId={charId} upgrades={upgrades} ownedCosmetics={ownedCosmetics} equippedCosmetics={equippedCosmetics} onBuyUpgrade={buyUpgrade} onBuyCos={buyCosmetic} onEquipCos={equipCosmetic}/>}

      {/* PLAY */}
      {activeTab==="play"&&(
        <>
          {/* Character Select */}
          {screen==="select"&&(
            <div style={{minHeight:"100vh",background:"#080010",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px 96px",position:"relative"}}>
              <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 40%,rgba(120,40,200,0.2) 0%,transparent 65%)",pointerEvents:"none"}}/>
              <div style={{textAlign:"center",marginBottom:24,position:"relative",zIndex:1}}>
                <img src="/logo.png" alt="Degen Clicker" style={{width:130,height:130,objectFit:"contain",marginBottom:4,filter:"drop-shadow(0 0 30px rgba(168,85,247,0.5))"}}/>
                <p style={{color:"#9955cc",fontSize:13}}>Choose your legend</p>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:600,position:"relative",zIndex:1}}>
                {CHARACTERS.map(c=>{
                  const s=loadSave(c.id);
                  return(
                    <button key={c.id} onClick={()=>tryStart(c.id)} style={{width:108,background:`rgba(${c.glow},0.04)`,border:`2px solid rgba(${c.glow},0.25)`,borderRadius:18,cursor:"pointer",padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:7,transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgb(${c.glow})`;e.currentTarget.style.background=`rgba(${c.glow},0.12)`;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 40px rgba(${c.glow},0.4)`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=`rgba(${c.glow},0.25)`;e.currentTarget.style.background=`rgba(${c.glow},0.04)`;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                      <div style={{width:66,height:66,borderRadius:"50%",overflow:"hidden",border:`2px solid rgba(${c.glow},0.6)`,background:`rgba(${c.glow},0.18)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <img src={c.image} alt={c.name} style={{width:62,height:62,objectFit:"cover",borderRadius:"50%"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";(e.target as HTMLImageElement).parentElement!.innerHTML=`<span style="font-size:38px">${c.emoji}</span>`;}}/>
                      </div>
                      <div style={{color:"#fff",fontWeight:800,fontSize:13}}>{c.name}</div>
                      <div style={{background:`rgba(${c.glow},0.15)`,border:`1px solid rgba(${c.glow},0.4)`,borderRadius:5,padding:"2px 7px",fontSize:9,color:`rgb(${c.glow})`,fontWeight:700,textAlign:"center"}}>{c.ability}</div>
                      {s.totalEarned>0&&<div style={{fontSize:9,color:"#444"}}>💰 {fmt(s.totalEarned)}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Game */}
          {screen==="game"&&char&&(
            <div style={{minHeight:"100vh",background:"#080010",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none",paddingBottom:80}} className={shaking?"shake":""}>
              <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse at 50% 55%,rgba(${char.glow},${specialActive?0.3:0.14}) 0%,transparent 60%)`,transition:"background 0.5s"}}/>

              {/* Top bar */}
              <div style={{width:"100%",maxWidth:480,padding:"10px 14px 4px",zIndex:10,position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <button onClick={()=>setScreen("select")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"#555",borderRadius:8,padding:"6px 11px",cursor:"pointer",fontSize:12}}>⬅</button>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:19,fontWeight:900,color:"#f5c842"}}>💰 {fmt(coins)}</div>
                    <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"0.08em"}}>$TOWER</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:rank.color,fontWeight:800,fontSize:12}}>{rank.emoji} {rank.name}</div>
                    <div style={{color:"#444",fontSize:9}}>Level {level}</div>
                  </div>
                </div>
                {/* XP Progress bar */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{fontSize:9,color:"#444",fontWeight:700,whiteSpace:"nowrap"}}>Lv.{level}</div>
                  <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}88,${rank.color})`,borderRadius:2,transition:"width 0.3s"}}/>
                  </div>
                  <div style={{fontSize:9,color:"#444",whiteSpace:"nowrap"}}>
                    {fmt(xpProgress.current)}/{fmt(xpProgress.needed)}
                    {nextRank&&level<nextRank.minLevel&&<span style={{color:nextRank.color,marginLeft:4}}>→{nextRank.emoji}</span>}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{width:"100%",maxWidth:480,padding:"0 14px 6px",display:"flex",gap:6,zIndex:10,position:"relative"}}>
                <div style={{flex:1,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"5px 8px",textAlign:"center"}}>
                  <div style={{color:"#444",fontSize:8,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:1}}>Total</div>
                  <div style={{color:"#ccc",fontWeight:800,fontSize:11}}>💰{fmt(totalEarned)}</div>
                </div>
                <div style={{flex:1,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"5px 8px",textAlign:"center"}}>
                  <div style={{color:"#444",fontSize:8,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:1}}>Taps</div>
                  <div style={{color:"#ccc",fontWeight:800,fontSize:11}}>👆{fmt(totalTaps)}</div>
                </div>
                {autoRate>0&&<div style={{flex:1,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"5px 8px",textAlign:"center"}}>
                  <div style={{color:"#444",fontSize:8,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:1}}>Auto</div>
                  <div style={{color:"#22d67a",fontWeight:800,fontSize:11}}>🤖{autoRate}/s</div>
                </div>}
                {combo>1.5&&<div style={{flex:1,background:`rgba(${char.glow},0.12)`,border:`1px solid rgba(${char.glow},0.3)`,borderRadius:10,padding:"5px 8px",textAlign:"center",animation:"pulse-glow 0.5s infinite"}}>
                  <div style={{color:"#444",fontSize:8,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:1}}>Combo</div>
                  <div style={{color:`rgb(${char.glow})`,fontWeight:900,fontSize:12}}>×{(Math.floor(combo*10)/10).toFixed(1)}</div>
                </div>}
              </div>

              {/* Special active banner */}
              {specialActive&&(
                <div style={{position:"relative",zIndex:10,background:`linear-gradient(135deg,rgb(${char.glow}),#ff00cc)`,borderRadius:20,padding:"3px 20px",marginBottom:4,fontSize:12,fontWeight:900,color:"#fff",boxShadow:`0 0 30px rgba(${char.glow},0.8)`,animation:"pulse-glow 0.3s infinite"}}>
                  ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
                </div>
              )}

              {/* Floating toast */}
              {floatingText&&(
                <div style={{position:"relative",zIndex:10,background:"rgba(34,214,122,0.15)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:20,padding:"3px 18px",marginBottom:4,fontSize:11,fontWeight:800,color:"#22d67a",animation:"achieveSlide 0.3s ease-out"}}>
                  {floatingText}
                </div>
              )}

              {/* ─── CHARACTER SHOWCASE ─── */}
              <div style={{position:"relative",zIndex:10,marginBottom:6,touchAction:"none"}} onMouseDown={handleTap} onTouchStart={handleTap}>
                <CharacterShowcase char={char} equippedCosmetics={equippedCosmetics} specialActive={specialActive} charPulse={charPulse} comboLevel={Math.floor(combo)}/>
                {totalTaps<5&&<div style={{position:"absolute",bottom:-28,left:"50%",transform:"translateX(-50%)",fontSize:11,color:"#554466",fontWeight:600,whiteSpace:"nowrap",animation:"float 1.5s ease-in-out infinite"}}>TAP ME 👆</div>}
              </div>

              {/* Energy + Special bars */}
              <div style={{width:"100%",maxWidth:340,padding:"14px 20px 4px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:"#444",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>⚡ Energy</span>
                  <span style={{fontSize:9,color:"#444"}}>{Math.floor(energy)}/{maxEnergy}</span>
                </div>
                <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,width:`${(energy/maxEnergy)*100}%`,background:(energy/maxEnergy)>0.5?`linear-gradient(90deg,rgb(${char.glow}),rgba(${char.glow},0.7))`:energy/maxEnergy>0.2?"linear-gradient(90deg,#ffaa00,#ffcc44)":"linear-gradient(90deg,#ff3355,#ff6688)",transition:"width 0.1s",boxShadow:`0 0 8px rgba(${char.glow},0.6)`}}/>
                </div>
              </div>

              {/* Special charge */}
              <div style={{width:"100%",maxWidth:340,padding:"6px 20px 4px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:"#444",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>✨ {char.specialName}</span>
                  <span style={{fontSize:9,color:specialCharge>=100?`rgb(${char.glow})`:"#444"}}>{Math.floor(specialCharge)}%</span>
                </div>
                <div onClick={launchSpecial} style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden",cursor:specialCharge>=100&&!specialActive?"pointer":"default",border:specialCharge>=100&&!specialActive?`1px solid rgba(${char.glow},0.6)`:"1px solid transparent",boxShadow:specialCharge>=100?`0 0 14px rgba(${char.glow},0.5)`:"none"}}>
                  <div style={{height:"100%",borderRadius:4,width:`${specialCharge}%`,background:`linear-gradient(90deg,rgba(${char.glow},0.7),rgb(${char.glow}))`,transition:"width 0.15s"}}/>
                </div>
                {specialCharge>=100&&!specialActive&&(
                  <button onClick={launchSpecial} style={{width:"100%",marginTop:7,padding:"9px",background:`linear-gradient(135deg,rgba(${char.glow},0.8),rgb(${char.glow}))`,border:"none",borderRadius:10,color:"#fff",fontWeight:900,fontSize:13,cursor:"pointer",boxShadow:`0 0 24px rgba(${char.glow},0.7)`,animation:"pulse-glow 0.5s infinite"}}>
                    ✨ {char.specialName.toUpperCase()} — ACTIVATE!
                  </button>
                )}
              </div>

              {/* Quick Buy Strip */}
              <div style={{width:"100%",maxWidth:480,marginTop:6,position:"relative",zIndex:10}}>
                <QuickBuyStrip coins={coins} upgrades={upgrades} ownedCosmetics={ownedCosmetics} equippedCosmetics={equippedCosmetics} onBuyUpgrade={buyUpgrade} onBuyCos={buyCosmetic} onEquipCos={equipCosmetic}/>
              </div>

              {/* Particles */}
              <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:50}}>
                {particles.map(p=>(
                  <div key={p.id} style={{position:"absolute",left:p.x,top:p.y,color:p.color,fontWeight:900,fontSize:p.big?18:13,textShadow:`0 0 10px ${p.color}`,pointerEvents:"none",animation:"coinFloat 1s ease-out forwards",whiteSpace:"nowrap",transform:"translate(-50%,-50%)"}}>
                    {p.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BottomBar active={activeTab} onTab={handleTab}/>

      <style>{`
        @keyframes coinFloat { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,calc(-50% - 90px)) scale(0.6)} }
        @keyframes orbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbit2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float3d { 0%,100%{transform:rotateY(-6deg) rotateX(4deg) translateY(0)} 50%{transform:rotateY(6deg) rotateX(-4deg) translateY(-10px)} }
        @keyframes comboRing { 0%{opacity:0.4;transform:scale(1)} 100%{opacity:0.9;transform:scale(1.05)} }
        @keyframes specialPulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes pulse-glow { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes float { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
        @keyframes achieveSlide { 0%{opacity:0;transform:translateX(-50%) translateY(-10px)} 100%{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes critPop { 0%{opacity:0.8} 100%{opacity:0} }
        .shake { animation: shakeFx 0.2s ease-out; }
        @keyframes shakeFx { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-4px,2px)} 40%{transform:translate(4px,-2px)} 60%{transform:translate(-2px,4px)} 80%{transform:translate(2px,-1px)} }
        * { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.3); border-radius:2px; }
      `}</style>
    </div>
  );
}
