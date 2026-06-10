import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Degen Clicker — Tap. Earn. Climb.",
  description: "The most degen tap-to-earn clicker on Solana. Pick your meme character, earn $TOWER, upgrade your rig, and win the USDC reward pool.",
  keywords: ["degen clicker", "degen", "tap to earn", "solana", "p2e", "play to earn", "meme", "crypto game", "clicker game"],
  openGraph: {
    title: "Degen Clicker — Tap. Earn. Climb.",
    description: "Pick Pepe, Gigachad, Trump, Troll or Bonk. Tap to earn $TOWER. 48hr leaderboard resets. Win USDC.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Degen Clicker — Tap. Earn. Climb.",
    description: "Pick Pepe, Gigachad, Trump, Troll or Bonk. Tap to earn $TOWER. 48hr leaderboard. Win USDC.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
