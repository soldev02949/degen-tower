import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID ?? "-1003794271363";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const username: string = body.username || "a new degen";
  const character: string = body.character || "";

  const charEmoji: Record<string, string> = {
    pepe: "🐸", gigachad: "💪", trump: "🇺🇸", troll: "🧌", bonk: "🐕",
  };
  const emoji = character ? (charEmoji[character.toLowerCase()] ?? "🎮") : "🎮";

  const text =
    `${emoji} *${username}* just joined Degen Clicker!\n` +
    `Welcome to the tower 🏆 — tap your way to the top and grab some USDC.\n` +
    `👉 https://degen-tower.vercel.app`;

  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: GROUP_CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_notification: false,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
