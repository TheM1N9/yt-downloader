/**
 * Video types and constants that can be imported by both client and server components
 */

export interface VideoInfo {
  id: string
  title: string
  description: string
  lengthSeconds: number
  viewCount: number
  channelName: string
  channelUrl: string
  thumbnail: string
  publishDate: string
}

export interface VideoFormat {
  itag: number
  qualityLabel: string
  container: string
  hasVideo: boolean
  hasAudio: boolean
  bitrate?: number
  audioBitrate?: number
  mimeType?: string
  protocol?: string
}

// ============================================================================
// ENCODING OPTIONS
// ============================================================================

export const VIDEO_ENCODINGS = ["original", "h264"] as const
export type VideoEncoding = (typeof VIDEO_ENCODINGS)[number]

export const VIDEO_ENCODING_LABELS: Record<VideoEncoding, string> = {
  original: "Original (Fast)",
  h264: "H.264 (YouTube Compatible)",
}

// Format presets for UI
export const VIDEO_QUALITY_PRESETS = [
  { label: "1080p", itag: 137, hasAudio: false },
  { label: "720p", itag: 136, hasAudio: false },
  { label: "720p", itag: 22, hasAudio: true },
  { label: "480p", itag: 135, hasAudio: false },
  { label: "360p", itag: 18, hasAudio: true },
  { label: "360p", itag: 134, hasAudio: false },
] as const

export const AUDIO_QUALITY_PRESETS = [
  { label: "256kbps", itag: 141 },
  { label: "128kbps", itag: 140 },
  { label: "128kbps", itag: 251 },
  { label: "64kbps", itag: 250 },
] as const
