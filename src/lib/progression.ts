/**
 * Degen Clicker — Progression System
 *
 * XP = total coins earned (total_score in Supabase)
 *
 * XP to go from level n → n+1:
 *   floor(300 * pow(2.1, n-1))
 *
 * Approximate XP milestones:
 *   Lv 2  →  300
 *   Lv 3  →  930
 *   Lv 4  →  2,883
 *   Lv 5  →  8,034 (~15 min casual play)
 *   Lv 8  →  242,000
 *   Lv 10 →  1.5M
 *   Lv 15 →  96M  (hours of heavy grinding)
 *   Lv 20 →  6.1B (dedicated sessions)
 *   Lv 30 →  24T  (absolute hardcore)
 *   Lv 50 →  unreachable by anyone in 48hr season
 */

export function xpForNextLevel(level: number): number {
  return Math.floor(300 * Math.pow(2.1, level - 1));
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForNextLevel(level);
    if (accumulated + needed > totalXP) return level;
    accumulated += needed;
    level++;
    if (level >= 100) return 100;
  }
}

export function getLevelProgress(totalXP: number): { current: number; needed: number; pct: number } {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForNextLevel(level);
    if (accumulated + needed > totalXP) {
      const current = totalXP - accumulated;
      return { current, needed, pct: Math.min(100, (current / needed) * 100) };
    }
    accumulated += needed;
    level++;
    if (level >= 100) return { current: 0, needed: 1, pct: 100 };
  }
}

export function totalXPToReachLevel(target: number): number {
  let total = 0;
  for (let i = 1; i < target; i++) total += xpForNextLevel(i);
  return total;
}

// ─── Rank System ──────────────────────────────────────────────────────────────
// Each rank requires meaningful time investment.
export interface Rank {
  name: string;
  emoji: string;
  color: string;
  minLevel: number;
  description: string;
}

export const RANKS: Rank[] = [
  { minLevel: 1,  name: "Ngmi",          emoji: "😴", color: "#555566",  description: "Just started" },
  { minLevel: 3,  name: "Paper Hands",   emoji: "📄", color: "#9999aa",  description: "Getting warmed up" },
  { minLevel: 5,  name: "Normie",        emoji: "🐸", color: "#22d67a",  description: "Tapping regularly" },
  { minLevel: 8,  name: "Bronze Ape",    emoji: "🐒", color: "#cd7f32",  description: "Serious grinder" },
  { minLevel: 11, name: "Silver Degen",  emoji: "🥈", color: "#c0c0c0",  description: "Mid-tier hustler" },
  { minLevel: 15, name: "Gold Degen",    emoji: "🥇", color: "#f5c842",  description: "Heavy tapper" },
  { minLevel: 20, name: "Diamond Hands", emoji: "💎", color: "#88ccff",  description: "Never selling" },
  { minLevel: 25, name: "Sigma",         emoji: "💪", color: "#e0b87a",  description: "Alpha grinder" },
  { minLevel: 30, name: "Tower Lord",    emoji: "🏆", color: "#ffaa00",  description: "Legendary status" },
  { minLevel: 40, name: "Degen God",     emoji: "👑", color: "#ff44ee",  description: "Untouchable" },
  { minLevel: 50, name: "Legend",        emoji: "🌈", color: "#ff6622",  description: "One of one" },
];

export function getRankFromLevel(level: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r;
    else break;
  }
  return rank;
}

export function getNextRank(level: number): Rank | null {
  for (const r of RANKS) {
    if (r.minLevel > level) return r;
  }
  return null;
}
