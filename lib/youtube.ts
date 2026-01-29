import { z } from "zod"

const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
]

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  
  return null
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null
}

export const youtubeUrlSchema = z.string().refine(
  (val) => extractVideoId(val) !== null,
  { message: "Invalid YouTube URL or video ID" }
)

export const THUMBNAIL_RESOLUTIONS = [
  { name: "Max Resolution", key: "maxresdefault", width: 1280, height: 720 },
  { name: "SD Default", key: "sddefault", width: 640, height: 480 },
  { name: "HQ Default", key: "hqdefault", width: 480, height: 360 },
  { name: "MQ Default", key: "mqdefault", width: 320, height: 180 },
  { name: "Default", key: "default", width: 120, height: 90 },
] as const

export type ThumbnailResolution = (typeof THUMBNAIL_RESOLUTIONS)[number]

export function getThumbnailUrl(videoId: string, resolution: string): string {
  return `https://img.youtube.com/vi/${videoId}/${resolution}.jpg`
}

export function getAllThumbnailUrls(videoId: string) {
  return THUMBNAIL_RESOLUTIONS.map((res) => ({
    ...res,
    url: getThumbnailUrl(videoId, res.key),
  }))
}
