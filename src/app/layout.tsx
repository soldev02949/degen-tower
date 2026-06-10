import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Degen Tower — Climb. Earn. Ascend.",
  description: "A high-octane play-to-earn tower climbing game on Solana. Compete daily, earn USDC, flex your meme character.",
  keywords: ["degen", "tower", "solana", "p2e", "play to earn", "meme", "crypto game"],
  openGraph: {
    title: "Degen Tower — Climb. Earn. Ascend.",
    description: "The most degen tower climbing game on Solana. Daily USDC rewards. Token-gated. Meme characters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
