"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Upload, X, ChevronLeft, Save, ImageIcon, Loader2, Sparkles, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { extractTradeFromScreenshot } from "@/lib/mt5-parser"
import { ImageCropModal } from "@/components/trades/image-crop-modal"
import { MT5SampleModal } from "@/components/trades/mt5-sample-modal"
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

import { useParams } from "next/navigation"

export default function EditTradePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [submitting, setSubmitting] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [htfFile, setHtfFile] = React.useState<File | null>(null)
  const [mtfFile, setMtfFile] = React.useState<File | null>(null)
  const [ltfFile, setLtfFile] = React.useState<File | null>(null)
  const [entryConfluences, setEntryConfluences] = React.useState<string[]>([])
  const [mistakes, setMistakes] = React.useState<string[]>([])

  // MT5 Screenshot Extraction state
  const [isExtracting, setIsExtracting] = React.useState(false)
  const [extractProgress, setExtractProgress] = React.useState<number | null>(null)
  const [extractSuccess, setExtractSuccess] = React.useState<string | null>(null)
  const [extractError, setExtractError] = React.useState<string | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [pendingCropFile, setPendingCropFile] = React.useState<File | null>(null)
  const [isCropOpen, setIsCropOpen] = React.useState(false)
  const [isSampleOpen, setIsSampleOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSelectScreenshot = (file: File) => {
    setPendingCropFile(file)
    setIsCropOpen(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const processScreenshot = async (file: File) => {
    setIsExtracting(true)
    setExtractProgress(0)
    setExtractSuccess(null)
    setExtractError(null)

    try {
      const extracted = await extractTradeFromScreenshot(file, (p) => {
        setExtractProgress(p)
      })

      let count = 0
      if (extracted.instrument) {
        setValue("instrument", extracted.instrument)
        count++
      }
      if (extracted.direction) {
        setValue("direction", extracted.direction)
        count++
      }
      if (extracted.lotSize) {
        setValue("lotSize", extracted.lotSize)
        count++
      }
      if (extracted.entryDate) {
        setValue("entryDate", extracted.entryDate)
        count++
      }
      if (extracted.entryTime) {
        setValue("entryTime", extracted.entryTime)
        count++
      }
      if (extracted.exitDate) {
        setValue("exitDate", extracted.exitDate)
        count++
      }
      if (extracted.exitTime) {
        setValue("exitTime", extracted.exitTime)
        count++
      }
      if (extracted.entryPrice) {
        setValue("entryPrice", extracted.entryPrice)
        count++
      }
      if (extracted.exitPrice) {
        setValue("exitPrice", extracted.exitPrice)
        count++
      }
      if (extracted.stopLoss) {
        setValue("stopLoss", extracted.stopLoss)
        count++
      }
      if (extracted.takeProfit) {
        setValue("takeProfit", extracted.takeProfit)
        count++
      }
      if (extracted.netPnl) {
        setValue("netPnl", extracted.netPnl)
        count++
      }
      if (extracted.fees) {
        setValue("fees", extracted.fees)
        count++
      }
      if (extracted.swap) {
        setValue("swap", extracted.swap)
        count++
      }

      // Auto-attach this screenshot as the Lower Timeframe (LTF) chart
      setLtfFile(file)

      if (count > 0) {
        setExtractSuccess(`Auto-filled ${count} fields from MT5 screenshot!`)
      } else {
        setExtractError("Could not detect trade details. Please make sure the screenshot is clear.")
      }
    } catch (err) {
      console.error("Screenshot OCR error:", err)
      setExtractError("Failed to read image. Please try another screenshot.")
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle global paste (Ctrl+V)
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            handleSelectScreenshot(file)
            break
          }
        }
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectScreenshot(e.target.files[0])
    }
  }

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      direction: "Buy",
      planFollowed: false,
      legs: [],
      entryConfluences: [],
      mistakes: [],
    },
  })

  React.useEffect(() => {
    fetch(`/api/trades/${id}`)
      .then(r => r.json())
      .then(({ trade }) => {
        if (trade) {
          const formattedEntry = new Date(trade.entryDate).toISOString()
          const formattedExit = trade.exitDate ? new Date(trade.exitDate).toISOString() : ""
          
          reset({
            ...trade,
            entryDate: formattedEntry.split("T")[0],
            entryTime: formattedEntry.split("T")[1]?.slice(0, 5),
            exitDate: formattedExit ? formattedExit.split("T")[0] : "",
            exitTime: formattedExit ? formattedExit.split("T")[1]?.slice(0, 5) : "",
            lotSize: trade.lotSize.toString(),
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice?.toString() || "",
            stopLoss: trade.stopLoss?.toString() || "",
            takeProfit: trade.takeProfit?.toString() || "",
            netPnl: trade.netPnl?.toString() || "",
            fees: trade.fees?.toString() || "",
            swap: trade.swap?.toString() || "",
            riskR: trade.riskR?.toString() || "",
            returnR: trade.returnR?.toString() || "",
            legs: trade.legs?.map((l: any) => ({
              ...l,
              lotSize: l.lotSize.toString(),
              entryPrice: l.entryPrice.toString(),
              exitPrice: l.exitPrice?.toString() || "",
              stopLoss: l.stopLoss?.toString() || "",
              takeProfit: l.takeProfit?.toString() || "",
            })) || [],
            ...trade.reflection,
          })
          
          if (trade.reflection) {
            setEntryConfluences(trade.reflection.entryConfluences || [])
            setMistakes(trade.reflection.mistakes || [])
          }
          
          if (trade.charts) {
            setHtfFile(trade.charts.htfUrl || null)
            setMtfFile(trade.charts.mtfUrl || null)
            setLtfFile(trade.charts.ltfUrl || null)
          }
        }
        setLoading(false)
      })
  }, [id, reset])

  const { fields: legFields, append: appendLeg, remove: removeLeg } = useFieldArray({ control, name: "legs" })

  const planFollowed = watch("planFollowed")
  const watchPnl = watch("netPnl")
  const watchRisk = watch("riskR")

  React.useEffect(() => {
    if (watchPnl && watchRisk) {
      const pnlNum = parseFloat(watchPnl)
      const riskNum = parseFloat(watchRisk)
      if (!isNaN(pnlNum) && !isNaN(riskNum) && riskNum > 0) {
        setValue("returnR", (pnlNum / riskNum).toFixed(2))
      }
    }
  }, [watchPnl, watchRisk, setValue])

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
      
      
      let htfUrl = typeof htfFile === "string" ? htfFile : null
      let mtfUrl = typeof mtfFile === "string" ? mtfFile : null
      let ltfUrl = typeof ltfFile === "string" ? ltfFile : null
      
      if (htfFile instanceof File) htfUrl = await uploadFile(htfFile, id, "htf")
      if (mtfFile instanceof File) mtfUrl = await uploadFile(mtfFile, id, "mtf")
      if (ltfFile instanceof File) ltfUrl = await uploadFile(ltfFile, id, "ltf")

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

      const res = await fetch(`/api/trades/${id}`, {
        method: "PUT",
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" /></div>
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit Trade</h1>
              <p className="text-xs text-muted-foreground">Update your trade</p>
            </div>
          </div>
        </div>

        {/* ── MT5 Screenshot Auto-Fill Banner ── */}
        <MT5SampleModal
          open={isSampleOpen}
          onClose={() => setIsSampleOpen(false)}
        />

        <ImageCropModal
          open={isCropOpen}
          file={pendingCropFile}
          onClose={() => {
            setIsCropOpen(false)
            setPendingCropFile(null)
          }}
          onConfirm={(croppedFile) => {
            setIsCropOpen(false)
            setPendingCropFile(null)
            processScreenshot(croppedFile)
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0]
              if (file.type.startsWith("image/")) {
                handleSelectScreenshot(file)
              }
            }
          }}
          className={cn(
            "mb-5 sm:mb-6 rounded-xl sm:rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent p-3.5 sm:p-5 relative transition-all duration-200",
            isDragOver && "border-violet-500 bg-violet-500/20 shadow-lg ring-2 ring-violet-500/40"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/30 mt-0.5 sm:mt-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                      Auto-fill from MT5 Screenshot
                    </h3>
                    <Badge variant="purple" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
                      AI OCR
                    </Badge>
                  </div>

                  {/* Mobile (i) info button on the right end */}
                  <button
                    type="button"
                    onClick={() => setIsSampleOpen(true)}
                    className="sm:hidden flex items-center justify-center h-7 w-7 rounded-full bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 hover:border-violet-400 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-90 text-violet-300 shrink-0 shadow-sm transition-all duration-200 cursor-pointer"
                    title="View sample MT5 screenshot"
                    aria-label="View sample MT5 screenshot"
                  >
                    <Info className="h-4 w-4 text-violet-300" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <span className="sm:hidden">Upload your trade screenshot to update fields automatically.</span>
                  <span className="hidden sm:inline">
                    Upload, drag & drop, or paste (<kbd className="px-1 py-0.5 bg-muted rounded border text-[10px] font-mono">Ctrl+V</kbd>) an MT5 screenshot to update fields automatically.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="w-full sm:w-auto border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400 text-violet-200 font-medium text-xs sm:text-sm h-9 sm:h-9 px-3.5 gap-2 shadow-sm transition-all"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    <span>{extractProgress ? `Scanning ${extractProgress}%` : "Extracting..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-violet-400" />
                    <span>Upload MT5 Screenshot</span>
                  </>
                )}
              </Button>

              {/* Desktop (i) info button next to upload */}
              <button
                type="button"
                onClick={() => setIsSampleOpen(true)}
                className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400 hover:shadow-[0_0_12px_rgba(139,92,246,0.35)] hover:scale-105 active:scale-95 text-violet-300 shrink-0 transition-all duration-200 cursor-pointer"
                title="View sample MT5 screenshot"
                aria-label="View sample MT5 screenshot"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Extraction Progress Bar */}
          {isExtracting && (
            <div className="mt-3 pt-2.5 border-t border-violet-500/20 space-y-1.5">
              <div className="flex justify-between text-[11px] text-violet-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                  Reading trade details...
                </span>
                <span>{extractProgress ?? 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-violet-950/40 rounded-full overflow-hidden border border-violet-500/20">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(extractProgress ?? 0, 8)}%` }}
                />
              </div>
            </div>
          )}

          {extractSuccess && (
            <div className="mt-3 pt-2.5 border-t border-violet-500/20 flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1.5 font-medium min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="truncate sm:whitespace-normal">{extractSuccess}</span>
              </span>
              <button
                type="button"
                onClick={() => setExtractSuccess(null)}
                className="text-muted-foreground hover:text-foreground text-[11px] underline shrink-0 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {extractError && (
            <div className="mt-3 pt-2.5 border-t border-red-500/20 flex items-center justify-between text-xs text-red-400">
              <span className="flex items-center gap-1.5 font-medium min-w-0">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span className="truncate sm:whitespace-normal">{extractError}</span>
              </span>
              <button
                type="button"
                onClick={() => setExtractError(null)}
                className="text-muted-foreground hover:text-foreground text-[11px] underline shrink-0 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="overflow-x-auto w-full">
                        <div className="min-w-[400px]">
                          <div className="grid grid-cols-5 gap-2 text-[10px] text-muted-foreground font-medium">
                            <span>#</span><span>Lots</span><span>Entry</span><span>SL</span><span>TP</span>
                          </div>
                          {legFields.map((field, i) => (
                            <SplitOrderRow key={field.id} index={i} onRemove={() => removeLeg(i)} register={register} />
                          ))}
                        </div>
                      </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="riskR">Risk ($)</Label>
                        <Input id="riskR" type="number" step="0.01" placeholder="$0.00" {...register("riskR")} />
                        <p className="text-[11px] text-muted-foreground">The dollar amount you risked on this trade.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="returnR">Return (R-Multiple)</Label>
                        <Input id="returnR" type="number" step="0.01" placeholder="e.g. 2.50" {...register("returnR")} />
                        <p className="text-[11px] text-muted-foreground">Auto-calculated as PnL ÷ Risk (or enter manually).</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Costs */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Costs</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="notes">Add a note</Label>
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
        
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-border">
            <Link href={`/trades/${id}`} className="w-full sm:w-auto"><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></Link>
            <Button
              id="save-trade-btn"
              type="submit"
              className="w-full sm:w-auto gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}