"use client"

import dynamic from "next/dynamic"

// Load domain UI lazily to keep initial bundle small
const GameUI = dynamic(() => import("@qgomoku/ui/GameUI"), { ssr: false })

export default function Page() {
  return <GameUI />
}
