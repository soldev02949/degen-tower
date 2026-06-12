/**
 * Referral utilities for Degen Clicker
 * Tracks referral codes via URL params (?ref=CODE) stored in localStorage
 * and awards bonus $TOWER to both referrer and referee on signup.
 */

export const REFERRAL_BONUS_COINS = 500;

/** Generate a short unique referral code from a user ID */
export function generateReferralCode(userId: string): string {
  // Use first 8 chars of uid hash for a short stable code
  const hash = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `DC${hash}`;
}

/** Get current referral code from URL or localStorage */
export function captureReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("ref");
  if (fromUrl) {
    localStorage.setItem("degen_ref", fromUrl);
    return fromUrl;
  }
  return localStorage.getItem("degen_ref");
}

/** Clear stored referral code (after successful signup) */
export function clearReferralCode(): void {
  if (typeof window !== "undefined") localStorage.removeItem("degen_ref");
}

/** Build a shareable referral URL */
export function buildReferralUrl(code: string): string {
  if (typeof window === "undefined") return `https://degen-tower.vercel.app/?ref=${code}`;
  return `${window.location.origin}/?ref=${code}`;
}
