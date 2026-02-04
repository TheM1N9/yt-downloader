import { spawn } from "child_process"
import { Readable } from "stream"
import type { InstagramVideoInfo } from "./instagram-url"
import { YT_DLP_PATH, baseArgs, spawnOpts, execYtDlpJsonCached } from "./yt-dlp"

export async function getInstagramVideoInfo(
  normalizedUrl: string
): Promise<InstagramVideoInfo> {
  const cacheKey = `ig:info:${normalizedUrl}`
  const info = await execYtDlpJsonCached(normalizedUrl, cacheKey)

  const id = (info.id as string) || "unknown"
  const title =
    (info.title as string) || (info.description as string) || "Instagram video"
  const thumbnails = info.thumbnails as Array<{ url: string }> | undefined
  const thumbnail =
    (info.thumbnail as string) || thumbnails?.[thumbnails.length - 1]?.url || ""

  return {
    id,
    title: String(title).replace(/\n/g, " ").trim(),
    description: (info.description as string) || "",
    duration: Number(info.duration) || 0,
    thumbnail,
    uploader: (info.uploader as string) || (info.creator as string) || "",
    uploaderUrl: (info.uploader_url as string) || "",
    viewCount: Number(info.view_count) || 0,
    uploadDate: (info.upload_date as string) || "",
    url: normalizedUrl,
  }
}

export function createInstagramDownloadStream(normalizedUrl: string): Readable {
  const args = [...baseArgs(), "-f", "best", "-o", "-", normalizedUrl]
  const proc = spawn(YT_DLP_PATH, args, spawnOpts())
  proc.stderr?.on("data", (data: Buffer) => {
    console.error("yt-dlp [instagram]:", data.toString().trim())
  })
  proc.on("error", (err) => {
    console.error("yt-dlp spawn error:", err)
  })
  return proc.stdout as Readable
}
