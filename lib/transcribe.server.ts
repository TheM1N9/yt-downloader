/**
 * Server-side transcription/caption extraction for uploaded videos.
 *
 * Strategy:
 *  1. Probe the video for embedded subtitle streams via ffprobe
 *  2. If embedded subs exist → extract them with ffmpeg
 *  3. Otherwise → use Whisper CLI for speech-to-text transcription
 *  4. Parse the resulting SRT/VTT into CaptionEntry[]
 */
import { existsSync, readFileSync, mkdtempSync, rmSync, readdirSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { execAsync } from "./yt-dlp"
import type { CaptionEntry } from "./caption"
import { parseVtt } from "./caption"

// ============================================================================
// FFPROBE: detect embedded subtitle streams
// ============================================================================

interface SubtitleStream {
  index: number
  language: string
  title?: string
}

/** Probe the video file for embedded subtitle streams */
async function probeSubtitleStreams(filePath: string): Promise<SubtitleStream[]> {
  const result = await execAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    "-select_streams", "s",
    filePath,
  ])

  if (result.exitCode !== 0) return []

  try {
    const data = JSON.parse(result.stdout)
    const streams: SubtitleStream[] = (data.streams || []).map(
      (s: { index: number; tags?: { language?: string; title?: string } }) => ({
        index: s.index,
        language: s.tags?.language || "und",
        title: s.tags?.title,
      })
    )
    return streams
  } catch {
    return []
  }
}

// ============================================================================
// FFMPEG: extract embedded subtitles as SRT
// ============================================================================

/** Extract embedded subtitles from a specific stream index as SRT text */
async function extractEmbeddedSubtitles(
  filePath: string,
  streamIndex: number
): Promise<string | null> {
  const tmpDir = mkdtempSync(join(tmpdir(), "caption-extract-"))
  const outputPath = join(tmpDir, "output.srt")

  try {
    const result = await execAsync("ffmpeg", [
      "-i", filePath,
      "-map", `0:${streamIndex}`,
      "-f", "srt",
      "-y",
      outputPath,
    ])

    if (result.exitCode !== 0) return null

    if (existsSync(outputPath)) {
      return readFileSync(outputPath, "utf-8")
    }
    return null
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ============================================================================
// WHISPER: speech-to-text transcription
// ============================================================================

/** Check if the whisper CLI is available */
async function isWhisperAvailable(): Promise<boolean> {
  try {
    const result = await execAsync("whisper", ["--help"])
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Transcribe a video file using Whisper speech-to-text.
 * Uses the "base" model for a balance of speed and accuracy.
 * Returns the VTT content string, or null on failure.
 */
async function transcribeWithWhisper(filePath: string): Promise<string | null> {
  const tmpDir = mkdtempSync(join(tmpdir(), "whisper-"))

  try {
    // Use whisper CLI to transcribe and output VTT
    const result = await execAsync("whisper", [
      filePath,
      "--model", "base",
      "--output_format", "vtt",
      "--output_dir", tmpDir,
      "--verbose", "False",
    ], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    })

    if (result.exitCode !== 0) {
      console.error("[transcribe] Whisper failed:", result.stderr)
      return null
    }

    // Whisper outputs <filename>.vtt in the output dir
    const vttFiles = readdirSync(tmpDir).filter((f) => f.endsWith(".vtt"))
    if (vttFiles.length === 0) return null

    return readFileSync(join(tmpDir, vttFiles[0]), "utf-8")
  } catch (err) {
    console.error("[transcribe] Whisper error:", err)
    return null
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ============================================================================
// SRT PARSER
// ============================================================================

/** Parse SRT content into CaptionEntry[] */
function parseSrt(srt: string): CaptionEntry[] {
  const entries: CaptionEntry[] = []
  // Split on double newline (or more) to get blocks
  const blocks = srt.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/)
    if (lines.length < 2) continue

    // Find the timestamp line (contains " --> ")
    const timestampLineIndex = lines.findIndex((l) => l.includes(" --> "))
    if (timestampLineIndex < 0) continue

    const timestampLine = lines[timestampLineIndex]
    const match = timestampLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )
    if (!match) continue

    const start =
      parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseInt(match[3]) +
      parseInt(match[4]) / 1000

    const end =
      parseInt(match[5]) * 3600 +
      parseInt(match[6]) * 60 +
      parseInt(match[7]) +
      parseInt(match[8]) / 1000

    // Text is everything after the timestamp line
    const text = lines
      .slice(timestampLineIndex + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "") // Strip HTML tags
      .replace(/\{[^}]+\}/g, "") // Strip SSA style tags
      .trim()

    if (text) {
      entries.push({ start, duration: end - start, text })
    }
  }

  return entries
}

// ============================================================================
// PUBLIC API: extract captions from uploaded video
// ============================================================================

export interface TranscriptionResult {
  entries: CaptionEntry[]
  method: "embedded" | "whisper"
  language?: string
}

/**
 * Extract captions from an uploaded video file.
 *
 * 1. Checks for embedded subtitle streams and extracts the first one found
 * 2. Falls back to Whisper speech-to-text if no embedded subs and whisper is available
 * 3. Returns the parsed caption entries and the extraction method used
 */
export async function extractCaptions(filePath: string): Promise<TranscriptionResult> {
  // Step 1: Check for embedded subtitle streams
  const subtitleStreams = await probeSubtitleStreams(filePath)

  if (subtitleStreams.length > 0) {
    // Try to extract the first subtitle stream
    const srtContent = await extractEmbeddedSubtitles(filePath, subtitleStreams[0].index)
    if (srtContent) {
      const entries = parseSrt(srtContent)
      if (entries.length > 0) {
        return {
          entries,
          method: "embedded",
          language: subtitleStreams[0].language,
        }
      }
    }
  }

  // Step 2: Fall back to Whisper speech-to-text
  const whisperAvailable = await isWhisperAvailable()

  if (!whisperAvailable) {
    throw new Error(
      "No embedded subtitles found in this video and Whisper is not installed. " +
      "Install Whisper (pip install openai-whisper) for speech-to-text transcription."
    )
  }

  const vttContent = await transcribeWithWhisper(filePath)

  if (!vttContent) {
    throw new Error("Whisper transcription failed. The video may not contain audible speech.")
  }

  const entries = parseVtt(vttContent)

  if (entries.length === 0) {
    throw new Error("No captions could be extracted from the video. It may not contain audible speech.")
  }

  return {
    entries,
    method: "whisper",
    language: "en",
  }
}
