"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const FEATURES = [
  { emoji:"🔥", title:"Combo Multiplier",   desc:"Tap fast to stack up to 20× multiplier. Drop it and start over" },
  { emoji:"🤖", title:"Auto-Tappers",       desc:"Hire Bot Armies, Whale Wallets & Hedge Funds to earn while you sleep" },
  { emoji:"⚡", title:"Upgrades",            desc:"Power up tap strength, energy, crit chance and more" },
  { emoji:"👑", title:"Rank Ladder",        desc:"Earn $TOWER → gain XP → level up → unlock Gigachad, Sigma, God Tier ranks" },
  { emoji:"🏆", title:"48hr Seasons",       desc:"Leaderboard resets every 48 hours. Top players win USDC" },
  { emoji:"🎮", title:"5 Characters",       desc:"Pepe, Gigachad, Trump, Trollface, Bonk — each with unique specials" },
];

function Coins() {
  const coins = ["💰","🪙","💎","⚡","🔥","🚀","👑","💸","🎯","✨"];
  const [items] = useState(() =>
    Array.from({length:14}, (_,i) => ({
      id: i,
      emoji: coins[i % coins.length],
      x: Math.random()*100,
      delay: Math.random()*6,
      dur: 5 + Math.random()*5,
      size: 14 + Math.random()*16,
    }))
  );
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {items.map(c=>(
        <div key={c.id} style={{
          position:"absolute", left:`${c.x}%`, bottom:-40,
          fontSize:c.size, opacity:0.12,
          animation:`floatCoin ${c.dur}s ${c.delay}s linear infinite`,
        }}>{c.emoji}</div>
      ))}
    </div>
  );
}

export default function SplashPage() {
  const [glow, setGlow] = useState("168,85,247");
  const glows = ["76,175,80","224,184,122","59,130,246","168,85,247","232,133,58"];
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { i=(i+1)%glows.length; setGlow(glows[i]); }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight:"100vh", background:"#080010", color:"#e8e8f0",
      fontFamily:"system-ui,-apple-system,sans-serif", overflowX:"hidden",
    }}>
      <Coins/>

      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background:`radial-gradient(ellipse at 50% 30%, rgba(${glow},0.18) 0%, transparent 60%)`,
        transition:"background 1.2s ease",
      }}/>

      {/* NAV */}
      <nav style={{
        position:"sticky", top:0, zIndex:40,
        background:"rgba(8,0,16,0.92)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"12px 20px", display:"flex", alignItems:"center", gap:12,
      }}>
        <img src="/logo.png" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
          style={{height:34,width:34,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(168,85,247,0.5))"}}/>
        <span style={{fontWeight:900,fontSize:17,color:"#fff",letterSpacing:"-0.02em"}}>DEGEN CLICKER</span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <Link href="/leaderboard" style={{color:"#555",fontSize:13,textDecoration:"none",padding:"6px 12px",fontWeight:600}}>
            🏆 Ranks
          </Link>
          <Link href="/login" style={{
            color:"#888",fontSize:13,textDecoration:"none",
            border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,
            padding:"7px 14px",fontWeight:700,background:"rgba(255,255,255,0.03)",
          }}>
            Log in
          </Link>
          <Link href="/signup" style={{
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            color:"#fff",fontSize:13,fontWeight:800,
            textDecoration:"none",borderRadius:10,padding:"8px 16px",
            boxShadow:"0 0 20px rgba(168,85,247,0.4)",
          }}>
            Sign up free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position:"relative",zIndex:1,
        textAlign:"center",padding:"70px 20px 50px",
        maxWidth:680,margin:"0 auto",
      }}>
        <div style={{
          display:"inline-flex",alignItems:"center",gap:6,
          background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.25)",
          borderRadius:20,padding:"5px 14px",fontSize:11,color:"#a855f7",
          fontWeight:700,marginBottom:28,textTransform:"uppercase",letterSpacing:"0.1em",
        }}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#22d67a",display:"inline-block",boxShadow:"0 0 6px #22d67a",animation:"pulseDot 1s infinite"}}/>
          Free to Play · Tap to Earn · Win USDC
        </div>

        <h1 style={{
          fontSize:"clamp(40px,9vw,78px)",fontWeight:900,lineHeight:1.0,
          letterSpacing:"-0.04em",margin:"0 0 20px",
          background:"linear-gradient(135deg,#ffffff 0%,#c4b5fd 50%,#a855f7 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
        }}>
          TAP YOUR WAY<br/>TO THE TOP
        </h1>
        <p style={{color:"#6644aa",fontSize:"clamp(14px,3.5vw,18px)",lineHeight:1.6,marginBottom:36,maxWidth:500,margin:"0 auto 36px"}}>
          Pick your legend. Tap to earn $TOWER. Build auto-tappers.<br/>
          Compete every 48 hours for real USDC prizes.
        </p>

        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
          <Link href="/signup" style={{
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            color:"#fff",fontWeight:900,fontSize:16,
            textDecoration:"none",borderRadius:16,padding:"16px 36px",
            boxShadow:"0 0 50px rgba(168,85,247,0.5),0 0 100px rgba(168,85,247,0.15)",
            letterSpacing:"-0.01em",display:"inline-block",
          }}>
            🚀 Play Free
          </Link>
          <Link href="/leaderboard" style={{
            background:"rgba(255,255,255,0.04)",
            color:"#ccc",fontWeight:700,fontSize:15,
            textDecoration:"none",borderRadius:16,padding:"16px 28px",
            border:"1px solid rgba(255,255,255,0.1)",display:"inline-block",
          }}>
            🏆 Leaderboard
          </Link>
        </div>

        <div style={{display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap"}}>
          {[["🎮","Free to Play"],["⏱","48hr Seasons"],["💰","Real USDC Prizes"],["🤖","Auto-Tappers"]].map(([e,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:2}}>{e}</div>
              <div style={{color:"#444",fontSize:11,fontWeight:700}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{position:"relative",zIndex:1,padding:"0 14px 40px",maxWidth:560,margin:"0 auto"}}>
        <div style={{
          fontSize:10,color:"#332244",fontWeight:700,
          textTransform:"uppercase",letterSpacing:"0.1em",
          textAlign:"center",marginBottom:16,
        }}>Everything you need to degen</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{
              background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:16,padding:"14px 12px",
            }}>
              <div style={{fontSize:24,marginBottom:7}}>{f.emoji}</div>
              <div style={{color:"#ddd",fontWeight:800,fontSize:12,marginBottom:4}}>{f.title}</div>
              <div style={{color:"#3a2a4a",fontSize:11,lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{position:"relative",zIndex:1,textAlign:"center",padding:"32px 20px 60px"}}>
        <div style={{
          maxWidth:420,margin:"0 auto",
          background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.06))",
          border:"1px solid rgba(168,85,247,0.2)",
          borderRadius:24,padding:"32px 24px",
          boxShadow:"0 0 80px rgba(168,85,247,0.1)",
        }}>
          <div style={{fontSize:44,marginBottom:12}}>🏆</div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:20,marginBottom:8,letterSpacing:"-0.02em"}}>
            Ready to degen?
          </h2>
          <p style={{color:"#553366",fontSize:13,marginBottom:22,lineHeight:1.6}}>
            Create your free account in 10 seconds.<br/>No wallet required to start.
          </p>
          <Link href="/signup" style={{
            display:"block",
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            color:"#fff",fontWeight:900,fontSize:16,
            textDecoration:"none",borderRadius:14,padding:"15px",
            boxShadow:"0 0 40px rgba(168,85,247,0.5)",marginBottom:12,
          }}>
            🚀 Create Free Account
          </Link>
          <div style={{color:"#332244",fontSize:12}}>
            Already have an account?{" "}
            <Link href="/login" style={{color:"#7c55cc",textDecoration:"none",fontWeight:700}}>Log in</Link>
          </div>
        </div>
      </section>

      <footer style={{
        position:"relative",zIndex:1,
        borderTop:"1px solid rgba(255,255,255,0.05)",
        padding:"20px",textAlign:"center",
        color:"#2a1a3a",fontSize:11,
      }}>
        Degen Clicker · Tap to earn · Win USDC every 48 hours
      </footer>

      <style>{`
        @keyframes floatCoin { 0%{transform:translateY(0) rotate(0deg);opacity:0.12} 50%{opacity:0.18} 100%{transform:translateY(-110vh) rotate(360deg);opacity:0} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
