"use client"

import { useState, useCallback, useEffect } from "react"
import { cn, secondsToTimeString, timeStringToSeconds, validateClipRange } from "@/lib/utils"

export interface ClipRange {
  startSeconds: number
  endSeconds: number
}

interface ClipRangeSelectorProps {
  /** Total video duration in seconds */
  durationSeconds: number
  /** Called whenever the clip range changes (or null when clipping is disabled) */
  onClipRangeChange: (range: ClipRange | null) => void
  className?: string
}

export function ClipRangeSelector({
  durationSeconds,
  onClipRangeChange,
  className,
}: ClipRangeSelectorProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [startTime, setStartTime] = useState("00:00:00")
  const [endTime, setEndTime] = useState(() => secondsToTimeString(durationSeconds))
  const [error, setError] = useState<string | null>(null)

  // Update end time when duration changes
  useEffect(() => {
    setEndTime(secondsToTimeString(durationSeconds))
  }, [durationSeconds])

  // Validate and propagate changes whenever inputs or toggle change
  const validateAndUpdate = useCallback(
    (enabled: boolean, start: string, end: string) => {
      if (!enabled) {
        setError(null)
        onClipRangeChange(null)
        return
      }

      const startSec = timeStringToSeconds(start)
      const endSec = timeStringToSeconds(end)

      if (startSec === null) {
        setError("Invalid start time format (use HH:MM:SS)")
        onClipRangeChange(null)
        return
      }
      if (endSec === null) {
        setError("Invalid end time format (use HH:MM:SS)")
        onClipRangeChange(null)
        return
      }

      const validationError = validateClipRange(startSec, endSec, durationSeconds)
      if (validationError) {
        setError(validationError)
        onClipRangeChange(null)
        return
      }

      setError(null)
      onClipRangeChange({ startSeconds: startSec, endSeconds: endSec })
    },
    [durationSeconds, onClipRangeChange]
  )

  const handleToggle = useCallback(
    (checked: boolean) => {
      setIsEnabled(checked)
      validateAndUpdate(checked, startTime, endTime)
    },
    [startTime, endTime, validateAndUpdate]
  )

  const handleStartChange = useCallback(
    (value: string) => {
      setStartTime(value)
      validateAndUpdate(isEnabled, value, endTime)
    },
    [isEnabled, endTime, validateAndUpdate]
  )

  const handleEndChange = useCallback(
    (value: string) => {
      setEndTime(value)
      validateAndUpdate(isEnabled, startTime, value)
    },
    [isEnabled, startTime, validateAndUpdate]
  )

  // Compute clip duration for display
  const clipDuration = (() => {
    if (!isEnabled) return null
    const startSec = timeStringToSeconds(startTime)
    const endSec = timeStringToSeconds(endTime)
    if (startSec === null || endSec === null || endSec <= startSec) return null
    return endSec - startSec
  })()

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <ScissorsIcon className="w-4 h-4" />
          Clip Video
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

      {/* Time inputs (visible when enabled) */}
      {isEnabled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-xs text-text-secondary">
            Video duration: {secondsToTimeString(durationSeconds)}
          </p>

          <div className="flex items-center gap-3">
            {/* Start time */}
            <div className="flex-1 space-y-1">
              <label className="text-xs text-text-secondary">Start</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                placeholder="00:00:00"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Separator */}
            <div className="flex items-end pb-1">
              <span className="text-text-secondary font-medium">to</span>
            </div>

            {/* End time */}
            <div className="flex-1 space-y-1">
              <label className="text-xs text-text-secondary">End</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => handleEndChange(e.target.value)}
                placeholder="00:00:00"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Clip duration info */}
          {clipDuration !== null && !error && (
            <p className="text-xs text-primary">
              Clip duration: {secondsToTimeString(clipDuration, false)}
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-error">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  )
}
