"use client"
import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, getPnlColor, getDayBgColor, formatPercent } from "@/lib/utils"
import { EMOTION_EMOJI } from "@/lib/constants"
import { InstrumentIcon } from "@/components/ui/instrument-icon"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────

import { DEMO_TRADES, type DemoTrade } from "@/lib/demo-data"
type Trade = DemoTrade

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
  const avgR = trades.length > 0 ? trades.reduce((sum, t) => sum + (t.returnR ?? 0), 0) / trades.length : 0
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
  const weeks: { label: string; days: number; pnl: number }[] = []
  let current = startOfWeek(start, { weekStartsOn: 1 })
  let weekNum = 1
  while (current <= end) {
    const wEnd = endOfWeek(current, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: current, end: wEnd > end ? end : wEnd })
    const weekTrades = trades.filter((t) => {
      const d = new Date(t.entryDate)
      return d >= current && d <= wEnd
    })
    const pnl = weekTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
    const tradingDays = new Set(weekTrades.map((t) => format(new Date(t.entryDate), "yyyy-MM-dd"))).size
    weeks.push({ label: `Week ${weekNum}`, days: tradingDays, pnl })
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
    count: trades.filter((t) => (t.returnR ?? 0) > b.min && (t.returnR ?? 0) <= b.max).length,
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
        "relative min-h-[80px] w-full rounded-xl border p-2 text-left transition-all duration-150 hover:shadow-md hover:border-violet-300",
        !isCurrentMonth && "opacity-30",
        isSelected && "ring-2 ring-violet-500 border-violet-400",
        todayDay && !isSelected && "border-violet-300 bg-violet-50 dark:bg-violet-950/20",
        hasTrades && pnl !== null ? getDayBgColor(pnl) : "bg-card",
        !hasTrades && "hover:bg-muted/50"
      )}
    >
      <span className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
        todayDay && "bg-violet-600 text-white",
        !todayDay && "text-foreground"
      )}>
        {format(day, "d")}
      </span>
      {hasTrades && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[10px] text-muted-foreground font-medium">{dayData!.trades.length} Trade{dayData!.trades.length !== 1 ? "s" : ""}</p>
          <p className={cn("text-xs font-bold", getPnlColor(pnl))}>
            {pnl !== null ? formatCurrency(pnl, true) : "—"}
          </p>
        </div>
      )}
    </button>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ selectedDate, trades }: { selectedDate: Date | null; trades: Trade[] }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const touchStartY = React.useRef<number | null>(null)
  const asideRef = React.useRef<HTMLElement | null>(null)
  const isDragging = React.useRef(false)
  const isOpenRef = React.useRef(false)

  const dayTrades = selectedDate
    ? trades.filter((t) => isSameDay(new Date(t.entryDate), selectedDate))
    : []
  const dayPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
  const stats = computeStats(dayTrades)

  React.useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768
  const getClosedY = () => asideRef.current ? asideRef.current.getBoundingClientRect().height - 100 : 0

  const applyTranslate = (y: number, animate: boolean) => {
    if (!asideRef.current) return
    if (!isMobile()) {
      // On desktop: clear any transform so sidebar is always visible
      asideRef.current.style.transform = ""
      asideRef.current.style.transition = ""
      return
    }
    asideRef.current.style.transition = animate ? "transform 450ms cubic-bezier(0.32,0.72,0,1)" : "none"
    asideRef.current.style.transform = `translateY(${y}px)`
  }

  // Sync on open/close state change
  React.useEffect(() => {
    applyTranslate(isOpen ? 0 : getClosedY(), true)
  }, [isOpen]) // eslint-disable-line

  // Set initial position on mount + handle resize
  React.useEffect(() => {
    const init = () => {
      if (!asideRef.current) return
      if (isMobile()) {
        applyTranslate(isOpenRef.current ? 0 : getClosedY(), false)
      } else {
        asideRef.current.style.transform = ""
        asideRef.current.style.transition = ""
      }
    }
    requestAnimationFrame(init)
    window.addEventListener("resize", init)
    return () => window.removeEventListener("resize", init)
  }, []) // eslint-disable-line

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile()) return
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
    if (asideRef.current) asideRef.current.style.transition = "none"
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null || !asideRef.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    const closedY = getClosedY()
    const baseY = isOpenRef.current ? 0 : closedY
    const newY = Math.max(0, Math.min(closedY, baseY + delta))
    asideRef.current.style.transform = `translateY(${newY}px)`
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (!isOpenRef.current && delta < -50) {
      setIsOpen(true)
    } else if (isOpenRef.current && delta > 50) {
      setIsOpen(false)
    } else {
      applyTranslate(isOpenRef.current ? 0 : getClosedY(), true)
    }
    touchStartY.current = null
    isDragging.current = false
  }

  return (
    <aside
      ref={asideRef as React.RefObject<HTMLElement>}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        // Desktop: static sidebar
        "md:w-80 md:shrink-0 md:border-l md:bg-card md:flex md:flex-col md:h-full md:overflow-y-auto md:relative md:z-0 md:rounded-none md:shadow-none md:border-t-0",
        // Mobile: fixed bottom drawer
        "fixed left-0 right-0 bottom-0 z-50 flex flex-col bg-card/95 backdrop-blur-xl rounded-t-3xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.3)]",
        "h-[85vh] md:h-full touch-none md:touch-auto"
      )}
    >
      {/* Notch — mobile only */}
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
          <div className={cn("text-3xl font-bold tracking-tight", getPnlColor(dayPnl))}>
            {formatCurrency(dayPnl)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">Net PNL</p>
        </div>
      </div>

      <div className="flex flex-col min-h-0 overflow-y-auto touch-auto overscroll-none">
        {/* KPIs */}
        <div className="p-4 border-b grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold">{formatPercent(stats.winRate)}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
          </div>
          <div>
            <p className={cn("text-lg font-bold", getPnlColor(stats.avgR))}>
              {stats.avgR >= 0 ? "+" : ""}{stats.avgR.toFixed(2)}R
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Average R</p>
          </div>
          <div>
            <p className="text-lg font-bold">{dayTrades.length} <span className="text-muted-foreground text-sm">/ {dayTrades.length}</span></p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
          </div>
          <div className="flex gap-3">
            <div>
              <p className="text-lg font-bold text-emerald-600">{stats.wins}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{stats.losses}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Losses</p>
            </div>
          </div>
        </div>

        {/* Trade list */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trades</p>
            <p className="text-[10px] text-muted-foreground">Tap to see details</p>
          </div>
          <div className="flex gap-1 mb-3">
            {["All", "Wins", "Losses"].map((f) => (
              <button key={f} className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                f === "All" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}>{f}</button>
            ))}
          </div>
          {dayTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No trades on this day</p>
              <Link href="/trades/new">
                <Button variant="ghost" size="sm" className="mt-2 text-violet-600">+ Add Trade</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dayTrades.map((trade) => (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="relative overflow-hidden flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md p-3 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all cursor-pointer group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm font-bold text-violet-500 group-hover:text-violet-400 group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all">
                      <InstrumentIcon instrument={trade.instrument} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{trade.instrument}</span>
                        <Badge variant={trade.direction === "Buy" ? "success" : "destructive"} className="text-[10px] px-1.5 py-0">
                          {trade.direction === "Buy" ? "+ " : "- "} {trade.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{format(new Date(trade.entryDate), "HH:mm")}</span>
                        {trade.reflection?.entryEmotion && (
                          <span className="text-xs">{EMOTION_EMOJI[trade.reflection.entryEmotion] || ""}</span>
                        )}
                      </div>
                    </div>
                    <span className={cn("text-sm font-bold", getPnlColor(trade.netPnl ?? null))}>
                      {trade.netPnl !== undefined ? formatCurrency(trade.netPnl, true) : "-"}
                    </span>
                  </div>
                </Link>
              ))}
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
              {weeks.map((week, i) => {
                const cur = i === weeks.length - 1
                const pos = week.pnl >= 0
                return (
                  <div key={week.label} className={cn("flex items-center rounded-xl px-3 py-2.5 gap-3", cur ? "bg-violet-500/10 border border-violet-500/25" : "bg-muted/40 border border-transparent")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate">{week.label}</p>
                        {cur && <span className="text-[9px] font-bold text-violet-500 bg-violet-500/15 px-1.5 py-0.5 rounded-full">Now</span>}
                      </div>
                      {week.days > 0 && <p className="text-[10px] text-muted-foreground">{week.days} day{week.days !== 1 ? "s" : ""}</p>}
                    </div>
                    {week.days > 0 ? (
                      <span className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold", pos ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500")}>{pos ? "▲" : "▼"} {formatCurrency(week.pnl, true)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [month, setMonth] = React.useState(new Date()) // Current month
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date())
  const [trades, setTrades] = React.useState<Trade[]>(DEMO_TRADES)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    const monthStr = format(month, 'yyyy-MM')
    fetch(`/api/trades?month=${monthStr}`)
      .then((r) => {
        if (!r.ok) throw new Error("API Error")
        return r.json()
      })
      .then((data) => {
        if (data.trades && data.trades.length > 0) {
          setTrades(data.trades)
        } else {
          // If no trades, empty array or keep demo? Let's use empty array if API connected but empty.
          // Wait, if no trades, we should probably set empty array to show "No trades". 
          // But if API error (unauthorized/no db), we fall back to DEMO_TRADES in catch.
          setTrades(data.trades || [])
        }
      })
      .catch((e) => {
        console.error(e)
        setTrades(DEMO_TRADES) // Fallback to demo data
      })
      .finally(() => setLoading(false))
  }, [month])

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
          <div className="p-2 sm:p-4 w-full"><div className="w-full">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
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
          </div>
          </div>

          {/* Monthly summary section */}
          <MonthlySummary trades={trades} month={month} />
        </div>
      </div>

      {/* Right sidebar */}
      <Sidebar selectedDate={selectedDate} trades={trades} />
    </div>
  )
}
