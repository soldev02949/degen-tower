"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const DegenGame = dynamic(() => import("./DegenGame"), { ssr: false });

export default function GamePage() {
  const router = useRouter();
  return <DegenGame onBack={() => router.push("/")} />;
}
