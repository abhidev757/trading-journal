"use client"

import * as React from "react"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crop as CropIcon, Sparkles, X, Maximize2, Loader2 } from "lucide-react"

interface ImageCropModalProps {
  open: boolean
  file: File | null
  onClose: () => void
  onConfirm: (file: File) => void
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  const pixelX = Math.round(crop.x * scaleX)
  const pixelY = Math.round(crop.y * scaleY)
  const pixelWidth = Math.round(crop.width * scaleX)
  const pixelHeight = Math.round(crop.height * scaleY)

  if (pixelWidth <= 0 || pixelHeight <= 0) {
    throw new Error("Invalid crop dimensions")
  }

  canvas.width = pixelWidth
  canvas.height = pixelHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(
    image,
    pixelX,
    pixelY,
    pixelWidth,
    pixelHeight,
    0,
    0,
    pixelWidth,
    pixelHeight
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      0.98
    )
  })
}

export function ImageCropModal({ open, file, onClose, onConfirm }: ImageCropModalProps) {
  const [imgSrc, setImgSrc] = React.useState<string | null>(null)
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!file) {
      setImgSrc(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setImgSrc(objectUrl)
    setCrop(undefined)
    setCompletedCrop(null)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    // Initialize default crop: 94% width, 35% height, centered horizontally
    const initialCrop: Crop = {
      unit: "%",
      x: 3,
      y: 10,
      width: 94,
      height: Math.min(45, (100 * 250) / height || 40),
    }
    setCrop(initialCrop)
  }

  const handleSelectFull = () => {
    if (!imgRef.current) return
    const { width, height } = imgRef.current
    setCrop({
      unit: "%",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
    setCompletedCrop({
      unit: "px",
      x: 0,
      y: 0,
      width,
      height,
    })
  }

  const handleConfirm = async () => {
    if (!file) return

    // If no specific crop or full selection was made
    if (!completedCrop || !imgRef.current || (completedCrop.width === 0 && completedCrop.height === 0)) {
      onConfirm(file)
      return
    }

    try {
      setIsProcessing(true)
      const blob = await getCroppedBlob(imgRef.current, completedCrop)
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg", {
        type: "image/jpeg",
      })
      onConfirm(croppedFile)
    } catch (err) {
      console.error("Failed to crop image:", err)
      // Fallback to original file
      onConfirm(file)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanOriginal = () => {
    if (file) {
      onConfirm(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[96vw] max-w-xl max-h-[92vh] flex flex-col p-4 sm:p-5 gap-3.5 bg-background/95 backdrop-blur-md border-violet-500/30 rounded-2xl overflow-hidden">
        <DialogHeader className="space-y-1 text-left shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <CropIcon className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">
                Crop MT5 Trade
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Drag the box to frame only the trade row you want to scan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Cropper preview area */}
        <div className="relative flex-1 min-h-[220px] max-h-[50vh] sm:max-h-[58vh] overflow-auto rounded-xl bg-black/60 border border-border flex items-center justify-center p-2 select-none touch-none">
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-full max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[48vh] sm:max-h-[56vh] w-auto max-w-full object-contain block mx-auto pointer-events-auto"
              />
            </ReactCrop>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              Loading screenshot...
            </div>
          )}
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center justify-between gap-2 shrink-0 pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectFull}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Select All
          </Button>
          <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
            Drag corners or edges to adjust
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleScanOriginal}
            className="text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-8 px-2.5"
          >
            Skip Crop
          </Button>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 shrink-0 pt-1 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs sm:text-sm h-9 px-4 gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cropping...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Confirm & Scan</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
