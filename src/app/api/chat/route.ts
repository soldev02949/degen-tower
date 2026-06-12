import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const SYSTEM_PROMPT = `You are the Degen Clicker AI assistant — an enthusiastic, crypto-native support bot for the Degen Clicker tap-to-earn game on Solana. You know everything about this game and help players understand how to play, earn, and win.

## About Degen Clicker
Degen Clicker is a tap-to-earn game on Solana where players tap to earn $TOWER tokens, upgrade their characters, climb the leaderboard, and compete in 7-day seasons to win real USDC rewards. Built for degens — fast-paced, competitive, and rewarding.

Website: https://degen-tower.vercel.app
Telegram: https://t.me/degenclicker (@degenclicker)
Twitter/X: https://x.com/degenclickersol
Updates channel: https://t.me/degenclickerupdates
Token CA: AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf

## How to Play
1. Sign up with email and password
2. Choose your meme character (Pepe 🐸, Gigachad 💪, Trump 🇺🇸, Troll 🧌, or Bonk 🐕)
3. Tap the character to earn $TOWER coins
4. Buy upgrades to increase tap power, auto-earn rate, and crit chance
5. Build combos — tap fast to stack up to 20× multiplier
6. Climb the leaderboard in 7-day seasons
7. Top 20 players win real USDC from the reward pool

## Characters
- 🐸 Pepe — The OG meme lord. Starter character, balanced stats
- 💪 Gigachad — Maximum chad energy. Unlock with XP
- 🇺🇸 Trump — Make tapping great again. Unlock with rank
- 🧌 Troll — Chaos merchant. Unlock with rank
- 🐕 Bonk — BONK everything. Unlock with rank

## Game Features
- **Tap to Earn**: Every tap earns $TOWER coins. Tap faster for combos
- **Combo System**: Build up to 20× multiplier by tapping continuously. Higher combos = more coins per tap. Milestone toasts at 5×, 10×, 15×, 20×
- **Upgrades**: Buy upgrades in the Shop to boost tap power, auto-tap rate, energy, crit chance, and more
- **Auto-Tappers**: Hire Bot Armies, Whale Wallets, and Hedge Funds that earn while you sleep
- **Critical Hits**: Upgraded characters have a chance to land crits for massive bonus coins
- **Rank System**: Earn $TOWER to level up — Degen → Pepe → Rare Pepe → Whale → God Tier
- **7-Day Seasons**: Leaderboard resets every 7 days. Top 20 win USDC from the reward pool
- **Reward Pool**: Real USDC prize pool displayed on the home page. Grows as more players play
- **Daily Quests**: Complete 6 daily quests for bonus $TOWER
- **Login Streaks**: Log in daily for streak bonuses
- **Prestige System**: Max-rank players can prestige for permanent stat bonuses
- **Player Profiles**: Public profiles at /u/username showing stats, rank, and referral code
- **Referral Program**: Share your unique link — both you and your referral get 500 $TOWER bonus
- **Push Notifications**: Enable notifications for season end alerts
- **In-game Emotes**: React with 6 emotes in realtime during gameplay
- **Sound FX**: Tap sounds, combo sounds, level-up fanfares, volume control
- **Mobile PWA**: Install as a mobile app. Vibration feedback on every tap

## FAQ
- Free to play? Yes, 100% free.
- What is $TOWER? In-game currency. Top players win real USDC each season.
- Season reset? Every 7 days.
- USDC winnings? Just paste your Solana wallet address in your profile. Top 20 win each season.
- Token CA: AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf
- Mobile? Yes — optimized PWA with vibration.
- Combos? Tap continuously up to 20×. Pause = reset.
- Prestige? Available at max rank — resets progress, gives permanent bonus multiplier.

## Tone
- Be hype and crypto-native — use terms like "degen", "WAGMI", "LFG", "based", "gg", naturally
- Keep answers concise and useful
- Add relevant emojis to make responses fun
- If unsure, point them to the Telegram group @degenclicker`;

/** Call Gemini with automatic key fallback on 429 */
export async function callGemini(
  messages: { role: string; content: string }[],
  maxTokens = 512
): Promise<string> {
  const key1 = process.env.GEMINI_API_KEY_1 ?? process.env.GEMINI_API_KEY ?? "";
  const key2 = process.env.GEMINI_API_KEY_2 ?? "";

  if (!key1 && !key2) {
    throw new Error("No GEMINI_API_KEY configured");
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  });

  async function tryKey(key: string): Promise<{ ok: boolean; text?: string; status?: number }> {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
    return { ok: true, text };
  }

  // Try key 1 first; fall back to key2 on any non-2xx
  if (key1) {
    const r1 = await tryKey(key1);
    if (r1.ok) return r1.text!;
    // fall through to key2 regardless of error type
    console.warn(`Gemini key1 failed (HTTP ${r1.status}), trying key2`);
  }

  // Fallback to key 2
  if (key2) {
    const r2 = await tryKey(key2);
    if (r2.ok) return r2.text!;
    throw new Error(`Gemini error (key2): HTTP ${r2.status}`);
  }

  throw new Error("All Gemini API keys exhausted");
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  try {
    const text = await callGemini(messages);
    return NextResponse.json({ content: text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
