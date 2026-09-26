"use client"
import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, getPnlColor, getDayBgColor, formatPercent } from "@/lib/utils"
import { EMOTION_EMOJI } from "@/lib/constants"
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
  const dayTrades = selectedDate
    ? trades.filter((t) => isSameDay(new Date(t.entryDate), selectedDate))
    : []
  const dayPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0)
  const stats = computeStats(dayTrades)

  return (
    <aside className="w-80 shrink-0 border-l bg-card flex flex-col h-[calc(100vh-56px)] overflow-y-auto">
      {/* Day header */}
      <div className="p-4 border-b">
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
          <span className="text-base font-normal">.00</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">Net PNL</p>
      </div>

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
        {/* Filter tabs */}
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
                <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                  <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">
                    {trade.instrument.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{trade.instrument}</span>
                      <Badge variant={trade.direction === "Buy" ? "success" : "destructive"} className="text-[10px] px-1.5 py-0">
                        {trade.direction === "Buy" ? "↑" : "↓"} {trade.direction}
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
                    {trade.netPnl !== undefined ? formatCurrency(trade.netPnl, true) : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

function MonthlySummary({ trades, month }: { trades: Trade[]; month: Date }) {
  const stats = computeStats(trades)
  const dist = getRDistribution(trades)
  const weeks = getWeeks(month, trades)

  return (
    <div className="border-t bg-card">
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Bar chart + stats table */}
        <div>
          <h3 className="font-semibold text-base mb-4">Monthly Summary</h3>
          <div className="flex gap-6">
            <div className="flex-1 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                    formatter={(v: number) => [v, "Trades"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dist.map((entry, i) => (
                      <Cell key={i} fill={i < 2 ? "hsl(0 84% 60% / 0.8)" : "hsl(262 83% 58% / 0.8)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-sm w-44 shrink-0">
              {[
                { label: "Expectancy", value: `${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R` },
                { label: "Win rate", value: formatPercent(stats.winRate) },
                { label: "Avg Win", value: formatCurrency(stats.avgWin, true) },
                { label: "Avg Loss", value: formatCurrency(stats.avgLoss, true) },
                { label: "Best trade", value: formatCurrency(stats.best, true) },
                { label: "Worst trade", value: formatCurrency(stats.worst, true) },
                { label: "Total trades", value: trades.length.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="text-xs font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Weekly breakdown */}
        <div>
          <h3 className="font-semibold text-base mb-4">Weekly Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {weeks.map((week, i) => {
              const isCurrent = i === weeks.length - 1
              return (
                <div key={week.label} className={cn(
                  "rounded-xl border p-3 space-y-1",
                  isCurrent ? "border-violet-300 bg-violet-50 dark:bg-violet-950/20" : "bg-muted/30"
                )}>
                  {isCurrent && <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">Current</span>}
                  <p className="text-xs font-semibold">{week.label}</p>
                  {week.days > 0 ? (
                    <>
                      <Badge variant="secondary" className="text-[10px]">{week.days} day{week.days !== 1 ? "s" : ""}</Badge>
                      <p className={cn("text-sm font-bold", getPnlColor(week.pnl))}>{formatCurrency(week.pnl, true)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
              )
            })}
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
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Calendar area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-background">
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
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

          {/* Monthly summary section */}
          <MonthlySummary trades={trades} month={month} />
        </div>
      </div>

      {/* Right sidebar */}
      <Sidebar selectedDate={selectedDate} trades={trades} />
    </div>
  )
}