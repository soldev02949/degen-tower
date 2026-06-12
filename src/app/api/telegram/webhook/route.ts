import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "../../chat/route";
import {
  fetchLeaderboard,
  formatLeaderboardTelegram,
  isLeaderboardQuery,
} from "@/lib/leaderboard";

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


// ── Auto-mod blacklist ────────────────────────────────────────────────────────
// All patterns are lowercased. Checked against every group message.
const BLACKLIST: RegExp[] = [
  // DM / contact solicitation
  /\bdm\s*me\b/,
  /\bdms?\s*(are\s*)?open\b/,
  /\b(message|msg|text|contact)\s*me\b/,
  /\bhit\s*me\s*up\b/,
  /\bslide\s*into\b/,
  /\bin\s*my\s*dms?\b/,
  /\breach\s*(out|me)\b/,
  /\bfollow\s*me\b/,
  /\bcheck\s*(out\s*)?my\s*bio\b/,
  /\blink\s*in\s*(my\s*)?bio\b/,
  /\bdrop\s*your\s*(address|wallet|ca|contact)\b/,

  // DEX / trending shills
  /\bdex\s*paid\b/,
  /\bdex\s*trending\b/,
  /\bget\s*(us\s*)?trending\b/,
  /\bbuy\s*trending\b/,
  /\btrending\s*(package|slot|service|boost|now|soon)\b/,
  /\bskeleton\s*trending\b/,
  /\bdextools\s*(trending|paid|boost)\b/,
  /\bdexscreener\s*(trending|paid|boost)\b/,
  /\bcmc\s*(fast\s*track|trending|listed|listing)\b/,
  /\bcg\s*(fast\s*track|trending|listed|listing)\b/,
  /\bcoingecko\s*(fast\s*track|trending|paid)\b/,
  /\bcoinmarketcap\s*(fast\s*track|trending|paid)\b/,

  // Project shilling / unsolicited promo
  /\b(just\s*)?(stealth|fair)\s*launch(ed|ing)?\b/,
  /\bjust\s*launched\b/,
  /\blaunch(ing|ed)\s*(today|now|soon|live)\b/,
  /\bnew\s*(token|coin|project|gem|launch|contract)\b/,
  /\bhidden\s*gem\b/,
  /\blow\s*cap\s*gem\b/,
  /\bmicro\s*cap\s*gem\b/,
  /\bunder(rated|valued)\s*(gem|project|coin|token)\b/,
  /\bnext\s*(100x|1000x|10x|moonshot|big\s*thing)\b/,
  /\b(100|1000|500)x\s*(potential|gem|play|incoming|easy|guaranteed)\b/,
  /\beasy\s*(100|1000|500)x\b/,
  /\bget\s*in\s*early\b/,
  /\bearly\s*(entry|opportunity|investors?)\b/,
  /\bpresale\b/,
  /\bprivate\s*sale\b/,
  /\bwhitelist\s*(spots?|open|now|limited)\b/,
  /\brug\s*(free|proof|pull)\b/,
  /\b(no\s*)?rug\s*(pull|proof|free)\b/,
  /\bsafu\s*(project|team|contract|dev)\b/,
  /\bdoxxed\s*(team|devs?)\b/,
  /\baudit(ed|ing)?\s*(contract|by|report)\b/,
  /\bjoin\s*(our|the)\s*(telegram|tg|group|community|channel)\b/,
  /\bcheck\s*(out\s*)?(our|this)\s*(project|token|coin|channel|group|tg)\b/,
  /\b(paid\s*)?promotion\b/,
  /\bsponsored\s*(post|content|by)\b/,
  /\baffiliate\s*(link|code)\b/,
  /\bshilling\b/,
  /\bshill(s)?\b/,

  // Pump / price manipulation signals
  /\bpump\s*(it|this|incoming|alert|signal|now|soon|group)\b/,
  /\b(buy\s*)?the\s*dip\s+(and\s*)?(pump|moon|flip)\b/,
  /\bcoordinated\s*(buy|pump)\b/,
  /\bpump\s*and\s*dump\b/,
  /\bcall(s)?\s*(group|channel|signal)\b/,
  /\bsignal(s)?\s*(group|channel|call)\b/,
  /\b(crypto|trading|pump)\s*calls?\b/,

  // Airdrop spam
  /\bairdrop\s*(live|now|open|claim|free|alert|drop)\b/,
  /\bfree\s*(tokens?|coins?|airdrop|crypto)\b/,
  /\bclaim\s*(your\s*)?(free\s*)?(tokens?|airdrop|rewards?|crypto)\b/,
  /\bdrop\s*(live|now|event|season)\b/,
  /\bgiveaway\s*(live|now|open|time|event|drop)\b/,
  /\bwin\s*(free\s*)?(tokens?|crypto|eth|sol|bnb)\b/,

  // Referral / invite spam
  /\buse\s*(my|our)\s*(ref|referral|code|link|invite)\b/,
  /\bref\s*code\b/,
  /\binvite\s*(code|link|bonus)\b/,
  /\b(earn|make|get)\s*(passive\s*)?income\b/,
  /\bmake\s*(money|gains)\s*(fast|quick|easy|online|with)\b/,

  // NFT shilling
  /\bnft\s*(drop|mint|launch|collection|project|sale|presale)\b/,
  /\bmint(ing)?\s*(live|now|open|soon|free)\b/,
  /\bwl\s*(spots?|open|limited|giveaway)\b/,
  /\bwaitlist\s*(open|spots?|limited|giveaway)\b/,

  // Scam / phishing patterns
  /\bconnect\s*(your\s*)?wallet\s*(to\s*claim|for|now)\b/,
  /\bverif(y|ication)\s*(required|needed|your\s*wallet)\b/,
  /\bseed\s*(phrase|words?)\b/,
  /\bprivate\s*key\b/,
  /\brecovery\s*(phrase|words?)\b/,
  /\bcustomer\s*support\b/,
  /\bofficial\s*support\b/,
  /\badmin\s*will\s*(never|not)\s*(dm|message)\b/,  // often used before scamming

  // Generic spam indicators
  /\bt\.me\/(?!degenclicker|degenclickerupdates)/,  // any t.me link that's NOT our own
  /\bbit\.ly\b/,
  /\bshorturl\b/,
  /\btinyurl\b/,
  /https?:\/\/(?!degen-tower\.vercel\.app|t\.me\/(degenclicker|degenclickerupdates)|x\.com\/degenclickersol|solscan\.io)[^\s]{20,}/,  // long external links
];

function isBlacklisted(text: string): boolean {
  const lower = text.toLowerCase();
  return BLACKLIST.some((re) => re.test(lower));
}

async function deleteMsg(chat_id: number, message_id: number) {
  await fetch(`${TG}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, message_id }),
  });
}

// ── Live leaderboard command ─────────────────────────────────────────────────

async function handleLeaderboard(chat_id: number) {
  await sendAction(chat_id);
  const players = await fetchLeaderboard(20).catch(() => []);
  const msg = formatLeaderboardTelegram(players);
  await send(chat_id, msg, { disable_web_page_preview: true });
}

// ── Command handlers ────────────────────────────────────────────────────────

const CMD_START = `🎮 *Welcome to Degen Clicker!*

The most degen tap\\-to\\-earn game on Solana\\. Tap your way up the tower, build combos, and win real USDC every 7 days\\.

*Quick links:*
🕹️ [Play Now](https://degen-tower.vercel.app/game)
ℹ️ [FAQ & Info](https://degen-tower.vercel.app/faq)
📢 [Announcements](https://t.me/degenclickerupdates)
𝕏 [Twitter](https://x.com/degenclickersol)

Type any question or use a command below 👇`;

const CMD_HELP = `🤖 *Degen Clicker Bot Commands*

/start \\- Welcome message & links
/leaderboard \\- Live season standings 🏆
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
Every 7 days\. Timer runs live on the leaderboard page\\.

*How do I win USDC?*
Stay in the top 20 when the season ends\. Just paste your Solana wallet address in your profile to claim your share\.

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
🏆 *7-Day Seasons* — Leaderboard resets, top 20 win USDC
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

Degen Clicker runs on 7-day seasons:

1️⃣ Season starts — reward pool is 0 USDC
2️⃣ Players tap & compete for 7 days
3️⃣ Timer hits zero — snapshot of top 20 taken
4️⃣ USDC reward pool is split among top 20 by rank
5️⃣ New season begins immediately

*To claim winnings:*
Just paste your Solana wallet address in Profile Settings\. Rewards are sent on-chain\.

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

// Commands that require live data (handled dynamically)
const LIVE_COMMANDS = new Set([
  "/leaderboard",
  "/leaderboardog",
  "/lb",
  "/top",
  "/standings",
]);

// ── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message ?? update?.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const chat_id: number = message.chat.id;
    const message_id: number = message.message_id;
    const text: string = (message.text ?? "").trim();
    if (!text) return NextResponse.json({ ok: true });

    // ── Auto-mod: silently delete blacklisted messages in group chats ─────────
    if (message.chat.type !== "private" && isBlacklisted(text)) {
      await deleteMsg(chat_id, message_id);
      return NextResponse.json({ ok: true });
    }

    // Extract command (strip @botname suffix if present)
    const raw_cmd = text.split(" ")[0].split("@")[0].toLowerCase();
    const is_command = raw_cmd.startsWith("/");

    // Live leaderboard command
    if (is_command && LIVE_COMMANDS.has(raw_cmd)) {
      await handleLeaderboard(chat_id);
      return NextResponse.json({ ok: true });
    }

    // Static command
    if (is_command && COMMANDS[raw_cmd]) {
      await send(chat_id, COMMANDS[raw_cmd], { disable_web_page_preview: true });
      return NextResponse.json({ ok: true });
    }

    // Unknown command — give a helpful tip
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

    // ── AI chat path ──────────────────────────────────────────────────────────
    await sendAction(chat_id);
    const clean_text = text.replace(/@soldegenagentbot/gi, "").trim();

    // Short-circuit leaderboard natural language queries with live data
    if (isLeaderboardQuery(clean_text)) {
      const players = await fetchLeaderboard(20).catch(() => []);
      if (players.length > 0) {
        const msg = formatLeaderboardTelegram(players);
        await send(chat_id, msg, { disable_web_page_preview: true });
        return NextResponse.json({ ok: true });
      }
    }

    const history = sessions.get(chat_id) ?? [];
    history.push({ role: "user", content: clean_text });

    // Keep context window manageable
    const context = history.slice(-MAX_HISTORY);

    let reply: string;
    try {
      reply = await callGemini(context, 400);
    } catch (_aiErr) {
      await send(chat_id, "🤖 AI is resting for a sec — try again in a moment, or use /help for commands!");
      return NextResponse.json({ ok: true });
    }
    history.push({ role: "assistant", content: reply });
    sessions.set(chat_id, history.slice(-MAX_HISTORY));

    const safe_reply = reply.substring(0, 4000);
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
