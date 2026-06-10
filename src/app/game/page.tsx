"use client";
import dynamic from "next/dynamic";

const TapGame = dynamic(() => import("./TapGame"), { ssr: false });

export default function GamePage() {
  return <TapGame />;
}
