"use client"
import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, getPnlColor, getDayBgColor, formatPercent } from "@/lib/utils"
import { EMOTION_EMOJI } from "@/lib/constants"
import { InstrumentIcon } from "@/components/ui/instrument-icon"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────

import { type DemoTrade } from "@/lib/demo-data"
export type Trade = DemoTrade

interface DayData {
  date: Date
  trades: Trade[]
  pnl: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDayMap(trades: Trade[]): Map<string, Trade[]> {
  const map = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = format(new Date(t.entryDate), "yyyy-MM-dd")
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return map
}

function computeStats(trades: Trade[]) {
  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0)
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0)
  const totalPnl = trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
  const avgR = trades.length > 0 ? trades.reduce((sum, t) => {
    const r = t.returnR ?? (t.netPnl != null && t.riskR ? t.netPnl / t.riskR : 0)
    return sum + r
  }, 0) / trades.length : 0
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) / losses.length : 0
  const expectancy = wins.length > 0 && losses.length > 0 ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss : 0
  const best = trades.length > 0 ? Math.max(...trades.map((t) => t.netPnl ?? 0)) : 0
  const worst = trades.length > 0 ? Math.min(...trades.map((t) => t.netPnl ?? 0)) : 0
  return { wins: wins.length, losses: losses.length, totalPnl, winRate, avgR, avgWin, avgLoss, expectancy, best, worst }
}

// ─── Weekly Breakdown ────────────────────────────────────────────────────────

function getWeeks(month: Date, trades: Trade[]) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const today = new Date()
  const isThisMonth = isSameMonth(today, month)
  const weeks: { label: string; dateRange: string; days: number; pnl: number; isCurrent: boolean }[] = []
  let current = startOfWeek(start, { weekStartsOn: 1 })
  let weekNum = 1

  while (current <= end) {
    const wEnd = endOfWeek(current, { weekStartsOn: 1 })
    const wStartInMonth = current < start ? start : current
    const wEndInMonth = wEnd > end ? end : wEnd

    const weekTrades = trades.filter((t) => {
      const d = new Date(t.entryDate)
      return d >= wStartInMonth && d <= wEndInMonth
    })
    const pnl = weekTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
    const tradingDays = new Set(weekTrades.map((t) => format(new Date(t.entryDate), "yyyy-MM-dd"))).size

    const dateRange = isSameDay(wStartInMonth, wEndInMonth)
      ? format(wStartInMonth, "MMM d")
      : isSameMonth(wStartInMonth, wEndInMonth)
      ? `${format(wStartInMonth, "MMM d")} – ${format(wEndInMonth, "d")}`
      : `${format(wStartInMonth, "MMM d")} – ${format(wEndInMonth, "MMM d")}`

    const isCurrent = isThisMonth && today >= startOfDay(wStartInMonth) && today <= endOfDay(wEndInMonth)

    weeks.push({
      label: `Week ${weekNum}`,
      dateRange,
      days: tradingDays,
      pnl,
      isCurrent,
    })

    current = new Date(wEnd.getTime() + 86400000)
    weekNum++
  }
  return weeks
}

// ─── R Distribution Chart Data ───────────────────────────────────────────────

function getRDistribution(trades: Trade[]) {
  const buckets = [
    { label: "≤-2R", min: -Infinity, max: -2 },
    { label: "-1R to 0", min: -2, max: 0 },
    { label: "0 to 1R", min: 0, max: 1 },
    { label: "1R to 2R", min: 1, max: 2 },
    { label: "≥2R", min: 2, max: Infinity },
  ]
  return buckets.map((b) => ({
    label: b.label,
    count: trades.filter((t) => {
      const r = t.returnR ?? (t.netPnl != null && t.riskR ? t.netPnl / t.riskR : 0)
      return r > b.min && r <= b.max
    }).length,
  }))
}

// ─── Calendar Day Cell ───────────────────────────────────────────────────────

function DayCell({ day, dayData, isCurrentMonth, selectedDate, onSelect }: {
  day: Date
  dayData?: DayData
  isCurrentMonth: boolean
  selectedDate: Date | null
  onSelect: (date: Date) => void
}) {
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
  const todayDay = isToday(day)
  const hasTrades = dayData && dayData.trades.length > 0
  const pnl = dayData?.pnl ?? null

  return (
    <button
      onClick={() => onSelect(day)}
      className={cn(
        "relative min-h-[72px] sm:min-h-[82px] w-full rounded-xl border px-1 py-1.5 sm:p-2 text-left transition-all duration-150 hover:shadow-md hover:border-violet-300 flex flex-col justify-between overflow-hidden",
        !isCurrentMonth && "opacity-30",
        isSelected && "ring-2 ring-violet-500 border-violet-400",
        todayDay && !isSelected && "border-violet-300 bg-violet-50 dark:bg-violet-950/20",
        hasTrades && pnl !== null ? getDayBgColor(pnl) : "bg-card",
        !hasTrades && "hover:bg-muted/50"
      )}
    >
      <span className={cn(
        "inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold shrink-0",
        todayDay && "bg-violet-600 text-white",
        !todayDay && "text-foreground"
      )}>
        {format(day, "d")}
      </span>
      {hasTrades && (
        <div className="w-full min-w-0 overflow-hidden text-left mt-auto">
          <p className="text-[8.5px] sm:text-[10px] text-muted-foreground font-medium truncate leading-none mb-0.5">
            {dayData!.trades.length} {dayData!.trades.length === 1 ? "Trade" : "Trades"}
          </p>
          <p
            className={cn(
              "text-[9.5px] sm:text-xs font-bold truncate leading-tight tracking-tighter tabular-nums",
              getPnlColor(pnl)
            )}
            title={pnl !== null ? formatCurrency(pnl, false) : undefined}
          >
            {pnl !== null ? formatCurrency(pnl, true) : "—"}
          </p>
        </div>
      )}
    </button>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ selectedDate, trades, loading }: { selectedDate: Date | null; trades: Trade[]; loading?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const touchStartY = React.useRef<number | null>(null)
  const asideRef = React.useRef<HTMLElement | null>(null)
  const isDragging = React.useRef(false)
  const isOpenRef = React.useRef(false)

  React.useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  React.useEffect(() => {
    const el = asideRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      isDragging.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return
      const currentY = e.touches[0].clientY
      const diffY = currentY - touchStartY.current

      const scrollContainer = el.querySelector('.overflow-y-auto')
      const isScrolledToTop = !scrollContainer || scrollContainer.scrollTop <= 0

      if (diffY > 10 && isOpenRef.current && isScrolledToTop) {
        isDragging.current = true
      } else if (diffY < -10 && !isOpenRef.current) {
        isDragging.current = true
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current || touchStartY.current === null) {
        touchStartY.current = null
        isDragging.current = false
        return
      }
      const endY = e.changedTouches[0].clientY
      const diffY = endY - touchStartY.current

      if (diffY > 40 && isOpenRef.current) {
        setIsOpen(false)
      } else if (diffY < -40 && !isOpenRef.current) {
        setIsOpen(true)
      }

      touchStartY.current = null
      isDragging.current = false
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const dayTrades = selectedDate
    ? trades.filter((t) => isSameDay(new Date(t.entryDate), selectedDate))
    : []

  const dayPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
  const stats = computeStats(dayTrades)

  return (
    <aside
      ref={asideRef}
      className={cn(
        "fixed md:static inset-x-0 bottom-0 z-40 bg-card border-t md:border-t-0 md:border-l flex flex-col transition-all duration-300 ease-in-out md:translate-y-0",
        "w-full md:w-80 lg:w-96 shrink-0",
        "shadow-2xl md:shadow-none",
        isOpen ? "h-[85vh] rounded-t-3xl" : "h-[100px] md:h-full rounded-t-2xl md:rounded-none"
      )}
    >
      <div className="relative shrink-0">
        <button
          className="md:hidden absolute left-1/2 -top-5 -translate-x-1/2 bg-card border border-b-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-xl w-14 h-5 flex items-center justify-center text-muted-foreground z-10 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronUp className={cn("h-4 w-4 transition-transform duration-500", isOpen ? "rotate-180" : "")} />
        </button>

        {/* Day header */}
        <div className="p-4 pb-3 border-b flex flex-col h-[100px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {selectedDate ? format(selectedDate, "EEE, MMMM d") : "Select a day"}
              {selectedDate && isToday(selectedDate) && (
                <Badge variant="purple" className="ml-2 text-[10px]">Today</Badge>
              )}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32 my-0.5" />
          ) : (
            <div className={cn("text-3xl font-bold tracking-tight", getPnlColor(dayPnl))}>
              {formatCurrency(dayPnl)}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">Net PNL</p>
        </div>
      </div>

      <div className="flex flex-col min-h-0 overflow-y-auto touch-auto overscroll-none">
        {/* KPIs */}
        <div className="p-4 border-b grid grid-cols-2 gap-3">
          <div>
            {loading ? (
              <Skeleton className="h-6 w-16 mb-1" />
            ) : (
              <p className="text-lg font-bold">{formatPercent(stats.winRate)}</p>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-6 w-16 mb-1" />
            ) : (
              <p className={cn("text-lg font-bold", getPnlColor(stats.avgR))}>
                {stats.avgR >= 0 ? "+" : ""}{stats.avgR.toFixed(2)}R
              </p>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Average R</p>
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-6 w-16 mb-1" />
            ) : (
              <p className="text-lg font-bold">{dayTrades.length} <span className="text-muted-foreground text-sm">/ {dayTrades.length}</span></p>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
          </div>
          <div className="flex gap-3">
            <div>
              {loading ? (
                <Skeleton className="h-6 w-8 mb-1" />
              ) : (
                <p className="text-lg font-bold text-emerald-600">{stats.wins}</p>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-6 w-8 mb-1" />
              ) : (
                <p className="text-lg font-bold text-red-500">{stats.losses}</p>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Losses</p>
            </div>
          </div>
        </div>

        {/* Trade List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trades ({dayTrades.length})
            </h4>
            <Link href="/trades/new">
              <Button size="sm" variant="outline" className="h-7 text-xs">
                + Add Trade
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-md" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : dayTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No trades recorded</p>
              <p className="text-[11px] mt-0.5">Click + Add Trade to log a trade for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayTrades.map((t) => {
                const pos = (t.netPnl ?? 0) >= 0
                return (
                  <Link key={t.id} href={`/trades/${t.id}`}>
                    <div className="rounded-xl border p-3 hover:border-violet-400 transition-all bg-card hover:shadow-sm cursor-pointer group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <InstrumentIcon instrument={t.instrument} />
                          <span className="font-semibold text-xs">{t.instrument}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            t.direction === "Buy"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}>
                            {t.direction.toUpperCase()}
                          </span>
                        </div>
                        <span className={cn("text-xs font-bold", getPnlColor(t.netPnl))}>
                          {t.netPnl !== undefined ? formatCurrency(t.netPnl) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t.lotSize} lots · {t.session || "—"}</span>
                        {t.returnR !== undefined && (
                          <span className={cn("font-medium", getPnlColor(t.returnR))}>
                            {t.returnR >= 0 ? "+" : ""}{t.returnR.toFixed(2)}R
                          </span>
                        )}
                      </div>
                      {t.reflection?.entryEmotion && (
                        <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span>{EMOTION_EMOJI[t.reflection.entryEmotion] || "•"}</span>
                            <span>{t.reflection.entryEmotion}</span>
                          </span>
                          {t.reflection.planFollowed !== undefined && (
                            <span className={cn(
                              "font-medium",
                              t.reflection.planFollowed ? "text-emerald-600" : "text-amber-500"
                            )}>
                              {t.reflection.planFollowed ? "Plan Followed" : "Deviated"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

function MonthlySummary({ trades, month }: { trades: Trade[]; month: Date }) {
  const stats = computeStats(trades)
  const dist = getRDistribution(trades)
  const weeks = getWeeks(month, trades)
  const totalPnl = trades.reduce((s, t) => s + (t.netPnl ?? 0), 0)

  const statCards = [
    { label: "Net P&L",     value: formatCurrency(totalPnl, true),                                       sub: `${trades.length} trades`,          color: totalPnl >= 0 ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" : "from-red-500/20 to-red-500/5 border-red-500/30",   textColor: totalPnl >= 0 ? "text-emerald-500" : "text-red-500" },
    { label: "Win Rate",    value: formatPercent(stats.winRate),                                          sub: `${stats.wins}W / ${stats.losses}L`, color: "from-violet-500/20 to-violet-500/5 border-violet-500/30",   textColor: "text-violet-500" },
    { label: "Expectancy",  value: `${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`, sub: `Avg ${stats.avgR.toFixed(2)}R`,     color: stats.expectancy >= 0 ? "from-sky-500/20 to-sky-500/5 border-sky-500/30" : "from-orange-500/20 to-orange-500/5 border-orange-500/30", textColor: stats.expectancy >= 0 ? "text-sky-500" : "text-orange-500" },
    { label: "Best Trade",  value: formatCurrency(stats.best, true),                                     sub: "Month high",                        color: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20", textColor: "text-emerald-500" },
    { label: "Worst Trade", value: formatCurrency(stats.worst, true),                                    sub: "Month low",                         color: "from-red-500/15 to-red-500/5 border-red-500/20",             textColor: "text-red-500" },
    { label: "Avg Win",     value: formatCurrency(stats.avgWin, true),                                   sub: `vs ${formatCurrency(stats.avgLoss, true)} loss`, color: "from-slate-500/10 to-slate-500/5 border-slate-500/20", textColor: "text-foreground" },
  ]

  return (
    <div className="border-t bg-card">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-700 shrink-0" />
        <h3 className="font-bold text-base tracking-tight">Monthly Summary</h3>
        <span className="ml-auto text-xs text-muted-foreground">{format(month, "MMMM yyyy")}</span>
      </div>

      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* LEFT: stat cards (top 3) + chart */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {statCards.slice(0, 3).map((s) => (
              <div key={s.label} className={cn("rounded-2xl border bg-gradient-to-br p-3 flex flex-col gap-1", s.color)}>
                <p className={cn("text-sm lg:text-base font-extrabold leading-none tracking-tight", s.textColor)}>{s.value}</p>
                <p className="text-[10px] font-semibold text-foreground/70">{s.label}</p>
                <p className="text-[9px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">R-Distribution</p>
            <div className="h-32 lg:h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist} margin={{ top: 2, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 11 }} formatter={(v: any) => [v, "Trades"]} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>{dist.map((_, i) => <Cell key={i} fill={i < 2 ? "hsl(0 84% 60%/0.85)" : "hsl(262 83% 58%/0.85)"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: extra stat cards (bottom 3) + weekly breakdown */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {statCards.slice(3).map((s) => (
              <div key={s.label} className={cn("rounded-2xl border bg-gradient-to-br p-3 flex flex-col gap-1", s.color)}>
                <p className={cn("text-sm lg:text-base font-extrabold leading-none tracking-tight", s.textColor)}>{s.value}</p>
                <p className="text-[10px] font-semibold text-foreground/70">{s.label}</p>
                <p className="text-[9px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Weekly Breakdown</p>
            <div className="space-y-2">
              {weeks.map((week) => {
                const cur = week.isCurrent
                const pos = week.pnl >= 0
                return (
                  <div key={week.label} className={cn("flex items-center rounded-xl px-3 py-2.5 gap-3", cur ? "bg-violet-500/10 border border-violet-500/25" : "bg-muted/40 border border-transparent")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold">{week.label}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">· {week.dateRange}</span>
                        <span className="text-[10px] text-muted-foreground">({week.days} {week.days === 1 ? "trading day" : "trading days"})</span>
                        {cur && <Badge variant="purple" className="text-[9px] px-1.5 py-0 h-4">Current</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xs font-bold", pos ? "text-emerald-500" : "text-red-500")}>
                        {formatCurrency(week.pnl)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function CalendarSkeletonGrid() {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[72px] sm:min-h-[82px] w-full rounded-xl border border-muted/40 px-1 py-1.5 sm:p-2 bg-card flex flex-col justify-between overflow-hidden"
        >
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="space-y-1 mt-auto">
            <Skeleton className="h-2 w-8 sm:w-10" />
            <Skeleton className="h-3 w-10 sm:w-14" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MonthlySummarySkeleton({ month }: { month: Date }) {
  return (
    <div className="border-t bg-card">
      <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-violet-500/40 shrink-0" />
        <h3 className="font-bold text-base tracking-tight">Monthly Summary</h3>
        <span className="ml-auto text-xs text-muted-foreground">{format(month, "MMMM yyyy")}</span>
      </div>

      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border p-3 flex flex-col gap-2 bg-muted/15 border-border/50">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">R-Distribution</p>
            <Skeleton className="h-32 lg:h-40 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border p-3 flex flex-col gap-2 bg-muted/15 border-border/50">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Weekly Breakdown</p>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Client Component ──────────────────────────────────────────

export function DashboardClient({ initialTrades = [] }: { initialTrades?: Trade[] }) {
  const [month, setMonth] = React.useState(new Date()) // Current month
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date())
  const [trades, setTrades] = React.useState<Trade[]>(initialTrades)
  const [loading, setLoading] = React.useState(false)
  const isInitialMount = React.useRef(true)

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setLoading(true)
    const monthStr = format(month, 'yyyy-MM')
    fetch(`/api/trades?month=${monthStr}`)
      .then((r) => {
        if (!r.ok) throw new Error("API Error")
        return r.json()
      })
      .then((data) => {
        setTrades(data.trades || [])
      })
      .catch((e) => {
        console.error(e)
        setTrades([])
      })
      .finally(() => setLoading(false))
  }, [month])

  React.useEffect(() => {
    if (initialTrades && initialTrades.length > 0 && isInitialMount.current) {
      setTrades(initialTrades)
    }
  }, [initialTrades])

  const dayMap = React.useMemo(() => buildDayMap(trades), [trades])
  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden md:overflow-hidden">
      {/* Calendar area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[100px] md:pb-0">
        {/* Calendar header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b bg-background">
          <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">{format(month, "MMMM yyyy")}</h2>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>This Month</Button>
          </div>
        </div>

        {/* Calendar grid + summary */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pb-[100px] md:pb-0">
          <div className="p-1 sm:p-4 w-full"><div className="w-full">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            {loading ? (
              <CalendarSkeletonGrid />
            ) : (
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd")
                  const dayTrades = dayMap.get(key) || []
                  const pnl = dayTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
                  return (
                    <DayCell
                      key={key}
                      day={day}
                      dayData={dayTrades.length > 0 ? { date: day, trades: dayTrades, pnl } : undefined}
                      isCurrentMonth={isSameMonth(day, month)}
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                    />
                  )
                })}
              </div>
            )}
          </div>
          </div>

          {/* Monthly summary section */}
          {loading ? (
            <MonthlySummarySkeleton month={month} />
          ) : (
            <MonthlySummary trades={trades} month={month} />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <Sidebar selectedDate={selectedDate} trades={trades} loading={loading} />
    </div>
  )
}
