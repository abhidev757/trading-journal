"use client"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns"
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Focus, Share2, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, getPnlColor, formatR } from "@/lib/utils"
import { EMOTION_EMOJI, EMOTION_COLORS } from "@/lib/constants"
import { InstrumentIcon } from "@/components/ui/instrument-icon"
import { DEMO_TRADES, type DemoTrade } from "@/lib/demo-data"
import Link from "next/link"

type Trade = DemoTrade

function formatDuration(start: string, end?: string) {
  if (!end) return "Open"
  const s = new Date(start), e = new Date(end)
  const mins = differenceInMinutes(e, s)
  if (mins < 60) return `${mins}m`
  const hrs = differenceInHours(e, s)
  if (hrs < 24) return `${hrs}h ${mins % 60}m`
  return `${differenceInDays(e, s)}d`
}

function ChartPanel({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
      <div className={cn(
        "aspect-video rounded-xl border overflow-hidden",
        url ? "" : "bg-muted/40 flex items-center justify-center"
      )}>
        {url
          ? <img src={url} alt={label} className="h-full w-full object-cover" />
          : <p className="text-xs text-muted-foreground">No chart uploaded</p>
        }
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueClass }: {
  label: string
  value: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-right", valueClass)}>{value}</span>
    </div>
  )
}

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [trade, setTrade] = React.useState<Trade | null>(null)
  const [loading, setLoading] = React.useState(true)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trade?")) return
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      router.push("/")
    } catch (err) {
      alert("Failed to delete trade")
    }
  }

  React.useEffect(() => {
    // Try to fetch from API first
    fetch(`/api/trades/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("API error")
        return r.json()
      })
      .then(({ trade: apiTrade }) => {
        if (!apiTrade) throw new Error("No data")
        setTrade(apiTrade)
        setLoading(false)
      })
      .catch(() => {
        // Fallback to demo data — find by ID or use first demo trade
        const demo = DEMO_TRADES.find((t) => t.id === id) ?? DEMO_TRADES[0]
        setTrade(demo)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Trade not found</p>
        <Link href="/"><Button variant="outline">Back to Journal</Button></Link>
      </div>
    )
  }

  const r = trade.reflection
  const c = trade.charts
  const hasLegs = trade.legs && trade.legs.length > 1

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
              Journal
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">
              <InstrumentIcon instrument={trade.instrument} />
            </div>
            <h1 className="text-lg font-bold">
              {trade.instrument}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {hasLegs ? `${trade.legs.length} positions` : "1 position"}
                {" "}· {format(new Date(trade.entryDate), "EEE, MMM d, yyyy")}
              </span>
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href={`/trades/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Trade Details */}
          <div className="space-y-5">
            <Card>
              <CardContent className="pt-6 space-y-5">
                {/* PnL */}
                <div>
                  <div className={cn("text-4xl font-bold tracking-tight", getPnlColor(trade.netPnl ?? null))}>
                    {trade.netPnl !== undefined ? formatCurrency(trade.netPnl) : "Open"}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Net PNL</p>
                </div>

                <Separator />

                {/* Core identity */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs text-violet-600 font-bold">
                        <InstrumentIcon instrument={trade.instrument} />
                      </div>
                      <span className="text-sm font-semibold">{trade.instrument}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Instrument</p>
                  </div>
                  <div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-semibold",
                      trade.direction === "Buy" ? "text-emerald-600" : "text-red-500"
                    )}>
                      {trade.direction === "Buy"
                        ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />}
                      {trade.direction}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Direction</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{trade.lotSize.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lot Size</p>
                  </div>
                </div>

                <Separator />

                {/* Context */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Context</p>
                  <InfoRow label="Date" value={format(new Date(trade.entryDate), "EEE, MMM d, yyyy")} />
                  <InfoRow label="Session" value={trade.session || "—"} />
                  <InfoRow label="Duration" value={formatDuration(trade.entryDate, trade.exitDate)} />
                </div>

                <Separator />

                {/* Execution */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Execution</p>
                  <InfoRow label="Avg Entry Price" value={trade.entryPrice.toFixed(trade.entryPrice > 100 ? 2 : 5)} />
                  {hasLegs ? (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Split Order</p>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left p-2 font-semibold text-muted-foreground">Order</th>
                              <th className="text-left p-2 font-semibold text-muted-foreground">Entry / Exit</th>
                              <th className="text-left p-2 font-semibold text-muted-foreground">SL</th>
                              <th className="text-left p-2 font-semibold text-muted-foreground">TP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trade.legs.map((leg) => (
                              <tr key={leg.id} className="border-t">
                                <td className="p-2 font-medium">{leg.order}. {leg.lotSize} lots</td>
                                <td className="p-2 font-mono">
                                  {leg.entryPrice.toFixed(5)} / {leg.exitPrice?.toFixed(5) || "Open"}
                                </td>
                                <td className="p-2 text-muted-foreground">{leg.stopLoss?.toFixed(5) || "—"}</td>
                                <td className="p-2 text-muted-foreground">{leg.takeProfit?.toFixed(5) || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <>
                      <InfoRow label="Exit Price" value={trade.exitPrice ? trade.exitPrice.toFixed(trade.exitPrice > 100 ? 2 : 5) : "—"} />
                      <InfoRow label="Stop Loss" value={trade.stopLoss ? trade.stopLoss.toFixed(trade.stopLoss > 100 ? 2 : 5) : "Not Set"} />
                      <InfoRow label="Take Profit" value={trade.takeProfit ? trade.takeProfit.toFixed(trade.takeProfit > 100 ? 2 : 5) : "Not Set"} />
                    </>
                  )}
                </div>

                <Separator />

                {/* Performance */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Performance</p>
                  <InfoRow label="Risk (R)" value={trade.riskR !== undefined ? `${trade.riskR}R` : "—"} />
                  <InfoRow
                    label="Return (R)"
                    value={trade.returnR !== undefined ? formatR(trade.returnR) : "—"}
                    valueClass={getPnlColor(trade.returnR ?? null)}
                  />
                </div>

                <Separator />

                {/* Costs */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Costs</p>
                  <InfoRow
                    label="Fees"
                    value={trade.fees !== undefined ? formatCurrency(trade.fees) : "—"}
                    valueClass={trade.fees && trade.fees < 0 ? "text-red-500" : ""}
                  />
                  <InfoRow label="Swap" value={trade.swap !== undefined ? formatCurrency(trade.swap) : "—"} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Charts & Reflection */}
          <div className="space-y-5">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-0.5">Charts</h3>
                  <p className="text-xs text-muted-foreground">Add screenshots to review context + execution</p>
                </div>
                <div className="flex gap-3">
                  <ChartPanel label="HTF" url={c?.htfUrl} />
                  <ChartPanel label="MTF" url={c?.mtfUrl} />
                  <ChartPanel label="LTF" url={c?.ltfUrl} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-5">
                <h3 className="text-base font-semibold">Review & Reflection</h3>

                {r ? (
                  <>
                    {/* Plan */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Plan</p>
                        <div className="flex items-center gap-2">
                          {r.planFollowed
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <XCircle className="h-4 w-4 text-red-500" />}
                          <span className="text-sm">
                            {r.planFollowed ? "I followed my trade plan" : "Plan not followed"}
                          </span>
                        </div>
                      </div>
                      {r.intendedPlan && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Which plan?</p>
                          <Badge variant="purple">{r.intendedPlan}</Badge>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Entry Confluences */}
                    {r.entryConfluences.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Entry Confluences</p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.entryConfluences.map((conf) => (
                            <Badge key={conf} variant="purple" className="text-xs">{conf}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trade Management */}
                    {r.tradeManagement && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Trade Management</p>
                        <p className="text-sm text-muted-foreground">{r.tradeManagement}</p>
                      </div>
                    )}

                    {r.mistakes.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Mistakes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.mistakes.map((m) => (
                              <Badge key={m} variant="destructive" className="text-xs">{m}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Emotions */}
                    {(r.entryEmotion || r.exitEmotion) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          {r.entryEmotion && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Entry Emotion</p>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                                EMOTION_COLORS[r.entryEmotion] || "bg-muted text-muted-foreground"
                              )}>
                                {EMOTION_EMOJI[r.entryEmotion]} {r.entryEmotion}
                              </span>
                            </div>
                          )}
                          {r.exitEmotion && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Exit Emotion</p>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                                EMOTION_COLORS[r.exitEmotion] || "bg-muted text-muted-foreground"
                              )}>
                                {EMOTION_EMOJI[r.exitEmotion]} {r.exitEmotion}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Notes */}
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Notes</p>
                      {r.notes ? (
                        <div className="rounded-xl border bg-muted/20 p-4">
                          <p className="text-sm whitespace-pre-wrap">{r.notes}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed p-4">
                          <p className="text-sm text-muted-foreground italic">
                            What went well? What will you do differently next time?
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No reflection added for this trade.</p>
                    <Link href={`/trades/${trade.id}/edit`}>
                      <Button variant="ghost" size="sm" className="mt-2 text-violet-600">Add Reflection</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}