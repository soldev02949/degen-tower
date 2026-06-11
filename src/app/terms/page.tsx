"use client";
import Link from "next/link";

const LAST_UPDATED = "June 2025";

function LegalNav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(6,0,14,0.97)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(168,85,247,0.12)",
      padding: "12px 24px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <img src="/logo.png" alt="" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        style={{ width: 26, height: 26, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.6))" }} />
      <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em", flex: 1 }}>DEGEN CLICKER</span>
      <Link href="/privacy" style={{ color: "#888", fontSize: 12, padding: "5px 10px", textDecoration: "none" }}>Privacy Policy</Link>
      <Link href="/" style={{
        background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
        color: "#c084fc", borderRadius: 8, fontSize: 12, fontWeight: 700, padding: "6px 12px", textDecoration: "none",
      }}>← Home</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        color: "#a855f7", fontWeight: 800, fontSize: 17, marginBottom: 12,
        paddingBottom: 8, borderBottom: "1px solid rgba(168,85,247,0.15)",
      }}>{title}</h2>
      <div style={{ color: "#bbb", fontSize: 14, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div style={{ minHeight: "100vh", background: "#060010", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <LegalNav />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 32, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Terms & Conditions
          </h1>
          <p style={{ color: "#555", fontSize: 13 }}>Last updated: {LAST_UPDATED}</p>
          <div style={{
            marginTop: 20, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13, lineHeight: 1.7,
          }}>
            ⚠️ <strong>Important:</strong> Degen Clicker involves cryptocurrency tokens and digital assets.
            These carry significant financial risk. Nothing on this platform constitutes financial or investment advice.
            By using this platform you confirm you understand and accept these risks.
          </div>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using Degen Clicker (the &quot;Platform&quot;, &quot;Service&quot;, or &quot;Game&quot;) at degen-tower.vercel.app or any associated domains, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform.</p>
          <p style={{ marginTop: 10 }}>These Terms apply to all visitors, users, and others who access or use the Service. By continuing to use the Platform, you accept any updates to these Terms as they are posted.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least <strong style={{ color: "#fff" }}>18 years of age</strong> (or the age of legal majority in your jurisdiction, whichever is higher) to use this Platform.</p>
          <p style={{ marginTop: 10 }}>By using the Platform you represent and warrant that:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "You are at least 18 years old",
              "You have the legal capacity to enter into these Terms",
              "You are not located in a jurisdiction where cryptocurrency activities are prohibited",
              "You are not subject to any sanctions or restrictions that would prohibit your use of the Platform",
              "You will not use the Platform for any unlawful purpose",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>
            The Platform is not available to residents of jurisdictions where participation in crypto-related gaming or token activities is prohibited by law. This may include certain U.S. states and other countries. It is your responsibility to ensure compliance with your local laws.
          </p>
        </Section>

        <Section title="3. Description of Service">
          <p>Degen Clicker is an online competitive clicker game where players accumulate &quot;taps&quot; to earn in-game currency, climb leaderboards, and compete for prizes. The Platform includes:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 10 }}>
            {[
              "A browser-based clicker game accessible via account registration",
              "An in-game shop with virtual items purchasable with in-game coins",
              "A competitive leaderboard with periodic prize distributions",
              "Integration with the $DEGEN CLICKER (DEGEN) token on the Solana blockchain",
              "Telegram sticker packs and community features",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time without prior notice.</p>
        </Section>

        <Section title="4. User Accounts">
          <p>To access the game, you must create an account using a valid email address and password. You are responsible for:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Maintaining the confidentiality of your account credentials",
              "All activity that occurs under your account",
              "Notifying us immediately of any unauthorized use of your account",
              "Ensuring your account information is accurate and up to date",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>We reserve the right to terminate or suspend accounts at our discretion, including for violations of these Terms, fraudulent activity, or manipulation of game mechanics.</p>
        </Section>

        <Section title="5. In-Game Economy & Virtual Items">
          <p>All in-game coins, upgrades, auto-tappers, and virtual items are <strong style={{ color: "#fff" }}>virtual goods with no real-world monetary value</strong>. They cannot be exchanged for real currency, transferred between accounts, or redeemed outside of the Platform.</p>
          <p style={{ marginTop: 10 }}>Virtual items may be modified, removed, or reset by us at any time, including during season resets or game updates, without compensation or notice.</p>
        </Section>

        <Section title="6. Leaderboard Prizes & Rewards">
          <p>Degen Clicker operates competitive leaderboard seasons with prize distributions to top-ranked players. Prizes may be paid in USDC, $DEGEN CLICKER tokens, or other assets as determined by the Platform.</p>
          <p style={{ marginTop: 10 }}>Important conditions:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "You must provide a valid Solana wallet address to receive prizes",
              "Prize distributions are at our sole discretion and may be modified or cancelled",
              "We are not responsible for prizes lost due to incorrect wallet addresses provided by users",
              "Prizes may be subject to tax obligations in your jurisdiction — you are solely responsible for any applicable taxes",
              "Suspected cheating, botting, or manipulation will result in disqualification and account termination",
              "We reserve the right to audit any account before distributing prizes",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="7. $DEGEN CLICKER Token — Risk Disclosure">
          <div style={{
            background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "14px 16px", marginBottom: 14,
          }}>
            <strong style={{ color: "#f87171" }}>NOT FINANCIAL ADVICE.</strong>
            <span style={{ color: "#bbb" }}> Nothing on this Platform constitutes financial, investment, legal, or tax advice. The $DEGEN CLICKER token is a speculative digital asset with high volatility and risk of total loss.</span>
          </div>
          <p>By interacting with the $DEGEN CLICKER (DEGEN) token, you acknowledge:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Cryptocurrency tokens are highly speculative and volatile — you could lose your entire investment",
              "Token prices are determined by open market forces and we do not guarantee any value",
              "We are not registered as a financial institution, investment advisor, or broker-dealer",
              "Regulatory treatment of tokens varies by jurisdiction and may change — you are responsible for compliance",
              "Smart contracts and blockchain transactions are irreversible — always verify before transacting",
              "Past performance of any token does not guarantee future results",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="8. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Use bots, scripts, or automation tools to artificially inflate your tap count or game progress (except shop auto-tappers purchased within the game)",
              "Exploit bugs or vulnerabilities in the Platform",
              "Attempt to hack, reverse engineer, or disrupt the Platform or its infrastructure",
              "Create multiple accounts to gain unfair advantage",
              "Use the Platform for money laundering or any illegal activity",
              "Impersonate other users or Degen Clicker team members",
              "Share, sell, or transfer your account to another person",
              "Violate any applicable law or regulation",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>Violation of these rules may result in immediate account suspension, disqualification from prizes, and/or legal action.</p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All content on the Platform — including but not limited to the game, graphics, logos, characters, sticker packs, text, and code — is owned by or licensed to Degen Clicker and is protected by applicable intellectual property laws.</p>
          <p style={{ marginTop: 10 }}>You may not reproduce, distribute, modify, or create derivative works from any Platform content without our prior written consent. The Degen Clicker name, logo, and brand are our trademarks and may not be used without permission.</p>
        </Section>

        <Section title="10. Third-Party Services">
          <p>The Platform integrates with third-party services including Supabase (database and authentication), Vercel (hosting), and the Solana blockchain. Your use of these services is also subject to their respective terms of service and privacy policies. We are not responsible for the practices of these third parties.</p>
        </Section>

        <Section title="11. Disclaimer of Warranties">
          <p>THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          <p style={{ marginTop: 10 }}>We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components. We do not guarantee that any prizes will be available at any given time.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEGEN CLICKER AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Loss of profits, revenue, or data",
              "Loss of tokens or cryptocurrency",
              "Loss of in-game progress or virtual items",
              "Unauthorized access to your account",
              "Service interruptions or downtime",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>Our total liability to you for any claim arising from use of the Platform shall not exceed the total amount of prizes you have received from us in the 30 days preceding the claim.</p>
        </Section>

        <Section title="13. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless Degen Clicker and its operators from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.</p>
        </Section>

        <Section title="14. Governing Law & Dispute Resolution">
          <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Platform shall first be attempted to be resolved through good-faith negotiation.</p>
          <p style={{ marginTop: 10 }}>If a dispute cannot be resolved informally, it shall be submitted to binding arbitration. You waive any right to a jury trial or to participate in a class-action lawsuit to the extent permitted by law.</p>
        </Section>

        <Section title="15. Changes to Terms">
          <p>We reserve the right to modify these Terms at any time. Changes will be posted to this page with an updated &quot;Last updated&quot; date. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
          <p style={{ marginTop: 10 }}>We encourage you to review these Terms periodically.</p>
        </Section>

        <Section title="16. Contact">
          <p>For questions about these Terms, contact us via:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>Telegram: <a href="https://t.me/degenclicker" target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc" }}>t.me/degenclicker</a></li>
            <li style={{ marginBottom: 6 }}>Twitter / X: <a href="https://x.com/degenclickersol" target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc" }}>@degenclickersol</a></li>
          </ul>
        </Section>

        {/* Footer */}
        <div style={{
          paddingTop: 32, borderTop: "1px solid rgba(168,85,247,0.15)",
          display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "center",
        }}>
          <span style={{ color: "#444", fontSize: 12, flex: 1 }}>© 2025 Degen Clicker. All rights reserved.</span>
          <Link href="/privacy" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/whitepaper" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Whitepaper</Link>
          <Link href="/" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </div>
  );
}
