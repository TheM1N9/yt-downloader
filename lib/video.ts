import ytdl, { Cookie } from "@distube/ytdl-core"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { spawn } from "child_process"
import { Readable } from "stream"

// Path to yt-dlp binary
const YT_DLP_PATH = join(process.env.HOME || "", ".local/bin/yt-dlp")

// Try to load cookies from cookies.json file in project root
function loadCookies(): Cookie[] | undefined {
  const cookiesPath = join(process.cwd(), "cookies.json")
  if (existsSync(cookiesPath)) {
    try {
      const cookies = JSON.parse(readFileSync(cookiesPath, "utf-8")) as Cookie[]
      console.log("Loaded YouTube cookies from cookies.json")
      return cookies
    } catch (e) {
      console.warn("Failed to parse cookies.json:", e)
    }
  }
  return undefined
}

const cookies = loadCookies()

// Create agent with cookies if available, or default agent
const agent = cookies
  ? ytdl.createAgent(cookies)
  : ytdl.createAgent(undefined)

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
  contentLength?: string
  bitrate?: number
  audioBitrate?: number
  mimeType?: string
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })
  const details = info.videoDetails

  return {
    id: details.videoId,
    title: details.title,
    description: details.description || "",
    lengthSeconds: parseInt(details.lengthSeconds),
    viewCount: parseInt(details.viewCount),
    channelName: details.author.name,
    channelUrl: details.author.channel_url,
    thumbnail: details.thumbnails[details.thumbnails.length - 1]?.url || "",
    publishDate: details.publishDate || "",
  }
}

export async function getVideoFormats(videoId: string): Promise<VideoFormat[]> {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })

  // Return all formats with quality info (streaming handled by backend)
  return info.formats
    .filter((f) => f.qualityLabel || f.audioBitrate)
    .map((f) => ({
      itag: f.itag,
      qualityLabel: f.qualityLabel || `${f.audioBitrate}kbps`,
      container: f.container,
      hasVideo: f.hasVideo,
      hasAudio: f.hasAudio,
      contentLength: f.contentLength,
      bitrate: f.bitrate,
      audioBitrate: f.audioBitrate,
      mimeType: f.mimeType,
    }))
    .sort((a, b) => {
      // Sort by quality (higher first)
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

// Create video stream using yt-dlp (more reliable for all formats)
// For video-only formats, this will NOT merge audio (use createMergedStream for that)
export function createVideoStream(videoId: string, itag: number): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`

  const args = [
    "-f", itag.toString(),
    "-o", "-", // Output to stdout
    "--no-warnings",
    "--no-playlist",
    url,
  ]

  const ytDlp = spawn(YT_DLP_PATH, args)

  ytDlp.stderr.on("data", (data: Buffer) => {
    console.error("yt-dlp stderr:", data.toString())
  })

  ytDlp.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
  })

  return ytDlp.stdout
}

// Create merged video+audio stream by quality (e.g., "1080", "720", "480")
// Downloads to temp file, merges, then streams the result
export function createMergedStream(videoId: string, quality: string): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const tmpDir = "/tmp"
  const tmpFile = join(tmpDir, `yt-${videoId}-${quality}-${Date.now()}.mp4`)

  // Format: best video at specified height + best audio, fallback to best
  const formatStr = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`

  const args = [
    "-f", formatStr,
    "-o", tmpFile,
    "--no-warnings",
    "--no-playlist",
    "--merge-output-format", "mp4",
    url,
  ]

  // Create a passthrough stream that we'll pipe the file to after download
  const { PassThrough } = require("stream")
  const outputStream = new PassThrough()

  const ytDlp = spawn(YT_DLP_PATH, args)

  ytDlp.stderr.on("data", (data: Buffer) => {
    console.error("yt-dlp stderr:", data.toString())
  })

  ytDlp.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
    outputStream.destroy(err)
  })

  ytDlp.on("close", (code) => {
    if (code === 0) {
      // Download complete, stream the file
      const { createReadStream, unlink } = require("fs")
      const fileStream = createReadStream(tmpFile)

      fileStream.on("end", () => {
        // Clean up temp file
        unlink(tmpFile, () => {})
      })

      fileStream.on("error", (err: Error) => {
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
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })
  const format = info.formats.find((f) => f.itag === itag)

  if (!format) return null

  return {
    itag: format.itag,
    qualityLabel: format.qualityLabel || `${format.audioBitrate}kbps`,
    container: format.container,
    hasVideo: format.hasVideo,
    hasAudio: format.hasAudio,
    contentLength: format.contentLength,
    bitrate: format.bitrate,
    audioBitrate: format.audioBitrate,
    mimeType: format.mimeType,
  }
}
