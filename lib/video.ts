import { spawn } from "child_process"
import { createReadStream, unlink } from "fs"
import { join } from "path"
import { Readable, PassThrough } from "stream"
import {
  YT_DLP_PATH,
  baseArgs,
  spawnOpts,
  execYtDlpJsonCached,
  videoInfoCache,
} from "./yt-dlp"

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

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const cacheKey = `yt:info:${videoId}`

  const info = await execYtDlpJsonCached(url, cacheKey)

  return {
    id: info.id as string,
    title: info.title as string,
    description: (info.description as string) || "",
    lengthSeconds: (info.duration as number) || 0,
    viewCount: (info.view_count as number) || 0,
    channelName: (info.channel as string) || (info.uploader as string) || "",
    channelUrl: (info.channel_url as string) || (info.uploader_url as string) || "",
    thumbnail:
      (info.thumbnail as string) ||
      (info.thumbnails as { url: string }[])?.[
        (info.thumbnails as { url: string }[])?.length - 1
      ]?.url ||
      "",
    publishDate: (info.upload_date as string) || "",
  }
}

export async function getVideoFormats(videoId: string): Promise<VideoFormat[]> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const cacheKey = `yt:info:${videoId}`

  const info = await execYtDlpJsonCached(url, cacheKey)
  const formats = (info.formats as Record<string, unknown>[]) || []

  return formats
    .filter(
      (f) =>
        f.format_id && ((f.vcodec as string) !== "none" || (f.acodec as string) !== "none")
    )
    .map((f) => {
      const hasVideo = (f.vcodec as string) !== "none" && !!(f.vcodec as string)
      const hasAudio = (f.acodec as string) !== "none" && !!(f.acodec as string)

      let qualityLabel = ""
      if (hasVideo && f.height) {
        qualityLabel = `${f.height}p`
      } else if (hasAudio && f.abr) {
        qualityLabel = `${Math.round(f.abr as number)}kbps`
      } else if (f.format_note) {
        qualityLabel = f.format_note as string
      }

      return {
        itag: parseInt(f.format_id as string) || 0,
        qualityLabel,
        container: (f.ext as string) || "",
        hasVideo,
        hasAudio,
        bitrate: f.tbr ? Math.round((f.tbr as number) * 1000) : undefined,
        audioBitrate: f.abr ? Math.round(f.abr as number) : undefined,
        mimeType:
          hasVideo && hasAudio
            ? `video/${f.ext}; codecs="${f.vcodec}, ${f.acodec}"`
            : hasVideo
              ? `video/${f.ext}; codecs="${f.vcodec}"`
              : `audio/${f.ext}; codecs="${f.acodec}"`,
        protocol: f.protocol as string | undefined,
      }
    })
    .sort((a: VideoFormat, b: VideoFormat) => {
      const aQuality = parseInt(a.qualityLabel) || 0
      const bQuality = parseInt(b.qualityLabel) || 0
      return bQuality - aQuality
    })
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

// Stream a specific format by itag
export function createVideoStream(videoId: string, itag: number): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const args = [...baseArgs(), "-f", itag.toString(), "-o", "-", url]

  const proc = spawn(YT_DLP_PATH, args, spawnOpts())

  proc.stderr?.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  proc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
  })

  return proc.stdout as Readable
}

// Download video+audio by quality (e.g., "1080", "720")
// Downloads to temp file, merges video+audio, then streams the result
export function createMergedStream(videoId: string, quality: string): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const tmpFile = join("/tmp", `yt-${videoId}-${quality}-${Date.now()}.mp4`)

  // Format selector priority:
  // 1. HLS stream at specified height (already has video+audio)
  // 2. Best video at height + best audio (requires merge)
  // 3. Any best format at height
  const formatStr = [
    `best[protocol=m3u8][height<=${quality}]`,
    `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]`,
    `bestvideo[height<=${quality}]+bestaudio`,
    `best[height<=${quality}]`,
    `best`,
  ].join("/")

  const args = [
    ...baseArgs(),
    "-f",
    formatStr,
    "-o",
    tmpFile,
    "--merge-output-format",
    "mp4",
    url,
  ]

  const outputStream = new PassThrough()
  const proc = spawn(YT_DLP_PATH, args, spawnOpts())

  proc.stderr?.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  proc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
    outputStream.destroy(err)
  })

  proc.on("close", (code) => {
    if (code === 0) {
      // Download complete, stream the file
      const fileStream = createReadStream(tmpFile)

      fileStream.on("end", () => unlink(tmpFile, () => {}))
      fileStream.on("error", (err) => {
        outputStream.destroy(err)
        unlink(tmpFile, () => {})
      })

      fileStream.pipe(outputStream)
    } else {
      outputStream.destroy(new Error(`yt-dlp exited with code ${code}`))
    }
  })

  return outputStream
}

// Get format info for a specific itag
export async function getFormatInfo(
  videoId: string,
  itag: number
): Promise<VideoFormat | null> {
  const formats = await getVideoFormats(videoId)
  return formats.find((f) => f.itag === itag) || null
}
