"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, CheckCircle2 } from "lucide-react"

interface MT5SampleModalProps {
  open: boolean
  onClose: () => void
}

export function MT5SampleModal({ open, onClose }: MT5SampleModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5 gap-3.5 bg-background/95 backdrop-blur-md border-violet-500/40 shadow-[0_0_50px_rgba(139,92,246,0.2)] rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30 shrink-0 shadow-sm">
              <Info className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">
                Sample MT5 Trade Screenshot
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                In MetaTrader 5, go to History, tap the trade to expand its details, and take a screenshot.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Sample Image */}
        <div className="rounded-xl overflow-hidden border border-violet-500/20 bg-gradient-to-b from-black/95 to-black/85 p-2 shadow-inner">
          <img
            src="/mt5-sample.jpg"
            alt="Sample MT5 trade screenshot"
            className="w-full max-h-[220px] sm:max-h-[280px] h-auto rounded-lg object-contain block mx-auto shadow-md"
          />
        </div>

        {/* Tips / Details list */}
        <div className="space-y-1.5 text-xs text-muted-foreground bg-gradient-to-b from-violet-500/5 to-muted/20 rounded-xl p-3 border border-violet-500/15">
          <p className="font-semibold text-foreground text-xs">The scanner reads:</p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Symbol & Direction</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Lot Size</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Entry & Exit Prices</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Profit / Loss (PnL)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Open & Close Time</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>SL, TP, Swap & Fees</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="pt-1 border-t border-border/40">
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 px-4 font-medium shadow-sm transition-all"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
