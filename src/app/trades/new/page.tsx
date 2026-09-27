"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Upload, X, ChevronLeft, Save, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Combobox, MultiCombobox } from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { InstrumentIcon } from "@/components/ui/instrument-icon"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { INSTRUMENTS, ENTRY_CONFLUENCES, MISTAKES, TRADING_PLANS, EMOTIONS, EMOTION_EMOJI, SESSIONS, INSTRUMENT_ICONS } from "@/lib/constants"
import Link from "next/link"

const legSchema = z.object({
  lotSize: z.string(),
  entryPrice: z.string(),
  exitPrice: z.string().optional(),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
})

const tradeSchema = z.object({
  instrument: z.string().min(1, "Required"),
  direction: z.enum(["Buy", "Sell"]),
  session: z.string().optional(),
  entryDate: z.string().min(1, "Required"),
  entryTime: z.string().optional(),
  exitDate: z.string().optional(),
  exitTime: z.string().optional(),
  lotSize: z.string().min(1, "Required"),
  entryPrice: z.string().min(1, "Required"),
  exitPrice: z.string().optional(),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  netPnl: z.string().optional(),
  fees: z.string().optional(),
  swap: z.string().optional(),
  riskR: z.string().optional(),
  returnR: z.string().optional(),
  legs: z.array(legSchema).optional(),
  // Reflection
  planFollowed: z.boolean().optional(),
  intendedPlan: z.string().optional(),
  entryConfluences: z.array(z.string()).optional(),
  tradeManagement: z.string().optional(),
  mistakes: z.array(z.string()).optional(),
  entryEmotion: z.string().optional(),
  exitEmotion: z.string().optional(),
  notes: z.string().optional(),
})

type TradeFormValues = z.infer<typeof tradeSchema>

// ─── Chart Dropzone ───────────────────────────────────────────────────────────

function ChartDropzone({ label, tooltip, value, onChange }: {
  label: string
  tooltip: string
  value?: File | string | null
  onChange: (file: File | null) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(typeof value === "string" ? value : null)
  const [dragging, setDragging] = React.useState(false)

  const handleFile = (file: File) => {
    onChange(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex-1">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file?.type.startsWith("image/")) handleFile(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
          dragging ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20" : "border-border hover:border-violet-400 hover:bg-muted/30",
          preview && "border-solid border-border"
        )}
      >
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }} />
        {preview ? (
          <>
            <img src={preview} alt={label} className="h-full w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(null); onChange(null) }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="rounded-xl bg-muted p-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Drop image or click</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{tooltip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Split Order Row ──────────────────────────────────────────────────────────

function SplitOrderRow({ index, onRemove, register }: {
  index: number
  onRemove: () => void
  register: any
}) {
  return (
    <div className="grid grid-cols-5 gap-2 items-center">
      <div className="text-xs text-muted-foreground font-medium">{index + 1}.</div>
      <Input placeholder="Lots" {...register(`legs.${index}.lotSize`)} className="text-xs h-8" />
      <Input placeholder="Entry" {...register(`legs.${index}.entryPrice`)} className="text-xs h-8" />
      <Input placeholder="SL" {...register(`legs.${index}.stopLoss`)} className="text-xs h-8" />
      <div className="flex gap-1">
        <Input placeholder="TP" {...register(`legs.${index}.takeProfit`)} className="text-xs h-8" />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddTradePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [htfFile, setHtfFile] = React.useState<File | null>(null)
  const [mtfFile, setMtfFile] = React.useState<File | null>(null)
  const [ltfFile, setLtfFile] = React.useState<File | null>(null)
  const [entryConfluences, setEntryConfluences] = React.useState<string[]>([])
  const [mistakes, setMistakes] = React.useState<string[]>([])

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      direction: "Buy",
      planFollowed: false,
      legs: [],
      entryConfluences: [],
      mistakes: [],
    },
  })

  const { fields: legFields, append: appendLeg, remove: removeLeg } = useFieldArray({ control, name: "legs" })

  const planFollowed = watch("planFollowed")

  const uploadFile = async (file: File, tradeId: string, timeframe: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tradeId", tradeId)
    formData.append("timeframe", timeframe)
    
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  const onSubmit = async (data: TradeFormValues) => {
    setSubmitting(true)
    try {
      const entryDateTime = new Date(`${data.entryDate}T${data.entryTime || "00:00"}:00`).toISOString()
      const exitDateTime = data.exitDate ? new Date(`${data.exitDate}T${data.exitTime || "00:00"}:00`).toISOString() : undefined
      const tempId = crypto.randomUUID()
      
      let htfUrl, mtfUrl, ltfUrl
      if (htfFile) htfUrl = await uploadFile(htfFile, tempId, "htf")
      if (mtfFile) mtfUrl = await uploadFile(mtfFile, tempId, "mtf")
      if (ltfFile) ltfUrl = await uploadFile(ltfFile, tempId, "ltf")

      const payload = {
        ...data,
        entryDate: entryDateTime,
        exitDate: exitDateTime,
        entryConfluences,
        mistakes,
        charts: { htfUrl, mtfUrl, ltfUrl },
        reflection: {
          planFollowed: data.planFollowed,
          intendedPlan: data.intendedPlan,
          entryConfluences,
          tradeManagement: data.tradeManagement,
          mistakes,
          entryEmotion: data.entryEmotion,
          exitEmotion: data.exitEmotion,
          notes: data.notes,
        },
      }

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save trade")
      const { trade } = await res.json()
      router.push(`/trades/${trade.id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to save trade. Make sure your database is connected and logged in.")
    } finally {
      setSubmitting(false)
    }
  }

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
          <div>
            <h1 className="text-xl font-bold">Add Trade</h1>
            <p className="text-sm text-muted-foreground">Log a new trade with execution details and reflection</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href="/"><Button variant="outline" size="sm">Cancel</Button></Link>
            <Button
              id="save-trade-btn"
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Trade"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── LEFT COLUMN: Trade Details ── */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Trade Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="entryDate">Entry Date</Label>
                      <Controller
                        control={control}
                        name="entryDate"
                        render={({ field }) => (
                          <DatePicker
                            date={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            setDate={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="entryTime">Entry Time</Label>
                      <Controller
                        control={control}
                        name="entryTime"
                        render={({ field }) => (
                          <TimePicker value={field.value} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exitDate">Exit Date</Label>
                      <Controller
                        control={control}
                        name="exitDate"
                        render={({ field }) => (
                          <DatePicker
                            date={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            setDate={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exitTime">Exit Time</Label>
                      <Controller
                        control={control}
                        name="exitTime"
                        render={({ field }) => (
                          <TimePicker value={field.value} onChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Instrument & Direction */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Instrument</Label>
                      <Combobox
                        options={INSTRUMENTS}
                        renderIcon={(v) => <InstrumentIcon instrument={v} className="mr-2" />}
                        value={watch("instrument") || ""}
                        onValueChange={(v) => setValue("instrument", v)}
                        placeholder="Search for a symbol"
                        searchPlaceholder="Search symbols..."
                        className={cn("w-full", errors.instrument ? "border-red-500" : "")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Direction</Label>
                      <Select value={watch("direction")} onValueChange={(v) => setValue("direction", v as "Buy" | "Sell")}>
                        <SelectTrigger id="direction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Buy">↑ Buy (Long)</SelectItem>
                          <SelectItem value="Sell">↓ Sell (Short)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Session & Lots */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Session</Label>
                      <Select value={watch("session") || ""} onValueChange={(v) => setValue("session", v)}>
                        <SelectTrigger id="session">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          {SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lotSize">Lots</Label>
                      <Input id="lotSize" type="number" step="0.01" placeholder="0.00" {...register("lotSize")} className={errors.lotSize ? "border-red-500" : ""} />
                    </div>
                  </div>

                  <Separator />

                  {/* Execution */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Execution</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="entryPrice">Entry Price</Label>
                        <Input id="entryPrice" type="number" step="0.00001" placeholder="0.00000" {...register("entryPrice")} className={errors.entryPrice ? "border-red-500" : ""} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="exitPrice">Exit Price</Label>
                        <Input id="exitPrice" type="number" step="0.00001" placeholder="0.00000" {...register("exitPrice")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stopLoss">Stop Loss</Label>
                        <Input id="stopLoss" type="number" step="0.00001" placeholder="0.00000" {...register("stopLoss")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="takeProfit">Take Profit</Label>
                        <Input id="takeProfit" type="number" step="0.00001" placeholder="0.00000" {...register("takeProfit")} />
                      </div>
                    </div>
                  </div>

                  {/* Split orders */}
                  {legFields.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Split Orders</p>
                      <div className="grid grid-cols-5 gap-2 text-[10px] text-muted-foreground font-medium">
                        <span>#</span><span>Lots</span><span>Entry</span><span>SL</span><span>TP</span>
                      </div>
                      {legFields.map((field, i) => (
                        <SplitOrderRow key={field.id} index={i} onRemove={() => removeLeg(i)} register={register} />
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => appendLeg({ lotSize: "", entryPrice: "", exitPrice: "", stopLoss: "", takeProfit: "" })}>
                    <Plus className="h-4 w-4" />
                    Add Split Order
                  </Button>

                  <Separator />

                  {/* PnL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="netPnl">PnL ($)</Label>
                    <Input id="netPnl" type="number" step="0.01" placeholder="$0.00" {...register("netPnl")} />
                  </div>

                  <Separator />

                  {/* Performance */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="riskR">Risk (R)</Label>
                        <Input id="riskR" type="number" step="0.01" placeholder="$0.00" {...register("riskR")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="returnR">Return (R)</Label>
                        <Input id="returnR" type="number" step="0.01" placeholder="0.0R" {...register("returnR")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Costs */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Costs</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="swap">Swap</Label>
                        <Input id="swap" type="number" step="0.01" placeholder="$0.00" {...register("swap")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fees">Commission</Label>
                        <Input id="fees" type="number" step="0.01" placeholder="$0.00" {...register("fees")} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT COLUMN: Charts & Reflection ── */}
            <div className="space-y-6">
              {/* Charts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Charts</CardTitle>
                  <p className="text-xs text-muted-foreground">Add screenshots to review context + execution</p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <ChartDropzone label="HTF" tooltip="Higher time frame context" value={htfFile} onChange={setHtfFile} />
                    <ChartDropzone label="MTF" tooltip="Entry time frame" value={mtfFile} onChange={setMtfFile} />
                    <ChartDropzone label="LTF" tooltip="Execution time frame" value={ltfFile} onChange={setLtfFile} />
                  </div>
                </CardContent>
              </Card>

              {/* Review & Reflection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Review & Reflection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Plan */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="planFollowed"
                          checked={planFollowed}
                          onCheckedChange={(checked) => setValue("planFollowed", !!checked)}
                        />
                        <label htmlFor="planFollowed" className="text-sm cursor-pointer select-none">
                          I followed my trade plan
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Which plan did you intend to follow?</Label>
                      <Select value={watch("intendedPlan") || ""} onValueChange={(v) => setValue("intendedPlan", v)}>
                        <SelectTrigger id="intendedPlan">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRADING_PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Entry Confluences */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Entry Confluences</Label>
                      <MultiCombobox
                        options={ENTRY_CONFLUENCES}
                        value={entryConfluences}
                        onValueChange={setEntryConfluences}
                        placeholder="Select confluences"
                        creatable
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tradeManagement">Trade Management</Label>
                      <Textarea
                        id="tradeManagement"
                        placeholder="e.g. Partial at 1R, move SL to BE after 1R, set and forget..."
                        {...register("tradeManagement")}
                        className="min-h-[80px] text-sm resize-none"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Mistakes & Emotions */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Mistakes</Label>
                      <MultiCombobox
                        options={MISTAKES}
                        value={mistakes}
                        onValueChange={setMistakes}
                        placeholder="Start typing..."
                        creatable
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Entry Emotion</Label>
                        <Select value={watch("entryEmotion") || ""} onValueChange={(v) => setValue("entryEmotion", v)}>
                          <SelectTrigger id="entryEmotion">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOTIONS.map((e) => (
                              <SelectItem key={e} value={e}>
                                {EMOTION_EMOJI[e]} {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Exit Emotion</Label>
                        <Select value={watch("exitEmotion") || ""} onValueChange={(v) => setValue("exitEmotion", v)}>
                          <SelectTrigger id="exitEmotion">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOTIONS.map((e) => (
                              <SelectItem key={e} value={e}>
                                {EMOTION_EMOJI[e]} {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Add a note or voice reflection</Label>
                    <Textarea
                      id="notes"
                      placeholder="What went well? What will you do differently next time?"
                      {...register("notes")}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}