import { spawn, execSync, SpawnOptions } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
import { Readable } from "stream"
import type { InstagramVideoInfo } from "./instagram-url"

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

function getEnvWithDeno(): NodeJS.ProcessEnv {
  const denoPath = join(process.env.HOME || "", ".deno/bin")
  return { ...process.env, PATH: `${denoPath}:${process.env.PATH || ""}` }
}

function getCookiesPath(): string | undefined {
  const cookiesPath = join(process.cwd(), "cookies.txt")
  return existsSync(cookiesPath) ? cookiesPath : undefined
}

function baseArgs(): string[] {
  const args = ["--no-warnings", "--no-playlist"]
  const cookiesPath = getCookiesPath()
  if (cookiesPath) args.push("--cookies", cookiesPath)
  return args
}

function spawnOpts(): SpawnOptions {
  return { env: getEnvWithDeno(), stdio: ["pipe", "pipe", "pipe"] }
}

function execYtDlpJson(url: string): Record<string, unknown> {
  const output = execSync(
    [YT_DLP_PATH, ...baseArgs(), "-j", url].join(" "),
    {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      env: getEnvWithDeno(),
    }
  )
  return JSON.parse(output) as Record<string, unknown>
}

export async function getInstagramVideoInfo(normalizedUrl: string): Promise<InstagramVideoInfo> {
  const info = execYtDlpJson(normalizedUrl)
  const id = (info.id as string) || "unknown"
  const title = (info.title as string) || (info.description as string) || "Instagram video"
  const thumbnails = info.thumbnails as Array<{ url: string }> | undefined
  const thumbnail =
    (info.thumbnail as string) ||
    thumbnails?.[thumbnails.length - 1]?.url ||
    ""

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
