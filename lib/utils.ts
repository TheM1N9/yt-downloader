import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num)
}

// ============================================================================
// TIME INPUT HELPERS (for clip range feature)
// ============================================================================

/**
 * Format total seconds into HH:MM:SS or MM:SS string
 * Always returns HH:MM:SS when includeHours is true
 */
export function secondsToTimeString(totalSeconds: number, includeHours = true): string {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = Math.floor(totalSeconds % 60)

  if (includeHours || hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Parse a time string (HH:MM:SS or MM:SS) into total seconds.
 * Returns null if the format is invalid.
 */
export function timeStringToSeconds(timeStr: string): number | null {
  const trimmed = timeStr.trim()
  if (!trimmed) return null

  const parts = trimmed.split(":").map(Number)

  // Validate all parts are numbers
  if (parts.some(isNaN)) return null

  if (parts.length === 3) {
    const [hrs, mins, secs] = parts
    if (hrs < 0 || mins < 0 || mins >= 60 || secs < 0 || secs >= 60) return null
    return hrs * 3600 + mins * 60 + secs
  }

  if (parts.length === 2) {
    const [mins, secs] = parts
    if (mins < 0 || secs < 0 || secs >= 60) return null
    return mins * 60 + secs
  }

  // Single number treated as seconds
  if (parts.length === 1 && parts[0] >= 0) {
    return parts[0]
  }

  return null
}

/**
 * Validate a clip range against video duration.
 * Returns an error message string or null if valid.
 */
export function validateClipRange(
  startSeconds: number,
  endSeconds: number,
  durationSeconds: number
): string | null {
  if (startSeconds < 0) return "Start time cannot be negative"
  if (endSeconds <= startSeconds) return "End time must be after start time"
  if (endSeconds > durationSeconds) return "End time exceeds video duration"
  if (endSeconds - startSeconds < 1) return "Clip must be at least 1 second long"
  return null
}
