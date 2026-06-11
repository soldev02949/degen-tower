"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";

const TapGame = dynamic(() => import("./TapGame"), { ssr: false });

export default function GamePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗼</div>
          <div style={{ color: "#f5c842", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em" }}>LOADING...</div>
        </div>
      </div>
    );
  }

  if (!user) return null; // redirecting

  return <TapGame />;
}
