import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "../../chat/route";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Simple per-user conversation memory (in-process, resets on cold start — good enough for a bot)
const sessions = new Map<number, { role: string; content: string }[]>();
const MAX_HISTORY = 10;

async function send(chat_id: number, text: string, options: Record<string, unknown> = {}) {
  await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", ...options }),
  });
}

async function sendAction(chat_id: number, action = "typing") {
  await fetch(`${TG}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, action }),
  });
}

// ── Command handlers ────────────────────────────────────────────────────────

const CMD_START = `🎮 *Welcome to Degen Clicker!*

The most degen tap\\-to\\-earn game on Solana\\. Tap your way up the tower, build combos, and win real USDC every 48 hours\\.

*Quick links:*
🕹️ [Play Now](https://degen-tower.vercel.app/game)
ℹ️ [FAQ & Info](https://degen-tower.vercel.app/faq)
📢 [Announcements](https://t.me/degenclickerupdates)
𝕏 [Twitter](https://x.com/degenclickersol)

Type any question or use a command below 👇`;

const CMD_HELP = `🤖 *Degen Clicker Bot Commands*

/start \\- Welcome message & links
/play \\- Get the game link
/faq \\- Frequently asked questions
/features \\- All game features
/characters \\- Meet the meme characters
/links \\- All social & project links
/tokenca \\- Token contract address
/season \\- How seasons & rewards work
/combos \\- How the combo system works
/help \\- Show this menu

_Or just type anything and the AI will answer it\\!_ 🧠`;

const CMD_PLAY = `🕹️ *Let's play\\!*

👉 [degen\\-tower\\.vercel\\.app/game](https://degen-tower.vercel.app/game)

New here? [Create a free account](https://degen-tower.vercel.app/signup) in 10 seconds and start tapping\\!`;

const CMD_FAQ = `❓ *Frequently Asked Questions*

*Is it free to play?*
Yes — 100% free\\. No purchase, no wallet required to start\\.

*What is $TOWER?*
Your in\\-game currency\\. Earn it tapping, from quests & streaks\\. Top 20 each season win real USDC\\.

*When do seasons reset?*
Every 48 hours\\. Timer runs live on the leaderboard page\\.

*How do I win USDC?*
Stay in the top 20 when the 48\\-hour timer ends\\. Connect a Solana wallet to claim your share\\.

*What's the token CA?*
\`AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf\`

*Can I play on mobile?*
Yes — optimized PWA with tap vibration\\. Add to Home Screen for the full experience\\.

*How do combos work?*
Tap without stopping to build up to 20× multiplier\\. One pause and it resets\\.

*What is Prestige?*
Available at max rank\\. Resets your run but grants a permanent bonus multiplier forever\\.

More questions? Just ask me anything\\! 🤖`;

const CMD_FEATURES = `✨ *All Degen Clicker Features*

👆 *Tap to Earn* — Every tap earns $TOWER
🔥 *Combo Multiplier* — Up to 20× by tapping non\\-stop
⚡ *Upgrades* — Boost tap power, energy, crit chance
🤖 *Auto\\-Tappers* — Bot armies that earn while you sleep
💥 *Critical Hits* — Land crits for massive coin bursts
👑 *Rank Ladder* — Degen → Pepe → Whale → God Tier
🏆 *48hr Seasons* — Leaderboard resets, top 20 win USDC
💰 *Live Reward Pool* — Real USDC prize pool shown on home page
🧭 *Daily Quests* — 6 quests refreshed every 24h for bonus coins
🗓️ *Login Streaks* — Daily login bonuses, 7\\-day streak rewards
✨ *Prestige* — Reset at max rank for permanent bonus multiplier
🎁 *Referral Program* — Both parties get 500 $TOWER on signup
👤 *Player Profiles* — Public stats at /u/username
😄 *In\\-Game Emotes* — 6 realtime emotes during gameplay
🔔 *Push Notifications* — Season end & reward alerts
🔊 *Sound FX* — Tap sounds, combos, level\\-up fanfares
📱 *Mobile PWA* — Install to home screen, vibration on tap`;

const CMD_CHARACTERS = `🐸 *The Meme Characters*

🐸 *Pepe* — The OG meme lord\\. Everyone starts here\\. Balanced starter stats\\.

💪 *Gigachad* — Maximum chad energy\\. Unlock by leveling up your rank\\.

🇺🇸 *Trump* — Make tapping great again\\. High\\-rank unlock\\.

🧌 *Troll* — Chaos is the strategy\\. Mid\\-rank unlock\\.

🐕 *Bonk* — BONK everything in sight\\. Mid\\-rank unlock\\.

Earn $TOWER → gain XP → unlock new characters 🚀`;

const CMD_LINKS = `🔗 *Degen Clicker Links*

🎮 [Play the Game](https://degen-tower.vercel.app/game)
📋 [FAQ & Info](https://degen-tower.vercel.app/faq)
✈️ [Telegram Group](https://t.me/degenclicker)
📢 [Announcements Channel](https://t.me/degenclickerupdates)
𝕏 [Twitter / X](https://x.com/degenclickersol)
🪙 [Token on Solscan](https://solscan.io/token/AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf)

Token CA:
\`AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf\``;

const CMD_TOKEN = `🪙 *Token Contract Address*

\`AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf\`

👉 [View on Solscan](https://solscan.io/token/AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf)

Always verify the CA before trading\\. Official links only from @degenclickerupdates\\.`;

const CMD_SEASON = `🏆 *Seasons & Rewards*

Degen Clicker runs on 48\\-hour seasons:

1️⃣ Season starts — reward pool is 0 USDC
2️⃣ Players tap & compete for 48 hours
3️⃣ Timer hits zero — snapshot of top 20 taken
4️⃣ USDC reward pool is split among top 20 by rank
5️⃣ New season begins immediately

*To claim winnings:*
Connect your Solana wallet in Profile Settings\\. Rewards are sent on\\-chain\\.

The live pool counter is always visible on the [home page](https://degen-tower.vercel.app) \\👀`;

const CMD_COMBOS = `🔥 *How Combos Work*

• Tap *continuously* without pausing to build your multiplier
• Multiplier stacks: 1× → 2× → 5× → 10× → *20×*
• Any pause resets the combo back to 1×
• At *5×, 10×, 15×, 20×* milestones you get a toast \\+ sound effect
• Higher combo = exponentially more coins per tap

*Pro tip:* Use Auto\\-Tappers from the shop to maintain combos even when you're not actively tapping\\!`;

// ── Main command router ─────────────────────────────────────────────────────

const COMMANDS: Record<string, string> = {
  "/start": CMD_START,
  "/help": CMD_HELP,
  "/play": CMD_PLAY,
  "/faq": CMD_FAQ,
  "/features": CMD_FEATURES,
  "/characters": CMD_CHARACTERS,
  "/links": CMD_LINKS,
  "/tokenca": CMD_TOKEN,
  "/ca": CMD_TOKEN,
  "/token": CMD_TOKEN,
  "/season": CMD_SEASON,
  "/seasons": CMD_SEASON,
  "/combos": CMD_COMBOS,
  "/combo": CMD_COMBOS,
};

// ── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message ?? update?.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const chat_id: number = message.chat.id;
    const text: string = (message.text ?? "").trim();
    if (!text) return NextResponse.json({ ok: true });

    // Extract command (strip @botname suffix if present)
    const raw_cmd = text.split(" ")[0].split("@")[0].toLowerCase();
    const is_command = raw_cmd.startsWith("/");

    // Static command
    if (is_command && COMMANDS[raw_cmd]) {
      await send(chat_id, COMMANDS[raw_cmd], { disable_web_page_preview: true });
      return NextResponse.json({ ok: true });
    }

    // Unknown command — treat as regular message, fall through to AI
    // (or give a tip in groups so we don't spam)
    if (is_command) {
      await send(chat_id, `🤔 Unknown command\\. Try /help to see what I can do\\!`);
      return NextResponse.json({ ok: true });
    }

    // In group chats only respond when mentioned or replying to the bot
    if (message.chat.type !== "private") {
      const mentioned =
        text.includes("@soldegenagentbot") ||
        message.reply_to_message?.from?.username === "soldegenagentbot";
      if (!mentioned) return NextResponse.json({ ok: true }); // ignore group chatter
    }

    // AI chat — maintain per-user history
    await sendAction(chat_id);
    const clean_text = text.replace(/@soldegenagentbot/gi, "").trim();

    const history = sessions.get(chat_id) ?? [];
    history.push({ role: "user", content: clean_text });

    // Keep context window manageable
    const context = history.slice(-MAX_HISTORY);

    const reply = await callGemini(context, 400);
    history.push({ role: "assistant", content: reply });
    sessions.set(chat_id, history.slice(-MAX_HISTORY));

    // Telegram MarkdownV2 special chars need escaping — use Markdown (v1) which is more lenient
    // Strip backtick blocks to avoid parse errors in v1
    const safe_reply = reply
      .replace(/```[\s\S]*?```/g, (m) => m) // keep code blocks
      .substring(0, 4000); // hard cap

    await send(chat_id, safe_reply);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // always 200 to avoid Telegram retries
  }
}

// Telegram requires this route to be POST-only; GET can be used for health check
export async function GET() {
  return NextResponse.json({ ok: true, bot: "soldegenagentbot", status: "webhook active" });
}
