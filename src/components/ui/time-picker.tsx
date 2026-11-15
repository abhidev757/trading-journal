"use client"
import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// ─── Helpers for 12h <-> 24h Conversion ──────────────────────────────────────

function parse24Hour(value?: string): { hour12: number; minute: number; period: "AM" | "PM" } {
  if (!value || !value.includes(":")) {
    const now = new Date()
    const h24 = now.getHours()
    const m = now.getMinutes()
    const period = h24 >= 12 ? "PM" : "AM"
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
    return { hour12, minute: m, period }
  }

  const [hStr, mStr] = value.split(":")
  let h24 = parseInt(hStr, 10)
  let m = parseInt(mStr, 10)
  if (isNaN(h24)) h24 = 0
  if (isNaN(m)) m = 0

  const period = h24 >= 12 ? "PM" : "AM"
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, minute: m, period }
}

function formatTo24Hour(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h24: number
  if (period === "AM") {
    h24 = hour12 === 12 ? 0 : hour12
  } else {
    h24 = hour12 === 12 ? 12 : hour12 + 12
  }
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function formatTo12HourDisplay(value?: string): string {
  if (!value || !value.includes(":")) return ""
  const { hour12, minute, period } = parse24Hour(value)
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`
}

// Dial geometry constants
const DIAL_SIZE = 240
const CENTER = DIAL_SIZE / 2
const RADIUS = 86 // Distance from center to numbers

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"hours" | "minutes">("hours")
  const dialRef = React.useRef<HTMLDivElement>(null)
  const isDragging = React.useRef(false)

  const parsed = React.useMemo(() => parse24Hour(value), [value])
  const [hour12, setHour12] = React.useState(parsed.hour12)
  const [minute, setMinute] = React.useState(parsed.minute)
  const [period, setPeriod] = React.useState<"AM" | "PM">(parsed.period)

  // Keep local state in sync when value changes externally
  React.useEffect(() => {
    const p = parse24Hour(value)
    setHour12(p.hour12)
    setMinute(p.minute)
    setPeriod(p.period)
  }, [value])

  // Reset to hours mode whenever popover opens
  React.useEffect(() => {
    if (open) {
      setMode("hours")
    }
  }, [open])

  const updateTime = (newH: number, newM: number, newP: "AM" | "PM") => {
    setHour12(newH)
    setMinute(newM)
    setPeriod(newP)
    onChange(formatTo24Hour(newH, newM, newP))
  }

  const handlePeriodChange = (newP: "AM" | "PM") => {
    updateTime(hour12, minute, newP)
  }

  const handleNow = () => {
    const now = new Date()
    const h24 = now.getHours()
    const m = now.getMinutes()
    const newP = h24 >= 12 ? "PM" : "AM"
    const newH = h24 % 12 === 0 ? 12 : h24 % 12
    updateTime(newH, m, newP)
  }

  // Pointer interactions for the clock face
  const handlePointerAction = (clientX: number, clientY: number, isFinal: boolean = false) => {
    if (!dialRef.current) return
    const rect = dialRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy

    // Angle in degrees clockwise from 12 o'clock [0, 360)
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
    if (angle < 0) angle += 360

    if (mode === "hours") {
      const h = Math.round(angle / 30) % 12
      const selectedHour = h === 0 ? 12 : h
      updateTime(selectedHour, minute, period)
      if (isFinal) {
        setMode("minutes")
      }
    } else {
      const selectedMinute = Math.round(angle / 6) % 60
      updateTime(hour12, selectedMinute, period)
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    isDragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    handlePointerAction(e.clientX, e.clientY, false)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    handlePointerAction(e.clientX, e.clientY, false)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    handlePointerAction(e.clientX, e.clientY, true)
    isDragging.current = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {}
  }

  // Calculate clock hand coordinates
  const activeAngle =
    mode === "hours"
      ? (hour12 % 12) * 30
      : minute * 6

  const handRad = (activeAngle * Math.PI) / 180
  const handX = CENTER + RADIUS * Math.sin(handRad)
  const handY = CENTER - RADIUS * Math.cos(handRad)

  const isExactMultipleOf5 = minute % 5 === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10 focus:ring-violet-500 h-9 transition-colors",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-violet-400 shrink-0" />
          <span className="font-medium text-sm">
            {value ? formatTo12HourDisplay(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-4 bg-card border border-border shadow-2xl rounded-2xl select-none"
        align="start"
      >
        {/* Header: Digital Display + AM/PM Switcher */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={cn(
                "px-2.5 py-1 text-2xl font-bold rounded-lg transition-all",
                mode === "hours"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {String(hour12).padStart(2, "0")}
            </button>
            <span className="text-xl font-bold text-muted-foreground pb-0.5">:</span>
            <button
              type="button"
              onClick={() => setMode("minutes")}
              className={cn(
                "px-2.5 py-1 text-2xl font-bold rounded-lg transition-all",
                mode === "minutes"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {String(minute).padStart(2, "0")}
            </button>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => handlePeriodChange("AM")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-all",
                period === "AM"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("PM")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-all",
                period === "PM"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face Dial */}
        <div
          ref={dialRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative w-[240px] h-[240px] mx-auto rounded-full bg-muted/40 dark:bg-muted/20 border border-border/60 touch-none cursor-pointer"
        >
          {/* SVG Clock Hand & Indicator Bubble */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}>
            {/* Center Pin */}
            <circle cx={CENTER} cy={CENTER} r={3.5} fill="rgb(124, 58, 237)" />
            {/* Clock Hand Needle */}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={handX}
              y2={handY}
              stroke="rgb(124, 58, 237)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* Hand Selection Bubble */}
            <circle cx={handX} cy={handY} r={16} fill="rgb(124, 58, 237)" />
            {/* If in minute mode and not a multiple of 5, print the exact minute in the bubble */}
            {mode === "minutes" && !isExactMultipleOf5 && (
              <text
                x={handX}
                y={handY + 4}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="bold"
              >
                {minute}
              </text>
            )}
          </svg>

          {/* Clock Numbers */}
          {mode === "hours"
            ? HOURS.map((h) => {
                const rad = ((h % 12) * 30 * Math.PI) / 180
                const x = CENTER + RADIUS * Math.sin(rad)
                const y = CENTER - RADIUS * Math.cos(rad)
                const isSelected = hour12 === h

                return (
                  <div
                    key={h}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className={cn(
                      "absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-semibold pointer-events-none z-20 transition-colors",
                      isSelected ? "text-white font-bold" : "text-foreground/80"
                    )}
                  >
                    {h}
                  </div>
                )
              })
            : MINUTES.map((m) => {
                const rad = (m * 6 * Math.PI) / 180
                const x = CENTER + RADIUS * Math.sin(rad)
                const y = CENTER - RADIUS * Math.cos(rad)
                const isSelected = minute === m

                return (
                  <div
                    key={m}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className={cn(
                      "absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-semibold pointer-events-none z-20 transition-colors",
                      isSelected ? "text-white font-bold" : "text-foreground/80"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                )
              })}
        </div>

        {/* Footer: Quick Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleNow}
          >
            Current Time
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs h-7 px-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
