import { spawn, execSync } from "child_process"
import { createReadStream, existsSync, unlink } from "fs"
import { join } from "path"
import { Readable, PassThrough } from "stream"

// Find yt-dlp binary
function getYtDlpPath(): string {
  const paths = [
    join(process.env.HOME || "", ".local/bin/yt-dlp"),
    "/usr/local/bin/yt-dlp",
    "/opt/homebrew/bin/yt-dlp",
    "yt-dlp",
  ]
  for (const p of paths) {
    if (p === "yt-dlp" || existsSync(p)) return p
  }
  return "yt-dlp"
}

const YT_DLP_PATH = getYtDlpPath()

// Cookies file path (Netscape format)
function getCookiesPath(): string | undefined {
  const cookiesPath = join(process.cwd(), "cookies.txt")
  return existsSync(cookiesPath) ? cookiesPath : undefined
}

const cookiesPath = getCookiesPath()

// Base args for all yt-dlp calls
function baseArgs(): string[] {
  const args = ["--no-warnings", "--no-playlist"]
  if (cookiesPath) args.push("--cookies", cookiesPath)
  return args
}

// Execute yt-dlp and parse JSON output
function execYtDlp(videoId: string): any {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const args = [...baseArgs(), "-j", url]

  const output = execSync([YT_DLP_PATH, ...args].join(" "), {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  })

  return JSON.parse(output)
}

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
  const info = execYtDlp(videoId)

  return {
    id: info.id,
    title: info.title,
    description: info.description || "",
    lengthSeconds: info.duration || 0,
    viewCount: info.view_count || 0,
    channelName: info.channel || info.uploader || "",
    channelUrl: info.channel_url || info.uploader_url || "",
    thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || "",
    publishDate: info.upload_date || "",
  }
}

export async function getVideoFormats(videoId: string): Promise<VideoFormat[]> {
  const info = execYtDlp(videoId)
  const formats = info.formats || []

  return formats
    .filter((f: any) => f.format_id && (f.vcodec !== "none" || f.acodec !== "none"))
    .map((f: any) => {
      const hasVideo = f.vcodec !== "none" && !!f.vcodec
      const hasAudio = f.acodec !== "none" && !!f.acodec

      let qualityLabel = ""
      if (hasVideo && f.height) {
        qualityLabel = `${f.height}p`
      } else if (hasAudio && f.abr) {
        qualityLabel = `${Math.round(f.abr)}kbps`
      } else if (f.format_note) {
        qualityLabel = f.format_note
      }

      return {
        itag: parseInt(f.format_id) || 0,
        qualityLabel,
        container: f.ext || "",
        hasVideo,
        hasAudio,
        bitrate: f.tbr ? Math.round(f.tbr * 1000) : undefined,
        audioBitrate: f.abr ? Math.round(f.abr) : undefined,
        mimeType: hasVideo && hasAudio
          ? `video/${f.ext}; codecs="${f.vcodec}, ${f.acodec}"`
          : hasVideo
            ? `video/${f.ext}; codecs="${f.vcodec}"`
            : `audio/${f.ext}; codecs="${f.acodec}"`,
        protocol: f.protocol,
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

  const proc = spawn(YT_DLP_PATH, args)

  proc.stderr.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  proc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
  })

  return proc.stdout
}

// Download and merge video+audio by quality (e.g., "1080", "720")
export function createMergedStream(videoId: string, quality: string): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const tmpFile = join("/tmp", `yt-${videoId}-${quality}-${Date.now()}.mp4`)

  // Format selector: best video at height + best audio, with fallbacks
  const formatStr = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`

  const args = [
    ...baseArgs(),
    "-f", formatStr,
    "-o", tmpFile,
    "--merge-output-format", "mp4",
    url,
  ]

  const outputStream = new PassThrough()
  const proc = spawn(YT_DLP_PATH, args)

  proc.stderr.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  proc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
    outputStream.destroy(err)
  })

  proc.on("close", (code) => {
    if (code === 0) {
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
export async function getFormatInfo(videoId: string, itag: number): Promise<VideoFormat | null> {
  const formats = await getVideoFormats(videoId)
  return formats.find((f) => f.itag === itag) || null
}
