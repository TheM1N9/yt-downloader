import { spawn, type ChildProcess } from "child_process"
import { createReadStream, unlink, existsSync } from "fs"
import { join } from "path"
import { Readable, PassThrough } from "stream"
import {
  YT_DLP_PATH,
  baseArgs,
  spawnOpts,
  execYtDlpJsonCached,
  getEnvWithDeno,
} from "./yt-dlp"

// Re-export types and constants from video.types.ts for backward compatibility
export {
  VIDEO_ENCODINGS,
  VIDEO_ENCODING_LABELS,
  VIDEO_QUALITY_PRESETS,
  AUDIO_QUALITY_PRESETS,
  type VideoInfo,
  type VideoFormat,
  type VideoEncoding,
} from "./video.types"

import type { VideoInfo, VideoFormat } from "./video.types"

/**
 * Find ffmpeg path
 */
function findFfmpegPath(): string {
  const paths = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "ffmpeg",
  ]
  for (const p of paths) {
    if (p === "ffmpeg" || existsSync(p)) return p
  }
  return "ffmpeg"
}

const FFMPEG_PATH = findFfmpegPath()

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const cacheKey = `yt:info:${videoId}`

  const info = await execYtDlpJsonCached(url, cacheKey)

  const id = info.id as string
  return {
    id,
    videoId: id,
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

// ============================================================================
// TIME-BASED CLIPPING
// ============================================================================

/**
 * Download a video and clip it to a specific time range using ffmpeg.
 *
 * Strategy:
 * 1. Download the full video using yt-dlp to a temp file (merged video+audio)
 * 2. Use ffmpeg to extract the requested time range
 * 3. Stream the clipped file back to the caller
 *
 * Uses `-c copy` for fast, lossless clipping when possible.
 * Falls back to re-encoding only when the caller also requests H.264 encoding.
 */
export function createClippedStream(
  videoId: string,
  quality: string,
  startSeconds: number,
  endSeconds: number,
): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const timestamp = Date.now()
  const tmpInputFile = join("/tmp", `yt-${videoId}-${quality}-${timestamp}-clip-input.mp4`)
  const tmpOutputFile = join("/tmp", `yt-${videoId}-${quality}-${timestamp}-clip-output.mp4`)

  // Format selector for yt-dlp (same priority as createMergedStream)
  const formatStr = [
    `best[protocol=m3u8][height<=${quality}]`,
    `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]`,
    `bestvideo[height<=${quality}]+bestaudio`,
    `best[height<=${quality}]`,
    `best`,
  ].join("/")

  const ytDlpArgs = [
    ...baseArgs(),
    "-f",
    formatStr,
    "-o",
    tmpInputFile,
    "--merge-output-format",
    "mp4",
    url,
  ]

  const outputStream = new PassThrough()
  let ffmpegProcRef: ChildProcess | null = null
  let cleanupDone = false

  const killProc = (proc: ChildProcess | null) => {
    if (proc && !proc.killed) proc.kill("SIGKILL")
  }

  const doCleanup = () => {
    if (cleanupDone) return
    cleanupDone = true
    killProc(ytDlpProc)
    killProc(ffmpegProcRef)
    cleanup(tmpInputFile, tmpOutputFile)
  }

  outputStream.on("close", doCleanup)
  outputStream.on("error", (err) => {
    doCleanup()
    outputStream.destroy(err)
  })

  // Step 1: Download the video
  const ytDlpProc = spawn(YT_DLP_PATH, ytDlpArgs, spawnOpts())

  ytDlpProc.stderr?.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  ytDlpProc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
    doCleanup()
    outputStream.destroy(err)
  })

  ytDlpProc.on("close", (code) => {
    if (cleanupDone) return
    if (code !== 0) {
      doCleanup()
      outputStream.destroy(new Error(`yt-dlp exited with code ${code}`))
      return
    }

    // Step 2: Clip with ffmpeg using stream copy (fast, no re-encoding)
    const ffmpegArgs = [
      "-ss", startSeconds.toString(),
      "-to", endSeconds.toString(),
      "-i", tmpInputFile,
      "-c", "copy",                   // Stream copy for speed
      "-movflags", "+faststart",      // Move moov atom for web streaming
      "-avoid_negative_ts", "make_zero",
      "-y",
      tmpOutputFile,
    ]

    console.log(
      `Clipping video ${videoId} from ${startSeconds}s to ${endSeconds}s (${endSeconds - startSeconds}s)`
    )
    const ffmpegProc = spawn(FFMPEG_PATH, ffmpegArgs, {
      env: getEnvWithDeno(),
      stdio: ["pipe", "pipe", "pipe"],
    })
    ffmpegProcRef = ffmpegProc

    ffmpegProc.stderr?.on("data", (data: Buffer) => {
      const message = data.toString().trim()
      if (message.includes("frame=") || message.includes("time=")) {
        console.log("ffmpeg clip progress:", message.split("\n").pop())
      }
    })

    ffmpegProc.on("error", (err) => {
      console.error("ffmpeg spawn error:", err)
      doCleanup()
      outputStream.destroy(err)
    })

    ffmpegProc.on("close", (ffmpegCode) => {
      if (cleanupDone) return
      // Remove the full input file immediately
      unlink(tmpInputFile, () => {})

      if (ffmpegCode !== 0) {
        doCleanup()
        outputStream.destroy(new Error(`ffmpeg clipping exited with code ${ffmpegCode}`))
        return
      }

      console.log(`Clipping complete for video ${videoId}`)

      // Stream the clipped file
      const fileStream = createReadStream(tmpOutputFile)

      fileStream.on("end", () => {
        unlink(tmpOutputFile, () => {})
      })

      fileStream.on("error", (err) => {
        outputStream.destroy(err)
        unlink(tmpOutputFile, () => {})
      })

      fileStream.pipe(outputStream)
    })
  })

  return outputStream
}

// ============================================================================
// H264 ENCODING
// ============================================================================

/**
 * Download video and re-encode to H.264 format
 * This creates a YouTube-compatible MP4 with:
 * - Video: H.264 (libx264) with high compatibility profile
 * - Audio: AAC
 * - Container: MP4 with faststart for web streaming
 */
export function createH264EncodedStream(
  videoId: string,
  quality: string
): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const timestamp = Date.now()
  const tmpInputFile = join("/tmp", `yt-${videoId}-${quality}-${timestamp}-input.mp4`)
  const tmpOutputFile = join("/tmp", `yt-${videoId}-${quality}-${timestamp}-h264.mp4`)

  // Format selector for yt-dlp - same as createMergedStream
  const formatStr = [
    `best[protocol=m3u8][height<=${quality}]`,
    `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]`,
    `bestvideo[height<=${quality}]+bestaudio`,
    `best[height<=${quality}]`,
    `best`,
  ].join("/")

  const ytDlpArgs = [
    ...baseArgs(),
    "-f",
    formatStr,
    "-o",
    tmpInputFile,
    "--merge-output-format",
    "mp4",
    url,
  ]

  const outputStream = new PassThrough()
  let ffmpegProcRef: ChildProcess | null = null
  let cleanupDone = false

  const killProc = (proc: ChildProcess | null) => {
    if (proc && !proc.killed) proc.kill("SIGKILL")
  }

  const doCleanup = () => {
    if (cleanupDone) return
    cleanupDone = true
    killProc(ytDlpProc)
    killProc(ffmpegProcRef)
    cleanup(tmpInputFile, tmpOutputFile)
  }

  outputStream.on("close", () => {
    doCleanup()
  })

  outputStream.on("error", (err) => {
    doCleanup()
    outputStream.destroy(err)
  })

  // Step 1: Download the video using yt-dlp
  const ytDlpProc = spawn(YT_DLP_PATH, ytDlpArgs, spawnOpts())

  ytDlpProc.stderr?.on("data", (data: Buffer) => {
    console.error("yt-dlp:", data.toString().trim())
  })

  ytDlpProc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
    doCleanup()
    outputStream.destroy(err)
  })

  ytDlpProc.on("close", (code) => {
    if (cleanupDone) return
    if (code !== 0) {
      doCleanup()
      outputStream.destroy(new Error(`yt-dlp exited with code ${code}`))
      return
    }

    // Step 2: Re-encode to H.264 using ffmpeg
    const ffmpegArgs = [
      "-i", tmpInputFile,
      "-c:v", "libx264",        // H.264 video codec
      "-preset", "medium",      // Encoding speed/quality balance
      "-crf", "23",             // Quality (18-28 is good, lower = better quality)
      "-profile:v", "high",     // H.264 profile for maximum compatibility
      "-level:v", "4.1",        // H.264 level for 1080p support
      "-pix_fmt", "yuv420p",    // Pixel format for maximum compatibility
      "-c:a", "aac",            // AAC audio codec
      "-b:a", "192k",           // Audio bitrate
      "-ar", "48000",           // Audio sample rate (YouTube standard)
      "-ac", "2",               // Stereo audio
      "-movflags", "+faststart", // Move moov atom for streaming
      "-y",                     // Overwrite output
      tmpOutputFile,
    ]

    console.log(`Starting H264 encoding for video ${videoId}`)
    const ffmpegProc = spawn(FFMPEG_PATH, ffmpegArgs, {
      env: getEnvWithDeno(),
      stdio: ["pipe", "pipe", "pipe"],
    })
    ffmpegProcRef = ffmpegProc

    ffmpegProc.stderr?.on("data", (data: Buffer) => {
      const message = data.toString().trim()
      // Only log progress updates occasionally
      if (message.includes("frame=") || message.includes("time=")) {
        console.log("ffmpeg progress:", message.split("\n").pop())
      }
    })

    ffmpegProc.on("error", (err) => {
      console.error("ffmpeg spawn error:", err)
      doCleanup()
      outputStream.destroy(err)
    })

    ffmpegProc.on("close", (ffmpegCode) => {
      if (cleanupDone) return
      // Clean up input file
      unlink(tmpInputFile, () => {})

      if (ffmpegCode !== 0) {
        doCleanup()
        outputStream.destroy(new Error(`ffmpeg exited with code ${ffmpegCode}`))
        return
      }

      console.log(`H264 encoding complete for video ${videoId}`)

      // Stream the encoded file
      const fileStream = createReadStream(tmpOutputFile)

      fileStream.on("end", () => {
        unlink(tmpOutputFile, () => {})
      })

      fileStream.on("error", (err) => {
        outputStream.destroy(err)
        unlink(tmpOutputFile, () => {})
      })

      fileStream.pipe(outputStream)
    })
  })

  return outputStream
}

/**
 * Cleanup temporary files
 */
function cleanup(...files: string[]) {
  for (const file of files) {
    unlink(file, () => {})
  }
}
