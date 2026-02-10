"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn, secondsToTimeString } from "@/lib/utils"
import { Scissors, Clock, Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ClipRange {
  startSeconds: number
  endSeconds: number
}

interface VideoClipSelectorProps {
  /** YouTube video ID for embedding */
  videoId: string
  /** Total video duration in seconds */
  durationSeconds: number
  /** Called whenever the clip range changes (or null when clipping is disabled) */
  onClipRangeChange: (range: ClipRange | null) => void
  className?: string
}

export function VideoClipSelector({
  videoId,
  durationSeconds,
  onClipRangeChange,
  className,
}: VideoClipSelectorProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [startSeconds, setStartSeconds] = useState(0)
  const [endSeconds, setEndSeconds] = useState(durationSeconds)
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Update end time when duration changes
  useEffect(() => {
    setEndSeconds(durationSeconds)
  }, [durationSeconds])

  // Propagate changes
  useEffect(() => {
    if (isEnabled && startSeconds < endSeconds) {
      onClipRangeChange({ startSeconds, endSeconds })
    } else if (!isEnabled) {
      onClipRangeChange(null)
    }
  }, [isEnabled, startSeconds, endSeconds, onClipRangeChange])

  const handleToggle = useCallback((checked: boolean) => {
    setIsEnabled(checked)
    if (checked) {
      // Reset to reasonable defaults when enabling
      setStartSeconds(0)
      setEndSeconds(Math.min(durationSeconds, 60)) // Default to first 60 seconds or full video
    }
  }, [durationSeconds])

  const getPositionFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return 0
    const rect = sliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return (x / rect.width) * durationSeconds
  }, [durationSeconds])

  const handleSliderMouseDown = useCallback((e: React.MouseEvent, handle: "start" | "end") => {
    e.preventDefault()
    setIsDragging(handle)
  }, [])

  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    const position = getPositionFromEvent(e)
    // Click closer to start or end handle?
    const distToStart = Math.abs(position - startSeconds)
    const distToEnd = Math.abs(position - endSeconds)
    
    if (distToStart < distToEnd) {
      setStartSeconds(Math.min(position, endSeconds - 1))
    } else {
      setEndSeconds(Math.max(position, startSeconds + 1))
    }
  }, [isDragging, getPositionFromEvent, startSeconds, endSeconds])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const position = getPositionFromEvent(e)
      if (isDragging === "start") {
        setStartSeconds(Math.max(0, Math.min(position, endSeconds - 1)))
      } else {
        setEndSeconds(Math.min(durationSeconds, Math.max(position, startSeconds + 1)))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, getPositionFromEvent, startSeconds, endSeconds, durationSeconds])

  const clipDuration = endSeconds - startSeconds
  const startPercent = (startSeconds / durationSeconds) * 100
  const endPercent = (endSeconds / durationSeconds) * 100

  // Quick adjustment buttons
  const adjustStart = (delta: number) => {
    setStartSeconds(Math.max(0, Math.min(startSeconds + delta, endSeconds - 1)))
  }
  const adjustEnd = (delta: number) => {
    setEndSeconds(Math.min(durationSeconds, Math.max(endSeconds + delta, startSeconds + 1)))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toggle */}
      <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50">
        <label 
          className="text-sm font-medium text-text-primary flex items-center gap-2.5 cursor-pointer" 
          onClick={() => handleToggle(!isEnabled)}
        >
          <div className={cn(
            "p-1.5 rounded-md transition-colors", 
            isEnabled ? "bg-primary/10 text-primary" : "bg-surface text-text-secondary"
          )}>
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <span className="block">Clip Video</span>
            <span className="text-xs text-text-secondary font-normal">Download only a specific part</span>
          </div>
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => handleToggle(!isEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isEnabled ? "bg-primary" : "bg-border"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
              isEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Video Preview & Range Selector */}
      {isEnabled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Embedded YouTube Player */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border/50">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(startSeconds)}&end=${Math.floor(endSeconds)}&rel=0&modestbranding=1`}
              title="Video preview"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Range Slider */}
          <div className="bg-surface/50 p-4 rounded-lg border border-border/50 space-y-4">
            {/* Clip info header */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                Full video: {secondsToTimeString(durationSeconds)}
              </span>
              <span className="text-primary font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Clip: {secondsToTimeString(clipDuration, false)}
              </span>
            </div>

            {/* Visual Range Slider */}
            <div 
              ref={sliderRef}
              className="relative h-12 bg-background rounded-lg cursor-pointer select-none"
              onClick={handleSliderClick}
            >
              {/* Track background */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center px-2">
                <div className="w-full h-2 bg-border rounded-full" />
              </div>

              {/* Selected range */}
              <div 
                className="absolute inset-y-0 flex items-center"
                style={{ 
                  left: `${startPercent}%`, 
                  right: `${100 - endPercent}%` 
                }}
              >
                <div className="w-full h-2 bg-primary rounded-full" />
              </div>

              {/* Start handle */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-10 bg-white border-2 border-primary rounded-md shadow-lg cursor-ew-resize flex items-center justify-center transition-transform",
                  isDragging === "start" && "scale-110 shadow-xl"
                )}
                style={{ left: `${startPercent}%` }}
                onMouseDown={(e) => handleSliderMouseDown(e, "start")}
              >
                <div className="w-0.5 h-4 bg-primary rounded-full" />
              </div>

              {/* End handle */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-10 bg-white border-2 border-primary rounded-md shadow-lg cursor-ew-resize flex items-center justify-center transition-transform",
                  isDragging === "end" && "scale-110 shadow-xl"
                )}
                style={{ left: `${endPercent}%` }}
                onMouseDown={(e) => handleSliderMouseDown(e, "end")}
              >
                <div className="w-0.5 h-4 bg-primary rounded-full" />
              </div>

              {/* Time labels */}
              <div 
                className="absolute -bottom-6 text-xs font-mono text-primary font-medium"
                style={{ left: `${startPercent}%`, transform: 'translateX(-50%)' }}
              >
                {secondsToTimeString(startSeconds, false)}
              </div>
              <div 
                className="absolute -bottom-6 text-xs font-mono text-primary font-medium"
                style={{ left: `${endPercent}%`, transform: 'translateX(-50%)' }}
              >
                {secondsToTimeString(endSeconds, false)}
              </div>
            </div>

            {/* Fine-tune controls */}
            <div className="flex items-center justify-between pt-6">
              {/* Start controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary w-12">Start:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustStart(-10)}
                    disabled={startSeconds <= 0}
                    className="h-8 w-8 p-0"
                  >
                    <SkipBack className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustStart(-1)}
                    disabled={startSeconds <= 0}
                    className="h-8 px-2 text-xs"
                  >
                    -1s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustStart(1)}
                    disabled={startSeconds >= endSeconds - 1}
                    className="h-8 px-2 text-xs"
                  >
                    +1s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustStart(10)}
                    disabled={startSeconds >= endSeconds - 10}
                    className="h-8 w-8 p-0"
                  >
                    <SkipForward className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* End controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary w-12 text-right">End:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustEnd(-10)}
                    disabled={endSeconds <= startSeconds + 10}
                    className="h-8 w-8 p-0"
                  >
                    <SkipBack className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustEnd(-1)}
                    disabled={endSeconds <= startSeconds + 1}
                    className="h-8 px-2 text-xs"
                  >
                    -1s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustEnd(1)}
                    disabled={endSeconds >= durationSeconds}
                    className="h-8 px-2 text-xs"
                  >
                    +1s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustEnd(10)}
                    disabled={endSeconds >= durationSeconds}
                    className="h-8 w-8 p-0"
                  >
                    <SkipForward className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
