import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatR(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getPnlColor(value: number | null | undefined): string {
  if (value == null) return "text-foreground"
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  if (value < 0) return "text-red-500 dark:text-red-400"
  return "text-muted-foreground"
}

export function getDayBgColor(pnl: number | null): string {
  if (pnl == null) return ""
  if (pnl > 0) return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  if (pnl < 0) return "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
  return ""
}
