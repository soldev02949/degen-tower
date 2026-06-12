"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Zap, ExternalLink } from "lucide-react";
import StarField from "@/components/StarField";

const TOKEN_CA = "AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf";

const LINKS = [
  { emoji: "🎮", label: "Play Now",       href: "https://degen-tower.vercel.app/game",          color: "#22d67a" },
  { emoji: "✈️", label: "Telegram",       href: "https://t.me/degenclicker",                    color: "#229ED9" },
  { emoji: "📢", label: "Announcements",  href: "https://t.me/degenclickerupdates",              color: "#229ED9" },
  { emoji: "𝕏",  label: "Twitter / X",   href: "https://x.com/degenclickersol",                 color: "#fff" },
  { emoji: "🪙", label: "Token CA",       href: `https://solscan.io/token/${TOKEN_CA}`,          color: "#9945FF" },
];

const FEATURES = [
  {
    emoji: "👆", title: "Tap to Earn",
    desc: "Every tap earns $TOWER coins. The faster you tap, the more you earn. Simple as that.",
  },
  {
    emoji: "🔥", title: "Combo Multiplier",
    desc: "Tap continuously to build your combo multiplier — up to 20×. Stop tapping and it resets. Milestone toasts pop at 5×, 10×, 15×, and 20× with a sound effect.",
  },
  {
    emoji: "⚡", title: "Upgrades",
    desc: "Spend $TOWER in the Shop to upgrade Tap Power, Energy Capacity, Crit Chance, Crit Multiplier, and more. Each upgrade makes future earning faster.",
  },
  {
    emoji: "🤖", title: "Auto-Tappers",
    desc: "Hire Bot Armies, Whale Wallets, and Hedge Funds that generate $TOWER passively while you're idle — or even while you sleep.",
  },
  {
    emoji: "👑", title: "Rank Ladder",
    desc: "Earn $TOWER to gain XP and level up your rank: Degen → Pepe → Rare Pepe → Whale → God Tier. Higher ranks unlock new characters and bigger bonuses.",
  },
  {
    emoji: "🏆", title: "48hr Seasons",
    desc: "The leaderboard resets every 48 hours. At the end of each season, the top 20 players split the USDC reward pool based on their final position.",
  },
  {
    emoji: "💰", title: "Reward Pool",
    desc: "A real USDC prize pool grows throughout each season. The current pool is displayed live on the homepage. Win big by staying on top of the leaderboard.",
  },
  {
    emoji: "🧭", title: "Daily Quests",
    desc: "Six daily quests refresh every 24 hours — Tap 500× today, Reach floor 20, Build a 10× combo, and more. Complete them for bonus $TOWER on top of regular play.",
  },
  {
    emoji: "🗓️", title: "Login Streaks",
    desc: "Log in daily to build your streak. A 7-day streak unlocks exclusive streak bonuses. Your longest streak is tracked on your profile.",
  },
  {
    emoji: "✨", title: "Prestige",
    desc: "Reach max rank and prestige to reset your progress in exchange for a permanent bonus multiplier. Prestige players earn faster every run.",
  },
  {
    emoji: "🎁", title: "Referral Program",
    desc: "Share your unique referral link. When a friend signs up using it, you both get a 500 $TOWER bonus instantly.",
  },
  {
    emoji: "👤", title: "Player Profiles",
    desc: "Every player has a public profile at /u/username showing their rank, character, total score, games played, and referral code.",
  },
  {
    emoji: "😄", title: "In-Game Emotes",
    desc: "React in real time with 6 emotes — GG, 🔥, 💀, 🤡, 🌙, 🦍. Other players see your emotes appear during play.",
  },
  {
    emoji: "🔔", title: "Push Notifications",
    desc: "Enable browser push notifications to get alerted when a season is ending, when you have rewards to claim, or for daily quest reminders.",
  },
  {
    emoji: "🔊", title: "Sound FX",
    desc: "Tap sounds, combo sounds, crit sounds, level-up fanfares, and optional background music. Volume slider and mute toggle built into the game header.",
  },
  {
    emoji: "📱", title: "Mobile PWA",
    desc: "Install Degen Clicker to your home screen for the best mobile experience. Tap vibration feedback included.",
  },
];

const CHARACTERS = [
  { emoji: "🐸", name: "Pepe",     desc: "The OG meme lord. Starter character — everyone starts as Pepe." },
  { emoji: "💪", name: "Gigachad", desc: "Maximum chad energy. Unlock by leveling up." },
  { emoji: "🇺🇸", name: "Trump",   desc: "Make tapping great again. High-rank unlock." },
  { emoji: "🧌", name: "Troll",    desc: "Chaos is the strategy. Mid-rank unlock." },
  { emoji: "🐕", name: "Bonk",     desc: "BONK everything in sight. Mid-rank unlock." },
];

const FAQS: { q: string; a: string }[] = [
  { q: "Is Degen Clicker free to play?", a: "Yes — 100% free. No purchase required. Just sign up with email and start tapping." },
  { q: "What is $TOWER?", a: "$TOWER is the in-game currency. Earn it by tapping, completing quests, and daily login streaks. Top leaderboard players convert their standing into real USDC rewards." },
  { q: "When do seasons reset?", a: "Every 48 hours. When the timer hits zero, the reward pool pays out to the top 20 players and a brand new season begins." },
  { q: "How does the USDC reward pool work?", a: "A real USDC prize pool accumulates during each season. At season end, the top 20 players on the leaderboard split the pool based on their final rank position." },
  { q: "How do I claim my USDC winnings?", a: "Connect your Solana wallet in your profile settings. Winnings are sent on-chain to your wallet after the season closes." },
  { q: "What is the token contract address?", a: `The Solana token CA is: ${TOKEN_CA} — verify it on Solscan before trading.` },
  { q: "Can I play on mobile?", a: "Yes — the game is fully optimized for mobile. Add it to your home screen as a PWA for vibration feedback and the best experience." },
  { q: "How do combos work?", a: "Tap continuously to build your multiplier up to 20×. Any pause resets it. At 5×, 10×, 15×, and 20× you get a celebration toast + sound cue. Fast tappers earn dramatically more." },
  { q: "What happens when I prestige?", a: "Prestige is available when you reach max rank. It resets your in-game progress but awards a permanent bonus multiplier — making every future run faster. It's the endgame grind loop." },
  { q: "Why is my score not on the leaderboard?", a: "The leaderboard updates in real time via Supabase. If you don't see your score, try refreshing. Make sure your session is active and your internet is stable." },
  { q: "I found a bug / have a suggestion.", a: "Drop it in the Telegram group @degenclicker — the team is active there and watches for feedback." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 0", gap: 12,
      }}>
        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14.5, lineHeight: 1.4 }}>{q}</span>
        {open ? <ChevronUp size={16} color="#7c3aed" style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
      </div>
      {open && (
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.65, paddingBottom: 16, margin: 0 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <StarField />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 820, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <h1 style={{
            fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 900,
            background: "linear-gradient(135deg, #7c3aed 0%, #22d67a 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 12,
          }}>
            Degen Clicker
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            The most degen tap-to-earn game on Solana. Tap your way up the tower, build combos, earn $TOWER, and win real USDC every 48 hours.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <Link href="/game">
              <button className="btn-primary" style={{ padding: "12px 28px", fontWeight: 700, fontSize: 15 }}>
                <Zap size={16} style={{ marginRight: 6 }} />Play Now
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-secondary" style={{ padding: "12px 28px", fontWeight: 600, fontSize: 15 }}>
                Create Account
              </button>
            </Link>
          </div>
        </div>

        {/* Links */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>🔗 Links</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LINKS.map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${l.color}33`,
                  borderRadius: 12, padding: "10px 16px",
                  color: l.color, fontWeight: 600, fontSize: 14,
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                  <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
          <p style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 13 }}>
            Token CA: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{TOKEN_CA}</code>
          </p>
        </section>

        {/* How to Play */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>🕹️ How to Play</h2>
          <div style={{
            background: "rgba(18,18,26,0.7)", border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16, padding: "24px 28px",
          }}>
            {[
              "Sign up with email and password (free, takes 10 seconds)",
              "Pick your meme character — Pepe, Gigachad, Trump, Troll, or Bonk",
              "Tap your character to earn $TOWER coins",
              "Buy upgrades from the Shop to earn faster",
              "Build combos by tapping without pause — up to 20× multiplier",
              "Climb the leaderboard. Top 20 after 48 hours split the USDC pool",
              "Come back daily for quests and streak bonuses",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < 6 ? 14 : 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(124,58,237,0.25)",
                  border: "1px solid rgba(124,58,237,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#7c3aed",
                }}>{i + 1}</div>
                <p style={{ color: "var(--text)", fontSize: 14.5, lineHeight: 1.5, margin: 0, paddingTop: 4 }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Characters */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>🐸 Characters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {CHARACTERS.map(c => (
              <div key={c.name} style={{
                background: "rgba(18,18,26,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{c.name}</div>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>✨ All Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: "rgba(18,18,26,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{f.emoji}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5 }}>{f.title}</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>❓ FAQ</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            Answers to the most common questions. Still stuck? Ask in the{" "}
            <a href="https://t.me/degenclicker" target="_blank" rel="noopener noreferrer"
              style={{ color: "#229ED9" }}>Telegram group</a>.
          </p>
          <div style={{
            background: "rgba(18,18,26,0.7)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "4px 24px",
          }}>
            {FAQS.map((item, i) => <FAQ key={i} {...item} />)}
          </div>
        </section>

        {/* CTA */}
        <div style={{
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(34,214,122,0.1) 100%)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 20, padding: "40px 32px",
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🚀</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Ready to become a degen?</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>Join thousands of players climbing the tower and winning USDC every 48 hours.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup">
              <button className="btn-primary" style={{ padding: "14px 32px", fontWeight: 700, fontSize: 15 }}>
                Start Playing Free
              </button>
            </Link>
            <a href="https://t.me/degenclicker" target="_blank" rel="noopener noreferrer">
              <button className="btn-secondary" style={{ padding: "14px 28px", fontWeight: 600, fontSize: 15 }}>
                ✈️ Join Telegram
              </button>
            </a>
          </div>
        </div>

        {/* Back nav */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
