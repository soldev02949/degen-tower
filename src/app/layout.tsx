import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Degen Clicker — Tap. Earn. Climb.",
  description: "The most degen tap-to-earn clicker on Solana. Pick your meme character, earn $DEGEN, upgrade your rig, and win the USDC reward pool.",
  keywords: ["degen clicker", "degen", "tap to earn", "solana", "p2e", "play to earn", "meme", "crypto game", "clicker game"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Degen Clicker",
  },
  openGraph: {
    title: "Degen Clicker — Tap. Earn. Climb.",
    description: "Pick Pepe, Gigachad, Trump, Troll or Bonk. Tap to earn $DEGEN. 48hr leaderboard resets. Win USDC.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Degen Clicker — Tap. Earn. Climb.",
    description: "Pick Pepe, Gigachad, Trump, Troll or Bonk. Tap to earn $DEGEN. 48hr leaderboard. Win USDC.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icon-512x512.png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA standalone mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Degen Clicker" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Degen Clicker" />
        {/* Windows tile */}
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-TileImage" content="/icon-144x144.png" />
        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[SW] registered', reg.scope); })
                    .catch(function(err) { console.log('[SW] error', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
