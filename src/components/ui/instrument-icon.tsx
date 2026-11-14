import * as React from "react"
import { cn } from "@/lib/utils"

const FLAG_MAP: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", JPY: "jp",
  CHF: "ch", AUD: "au", CAD: "ca", NZD: "nz",
  GER: "de", FRA: "fr", ESP: "es", JP: "jp",
  AUS: "au", HK: "hk", UK: "gb", US: "us", EU: "eu",
  NAS: "us", NDX: "us", NQ: "us", USTEC: "us"
}

export function InstrumentIcon({ instrument, className }: { instrument: string, className?: string }) {
  if (!instrument) return null
  
  const upper = instrument.toUpperCase().trim()

  if (upper.includes("BTC")) return <span className={cn("text-lg", className)}>₿</span>
  if (upper.includes("ETH")) return <span className={cn("text-lg", className)}>⟠</span>
  if (upper.includes("BNB")) return <span className={cn("text-lg", className)}>🟡</span>
  if (upper.includes("SOL")) return <span className={cn("text-lg", className)}>🟣</span>
  if (upper.includes("XRP")) return <span className={cn("text-lg", className)}>✖️</span>
  if (upper.includes("ADA")) return <span className={cn("text-lg", className)}>🔵</span>
  if (upper.includes("DOGE")) return <span className={cn("text-lg", className)}>🐕</span>
  if (upper.includes("XAU") || upper === "GOLD") return <span className={cn("text-lg", className)}>🟡</span>
  if (upper.includes("XAG") || upper === "SILVER") return <span className={cn("text-lg", className)}>⚪</span>
  if (upper.includes("OIL")) return <span className={cn("text-lg", className)}>🛢️</span>
  
  if (upper.includes("NAS") || upper.includes("NDX") || upper.includes("NQ") || upper.includes("USTEC")) {
    return (
      <div className={cn("flex items-center", className)}>
        <img src="https://hatscripts.github.io/circle-flags/flags/us.svg" alt="NAS" className="w-5 h-5 rounded-full" />
      </div>
    )
  }

  const base = upper.substring(0, 3)
  const quote = upper.substring(3, 6)
  
  if (FLAG_MAP[base] && FLAG_MAP[quote]) {
    return (
      <div className={cn("flex items-center -space-x-1.5", className)}>
        <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[base]}.svg`} alt={base} className="w-5 h-5 rounded-full ring-2 ring-background z-10" />
        <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[quote]}.svg`} alt={quote} className="w-5 h-5 rounded-full ring-2 ring-background" />
      </div>
    )
  }
  
  const idxMatch = upper.match(/^[A-Z]{2,5}/)
  if (idxMatch) {
    const matchedKey = Object.keys(FLAG_MAP).find((key) => upper.startsWith(key))
    if (matchedKey && FLAG_MAP[matchedKey]) {
      return (
        <div className={cn("flex items-center", className)}>
          <img src={`https://hatscripts.github.io/circle-flags/flags/${FLAG_MAP[matchedKey]}.svg`} alt={matchedKey} className="w-5 h-5 rounded-full" />
        </div>
      )
    }
  }

  return <div className={cn("h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[10px] font-bold text-violet-500", className)}>{instrument.slice(0,2)}</div>
}
