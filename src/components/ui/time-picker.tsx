import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

export function TimePicker({ value, onChange }: { value?: string, onChange: (v: string) => void }) {
  const [hour, min] = (value || "00:00").split(":")
  
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md p-1 focus-within:ring-2 focus-within:ring-violet-500">
      <Clock className="w-4 h-4 ml-2 mr-1 text-muted-foreground" />
      <Select value={hour} onValueChange={(v) => onChange(`${v}:${min}`)}>
        <SelectTrigger className="w-[60px] h-8 border-0 bg-transparent shadow-none focus:ring-0 text-center px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-56 min-w-[60px]">
          {Array.from({length: 24}).map((_, i) => {
            const h = i.toString().padStart(2, "0")
            return <SelectItem key={h} value={h}>{h}</SelectItem>
          })}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-bold">:</span>
      <Select value={min} onValueChange={(v) => onChange(`${hour}:${v}`)}>
        <SelectTrigger className="w-[60px] h-8 border-0 bg-transparent shadow-none focus:ring-0 text-center px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-56 min-w-[60px]">
          {Array.from({length: 60}).map((_, i) => {
            const m = i.toString().padStart(2, "0")
            return <SelectItem key={m} value={m}>{m}</SelectItem>
          })}
        </SelectContent>
      </Select>
    </div>
  )
}