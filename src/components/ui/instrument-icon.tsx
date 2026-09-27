import * as React from "react"
import { cn } from "@/lib/utils"

const FLAG_MAP: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", JPY: "jp",
  CHF: "ch", AUD: "au", CAD: "ca", NZD: "nz",
  GER: "de", FRA: "fr", ESP: "es", JP: "jp",
  AUS: "au", HK: "hk", UK: "gb", US: "us", EU: "eu"
}

export function InstrumentIcon({ instrument, className }: { instrument: string, className?: string }) {
  if (!instrument) return null
  
  if (instrument.includes("BTC")) return <span className={cn("text-lg", className)}>₿</span>
  if (instrument.includes("ETH")) return <span className={cn("text-lg", className)}>⟠</span>
  if (instrument.includes("XAU") || instrument === "GOLD") return <span className={cn("text-lg", className)}>🟡</span>
  if (instrument.includes("XAG") || instrument === "SILVER") return <span className={cn("text-lg", className)}>⚪</span>
  if (instrument.includes("OIL")) return <span className={cn("text-lg", className)}>🛢️</span>
  
  const base = instrument.substring(0, 3)
  const quote = instrument.substring(3, 6)
  
  if (FLAG_MAP[base] && FLAG_MAP[quote]) {
    return (
      <div className={cn("flex items-center -space-x-1.5", className)}>
        <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[base]}.svg`} alt={base} className="w-5 h-5 rounded-full ring-2 ring-background z-10" />
        <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[quote]}.svg`} alt={quote} className="w-5 h-5 rounded-full ring-2 ring-background" />
      </div>
    )
  }
  
  const idxMatch = instrument.match(/^[A-Z]{2,3}/)
  if (idxMatch && FLAG_MAP[idxMatch[0]]) {
    return (
      <div className={cn("flex items-center", className)}>
        <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[idxMatch[0]]}.svg`} alt={idxMatch[0]} className="w-5 h-5 rounded-full" />
      </div>
    )
  }

  return <div className={cn("h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[10px] font-bold text-violet-500", className)}>{instrument.slice(0,2)}</div>
}