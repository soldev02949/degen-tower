import { NextRequest, NextResponse } from "next/server";

export const SYSTEM_PROMPT = `You are the Degen Clicker AI assistant.`; // kept for compat

export type Message = { role: string; content: string };

// ── Smart FAQ engine ─────────────────────────────────────────────────────────
// Zero external dependencies. Covers every common question about Degen Clicker.

type Rule = { patterns: RegExp[]; reply: string };

const RULES: Rule[] = [
  // ── Greetings ──────────────────────────────────────────────────────────────
  {
    patterns: [/^(hi|hey|hello|sup|yo|gm|good morning|howdy|hiya|what'?s up)\b/i],
    reply:
      "Hey! 👋 I'm the Degen Clicker bot. Ask me anything about the game — how to play, earning $TOWER, winning USDC, or how to climb the leaderboard. LFG 🚀",
  },

  // ── What is Degen Clicker ──────────────────────────────────────────────────
  {
    patterns: [/what is degen clicker|what('?s| is) (this|the game)|about (the game|degen)/i],
    reply:
      "🎮 **Degen Clicker** is a tap-to-earn game on Solana. Tap your meme character to earn $TOWER coins, buy upgrades, build combos up to 20×, and compete in 7-day seasons. Top 20 players win **real USDC** every season. 100% free to play.\n\n👉 Play now: https://degen-tower.vercel.app",
  },

  // ── How to play ────────────────────────────────────────────────────────────
  {
    patterns: [/how (do i|to) (play|start|begin|get started)|tutorial|guide|new (here|player)/i],
    reply:
      "Here's how to play Degen Clicker:\n\n1️⃣ Sign up with email + password\n2️⃣ Pick your meme character (Pepe, Gigachad, Trump, Troll, or Bonk)\n3️⃣ Tap the character to earn $TOWER coins\n4️⃣ Buy upgrades in the Shop (tap power, auto-earn, crit chance)\n5️⃣ Build combos — tap fast to reach 20× multiplier\n6️⃣ Climb the leaderboard\n7️⃣ Top 20 each season win **real USDC** 💰\n\n👉 https://degen-tower.vercel.app",
  },

  // ── TOWER token ────────────────────────────────────────────────────────────
  {
    patterns: [/what is \$?tower|tower (token|coin|currency)|what('?s| is) tower/i],
    reply:
      "💎 **$TOWER** is the in-game currency of Degen Clicker. You earn it by tapping, auto-tappers, combos, daily quests, and login streaks.\n\n$TOWER is used to buy upgrades, unlock characters, and prestige. Top 20 players on the leaderboard win **real USDC** each 7-day season based on their $TOWER score.\n\nToken CA: `AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf`",
  },

  // ── Token contract address ─────────────────────────────────────────────────
  {
    patterns: [/contract|ca\b|token address|mint address|contract address/i],
    reply:
      "🔑 **Token CA:**\n`AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf`\n\nOn Solana. Check it on Solscan: https://solscan.io/token/AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf",
  },

  // ── How to win / USDC ──────────────────────────────────────────────────────
  {
    patterns: [/win (usdc|money|prize|reward)|how.*(earn|get|withdraw).*(usdc|money|real)|prize pool|reward pool|payout/i],
    reply:
      "💰 **How to win USDC:**\n\n1. Play and accumulate $TOWER during the 7-day season\n2. Finish in the **top 20** on the leaderboard\n3. Make sure your **Solana wallet address** is in your profile settings\n4. USDC is distributed after the season ends\n\nThe prize pool grows as more players join — check the live counter on the homepage.",
  },

  // ── Wallet ─────────────────────────────────────────────────────────────────
  {
    patterns: [/wallet|solana address|how.*(add|connect|link|enter|set).*(wallet|address)|withdraw/i],
    reply:
      "👛 **Adding your wallet:**\n\nJust paste your Solana wallet address in your profile settings — no wallet connection or signing required. When you win, USDC goes straight to that address.\n\nNo Phantom, no Solflare needed. Just paste the address. Easy. 🐸",
  },

  // ── Season ─────────────────────────────────────────────────────────────────
  {
    patterns: [/season|when does.*(reset|end|restart)|how long|season.*length|7.day/i],
    reply:
      "🏆 **Seasons:** Every **7 days**, the leaderboard resets and a new season begins. Top 20 players at the end of each season win USDC from the reward pool.\n\nAfter reset your $TOWER score goes to 0 but your upgrades, rank, and characters stay.",
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────
  {
    patterns: [/leaderboard|ranking|rank|top player|standing|position/i],
    reply:
      "📊 **Leaderboard:** Shows the top players ranked by $TOWER earned this season. Updates live. Top 20 at season end win USDC.\n\nYour rank also determines which characters you can unlock — higher rank = cooler characters. 🔥\n\nRank tiers: Degen → Pepe → Rare Pepe → Whale → God Tier",
  },

  // ── Combos ────────────────────────────────────────────────────────────────
  {
    patterns: [/combo|multiplier|20x|tap fast|streak.*tap|how.*(combo|multiplier)/i],
    reply:
      "⚡ **Combo system:** Tap continuously to build your multiplier — up to **20×**. The faster you tap, the higher it goes. Stop tapping and it resets.\n\nMilestone toasts pop at 5×, 10×, 15×, and 20×. At 20× every tap earns 20× the base coins. Stack upgrades with combos for massive gains. LFG 🔥",
  },

  // ── Upgrades / Shop ────────────────────────────────────────────────────────
  {
    patterns: [/upgrade|shop|buy|boost|improve|power up|auto.?tap|bot army|whale|hedge fund/i],
    reply:
      "🛒 **Upgrades (Shop):**\n\n• **Tap Power** — more $TOWER per tap\n• **Auto-Tappers** — earn while idle (Bot Army → Whale Wallet → Hedge Fund)\n• **Energy** — tap longer before slowing\n• **Crit Chance** — random bonus hits for massive coins\n• **Combo Speed** — build multiplier faster\n\nSpend $TOWER to buy upgrades. The more you invest, the faster you earn.",
  },

  // ── Characters ────────────────────────────────────────────────────────────
  {
    patterns: [/character|pepe|gigachad|trump|troll|bonk|which character|unlock/i],
    reply:
      "🎭 **Characters:**\n\n🐸 **Pepe** — OG meme lord. Starter character, balanced stats\n💪 **Gigachad** — Maximum chad energy. Unlock with XP\n🇺🇸 **Trump** — Make tapping great again. Unlock with rank\n🧌 **Troll** — Chaos merchant. Unlock with rank\n🐕 **Bonk** — BONK everything. Unlock with rank\n\nEach character has unique visuals. Collect them all!",
  },

  // ── Prestige ────────────────────────────────────────────────────────────────
  {
    patterns: [/prestige|reset.*bonus|permanent.*bonus|max rank/i],
    reply:
      "🌟 **Prestige System:** Once you hit max rank (God Tier), you can Prestige — it resets your progress but grants a **permanent multiplier bonus** that carries over every season. Each prestige makes you stronger in the long run. True degen grind. 💎",
  },

  // ── Daily quests ──────────────────────────────────────────────────────────
  {
    patterns: [/daily quest|quest|mission|task|daily.*bonus/i],
    reply:
      "📋 **Daily Quests:** Complete 6 quests each day for bonus $TOWER. Quests refresh every 24 hours. Examples: tap X times, reach a combo streak, spend $TOWER on upgrades. Easy way to stay ahead of the competition.",
  },

  // ── Login streak ──────────────────────────────────────────────────────────
  {
    patterns: [/login streak|streak|daily.*login|log in.*daily|consecutive/i],
    reply:
      "🔥 **Login Streaks:** Log in every day to build your streak and earn bonus $TOWER. Miss a day and it resets. The longer the streak, the bigger the bonus. Don't break the chain! ⛓️",
  },

  // ── Referral ──────────────────────────────────────────────────────────────
  {
    patterns: [/referral|refer|invite|friend|share.*link|ref code/i],
    reply:
      "👥 **Referral Program:** Share your unique referral link — both you and the new player get **500 $TOWER** as a bonus when they sign up. Find your referral code in your profile. The more frens, the more $TOWER. WAGMI 🤝",
  },

  // ── Push notifications ────────────────────────────────────────────────────
  {
    patterns: [/notification|push|alert|notify/i],
    reply:
      "🔔 **Push Notifications:** Enable notifications in the game to get alerted when a season is about to end so you can make your final push up the leaderboard. Enable it in settings — it's a PWA so it works on mobile too.",
  },

  // ── Mobile / PWA ──────────────────────────────────────────────────────────
  {
    patterns: [/mobile|phone|pwa|install|app|iphone|android|vibrat/i],
    reply:
      "📱 **Mobile:** Degen Clicker is a PWA — install it on your phone like a native app. It's fully optimized for mobile with vibration feedback on every tap. Go to the website on mobile and tap 'Add to Home Screen'. Feels 100% like a real app.",
  },

  // ── Free to play ──────────────────────────────────────────────────────────
  {
    patterns: [/free|cost|pay|money.*play|credit card|buy.*token|purchase/i],
    reply:
      "✅ **100% free to play.** No purchases, no credit card, no gas fees. Just sign up and tap. The only way to earn is by playing — skill and dedication wins. Pure degen energy. 🐸",
  },

  // ── Emotes ────────────────────────────────────────────────────────────────
  {
    patterns: [/emote|react|emoji.*game|in.?game.*emot/i],
    reply:
      "😂 **In-game Emotes:** React with 6 different emotes during gameplay — visible to other players in real-time. Flex on the competition after a big combo. 💅",
  },

  // ── Links ─────────────────────────────────────────────────────────────────
  {
    patterns: [/link|website|twitter|x\.com|telegram|social|where.*find|official/i],
    reply:
      "🔗 **Official Links:**\n\n🎮 Game: https://degen-tower.vercel.app\n💬 Telegram: https://t.me/degenclicker\n📢 Updates: https://t.me/degenclickerupdates\n🐦 Twitter/X: https://x.com/degenclickersol\n🔑 Token CA: `AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf`",
  },

  // ── Bug / problem ─────────────────────────────────────────────────────────
  {
    patterns: [/bug|issue|problem|broken|not working|error|crash|glitch|help.*problem/i],
    reply:
      "🛠️ Having an issue? Report it in our Telegram group and the team will get on it fast:\n👉 https://t.me/degenclicker\n\nInclude what you were doing when it happened and we'll sort it. 🐸",
  },

  // ── Wen / when ─────────────────────────────────────────────────────────────
  {
    patterns: [/wen |when.*(launch|token|listing|exchange|cex|dex|coingecko|coinmarketcap|staking|nft)/i],
    reply:
      "👀 Wen? Soon™. Keep an eye on our Telegram for announcements:\n📢 https://t.me/degenclickerupdates\n🐦 https://x.com/degenclickersol\n\nBe the first to know. 🚀",
  },

  // ── $TOWER staking ────────────────────────────────────────────────────────
  {
    patterns: [/stak(e|ing)|yield|apy|earn.*interest/i],
    reply:
      "💎 Staking for $TOWER is coming soon! Stay tuned on Telegram for the announcement:\n📢 https://t.me/degenclickerupdates",
  },
];

// Fallback when no rule matches
const FALLBACK =
  "🤖 Hmm, not sure about that one. Best bet is to ask in the Telegram group — the community is always active:\n👉 https://t.me/degenclicker\n\nOr browse the FAQ: https://degen-tower.vercel.app/faq";

function smartReply(userText: string): string {
  const text = userText.trim();
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      return rule.reply;
    }
  }
  return FALLBACK;
}

// ── Public export (used by Telegram webhook) ─────────────────────────────────
export async function callGemini(
  messages: Message[],
  _maxTokens = 512
): Promise<string> {
  // Use the last user message as the query
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return smartReply(lastUser?.content ?? "");
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }
  const text = await callGemini(messages);
  return NextResponse.json({ content: text });
}
