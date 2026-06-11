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
      <Link href="/terms" style={{ color: "#888", fontSize: 12, padding: "5px 10px", textDecoration: "none" }}>Terms & Conditions</Link>
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{ color: "#888", fontSize: 13, minWidth: 160 }}>{label}</span>
      <span style={{ color: "#ccc", fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function Privacy() {
  return (
    <div style={{ minHeight: "100vh", background: "#060010", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <LegalNav />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 32, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#555", fontSize: 13 }}>Last updated: {LAST_UPDATED}</p>
          <p style={{ marginTop: 16, color: "#999", fontSize: 14, lineHeight: 1.7 }}>
            This Privacy Policy explains how Degen Clicker (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores,
            and protects information about you when you use our Platform at degen-tower.vercel.app.
            By using the Platform, you agree to the practices described in this policy.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p style={{ marginBottom: 14 }}>We collect the following categories of information:</p>

          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Account Information</p>
          <DataRow label="Email address" value="Collected at registration via Supabase Auth. Used for login and account recovery." />
          <DataRow label="Password" value="Stored as a secure hash by Supabase. We never store or have access to your plaintext password." />
          <DataRow label="Username" value="The display name you choose for the leaderboard." />

          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8 }}>Game Data</p>
          <DataRow label="Tap count" value="Your total taps and game session data, stored for leaderboard ranking." />
          <DataRow label="Character selection" value="Which in-game character you have equipped." />
          <DataRow label="Purchase history" value="Shop items you have purchased with in-game coins." />
          <DataRow label="XP & level" value="Your progression data including experience points and rank level." />

          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8 }}>Optional Information</p>
          <DataRow label="Solana wallet address" value="Only collected if you choose to add one. Required to receive prize payouts." />
          <DataRow label="Profile image" value="If you choose to upload a custom avatar." />

          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8 }}>Technical Data</p>
          <DataRow label="IP address" value="Collected by our hosting provider (Vercel) for security and abuse prevention." />
          <DataRow label="Browser / device info" value="Automatically collected by standard web infrastructure." />
          <DataRow label="Cookies" value="Session cookies used for authentication. See Section 6." />
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use collected information for the following purposes:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            {[
              "To provide, operate, and maintain the Platform and game",
              "To authenticate your account and keep it secure",
              "To display leaderboards and competitive rankings",
              "To distribute prizes and rewards to eligible players",
              "To detect and prevent cheating, fraud, and abuse",
              "To communicate important updates about the Service",
              "To improve and develop new features",
              "To comply with legal obligations",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>
            We do not sell your personal information to third parties.
            We do not use your data for advertising targeting.
          </p>
        </Section>

        <Section title="3. Data Storage & Security">
          <p>Your data is stored using <strong style={{ color: "#fff" }}>Supabase</strong> (a managed PostgreSQL database platform). Supabase provides:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 12 }}>
            {[
              "Encrypted data storage at rest",
              "TLS encryption for all data in transit",
              "Row-level security policies restricting data access per user",
              "SOC 2 Type II compliant infrastructure",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p>
            While we implement industry-standard security measures, no method of transmission over the internet
            or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
          </p>
          <p style={{ marginTop: 10 }}>
            Your Solana wallet address is stored in our database only if you choose to provide it.
            We never request or store your private keys, seed phrases, or wallet signatures.
          </p>
        </Section>

        <Section title="4. Data Sharing & Third Parties">
          <p>We share data with the following third-party services necessary to operate the Platform:</p>
          <div style={{ marginTop: 12 }}>
            {[
              {
                name: "Supabase",
                desc: "Database, authentication, and real-time data. Supabase processes your account data on our behalf.",
                link: "https://supabase.com/privacy",
              },
              {
                name: "Vercel",
                desc: "Website hosting and edge delivery. Vercel may log IP addresses and request metadata.",
                link: "https://vercel.com/legal/privacy-policy",
              },
              {
                name: "Solana Blockchain",
                desc: "Public blockchain for token transactions and prize payouts. Wallet addresses and transactions are permanently public on-chain.",
                link: "https://solana.com",
              },
            ].map(({ name, desc, link }) => (
              <div key={name} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.12)",
                borderRadius: 10, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{name}</span>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc", fontSize: 11 }}>Privacy Policy →</a>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>
            We may also disclose your information if required by law, court order, or to protect the rights,
            property, or safety of Degen Clicker, its users, or the public.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your data for as long as your account is active or as needed to provide the Service. Specifically:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Account data is retained while your account exists",
              "Game data and leaderboard history may be retained for historical records even after account deletion",
              "Season data may be archived permanently for transparency",
              "If you delete your account, we will remove your personal data within 30 days, except where retention is required by law",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>
            Note: Blockchain transactions (e.g., prize payouts to your Solana wallet) are <strong style={{ color: "#fff" }}>permanent and cannot be deleted</strong> from the public blockchain.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>We use minimal, essential cookies to operate the Platform:</p>
          <div style={{ marginTop: 10 }}>
            {[
              { type: "Session Cookie", use: "Maintains your authenticated login session. Expires when you log out or close your browser." },
              { type: "Auth Token", use: "Secure token issued by Supabase to validate your identity. Stored in browser localStorage." },
            ].map(({ type, use }) => (
              <div key={type} style={{
                background: "rgba(168,85,247,0.05)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 8,
              }}>
                <span style={{ color: "#c084fc", fontWeight: 700, fontSize: 12 }}>{type}: </span>
                <span style={{ color: "#aaa", fontSize: 13 }}>{use}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {[
              "Right to access — request a copy of the data we hold about you",
              "Right to rectification — correct inaccurate data",
              "Right to erasure — request deletion of your account and personal data",
              "Right to data portability — receive your data in a portable format",
              "Right to object — object to certain processing of your data",
              "Right to restriction — request we limit processing of your data",
            ].map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 10 }}>
            To exercise any of these rights, contact us via Telegram or X (links below).
            You can also delete your account directly from the Settings tab within the game.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            The Platform is not directed to individuals under the age of 18. We do not knowingly collect
            personal information from anyone under 18. If we become aware that a minor has provided us with
            personal information, we will delete it immediately. If you are a parent or guardian and believe
            your child has used the Platform, please contact us.
          </p>
        </Section>

        <Section title="9. International Users">
          <p>
            Degen Clicker is operated globally. If you access the Platform from outside the country where
            our infrastructure is hosted, your information may be transferred to and processed in different
            jurisdictions. By using the Platform, you consent to this transfer and processing.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong style={{ color: "#fff" }}>GDPR (European Users):</strong> If you are located in the European Economic Area,
            our legal basis for processing your data is (a) contract performance — to provide the game service,
            and (b) legitimate interests — to prevent fraud and improve the Platform. You have the rights
            described in Section 7 and may contact your local data protection authority with concerns.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. Changes will be posted to this page with an updated
            &quot;Last updated&quot; date. We encourage you to review this policy regularly. Continued use of the Platform
            after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>For privacy-related questions, data requests, or concerns, reach us at:</p>
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
          <Link href="/terms" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Terms & Conditions</Link>
          <Link href="/whitepaper" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Whitepaper</Link>
          <Link href="/" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </div>
  );
}
