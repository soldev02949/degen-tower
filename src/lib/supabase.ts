import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  wallet_address: string;
  username: string;
  character: string;
  total_score: number;
  highest_floor: number;
  games_played: number;
  token_balance: number;
  is_verified: boolean;
  created_at: string;
};

export type LeaderboardEntry = {
  id: string;
  player_id: string;
  score: number;
  floor_reached: number;
  leaderboard_date: string;
  rank: number | null;
  reward_percentage: number | null;
  dt_players: {
    username: string;
    character: string;
    wallet_address: string;
  } | null;
};

export type ShopItem = {
  id: string;
  category: string;
  emoji: string;
  name: string;
  description: string;
  price: number;
  tag: string | null;
  tag_color: string | null;
  is_active: boolean;
};

export type RewardPool = {
  pool_date: string;
  total_usdc: number;
  distributed: boolean;
};

const CHAR_EMOJI: Record<string, string> = {
  pepe: "🐸",
  gigachad: "💪",
  trump: "🎩",
  troll: "🧌",
};

export function charEmoji(character: string): string {
  return CHAR_EMOJI[character] ?? "🐸";
}

export function rewardLabel(rank: number): string {
  if (rank === 1) return "20%";
  if (rank === 2) return "15%";
  if (rank === 3) return "10%";
  if (rank <= 20) return "Equal Split";
  return "—";
}

export function shortWallet(wallet: string): string {
  if (!wallet || wallet.length < 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}
