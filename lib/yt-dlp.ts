/**
 * Shared yt-dlp utilities with async execution and in-memory caching
 * Replaces blocking execSync with non-blocking spawn
 */
import { spawn, SpawnOptions } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

// ============================================================================
// YT-DLP PATH & CONFIG
// ============================================================================

function findYtDlpPath(): string {
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

export const YT_DLP_PATH = findYtDlpPath()

export function getEnvWithDeno(): NodeJS.ProcessEnv {
  const denoPath = join(process.env.HOME || "", ".deno/bin")
  return { ...process.env, PATH: `${denoPath}:${process.env.PATH || ""}` }
}

export function getCookiesPath(): string | undefined {
  const cookiesPath = join(process.cwd(), "cookies.txt")
  return existsSync(cookiesPath) ? cookiesPath : undefined
}

export function baseArgs(): string[] {
  const args = ["--no-warnings", "--no-playlist"]
  const cookies = getCookiesPath()
  if (cookies) args.push("--cookies", cookies)
  return args
}

export function spawnOpts(): SpawnOptions {
  return { env: getEnvWithDeno(), stdio: ["pipe", "pipe", "pipe"] }
}

// ============================================================================
// IN-MEMORY CACHE WITH TTL
// ============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly defaultTtlMs: number

  constructor(defaultTtlMs = 60 * 60 * 1000) {
    // Default: 1 hour TTL
    this.defaultTtlMs = defaultTtlMs

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref()
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance - video info cached for 1 hour
export const videoInfoCache = new MemoryCache(60 * 60 * 1000)

// ============================================================================
// ASYNC YT-DLP EXECUTION (NON-BLOCKING)
// ============================================================================

/**
 * Execute yt-dlp asynchronously and return JSON output
 * This does NOT block the Node.js event loop
 */
export function execYtDlpJsonAsync(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const args = [...baseArgs(), "-j", url]
    const proc = spawn(YT_DLP_PATH, args, spawnOpts())

    const chunks: Buffer[] = []
    let stderr = ""

    proc.stdout?.on("data", (chunk: Buffer) => {
      chunks.push(chunk)
    })

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on("error", (err) => {
      reject(new Error(`yt-dlp spawn error: ${err.message}`))
    })

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const output = Buffer.concat(chunks).toString("utf-8")
        const json = JSON.parse(output)
        resolve(json)
      } catch (err) {
        reject(new Error(`Failed to parse yt-dlp JSON output: ${err}`))
      }
    })
  })
}

/**
 * Execute yt-dlp with caching - returns cached result if available
 */
export async function execYtDlpJsonCached(
  url: string,
  cacheKey?: string
): Promise<Record<string, unknown>> {
  const key = cacheKey || `ytdlp:${url}`

  // Check cache first
  const cached = videoInfoCache.get<Record<string, unknown>>(key)
  if (cached) {
    return cached
  }

  // Fetch and cache
  const result = await execYtDlpJsonAsync(url)
  videoInfoCache.set(key, result)
  return result
}

// ============================================================================
// ASYNC COMMAND EXECUTION (FOR CAPTIONS, ETC.)
// ============================================================================

export interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Execute any command asynchronously
 */
export function execAsync(
  command: string,
  args: string[],
  options?: SpawnOptions
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options || spawnOpts())

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk)
    })

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk)
    })

    proc.on("error", (err) => {
      reject(new Error(`Spawn error: ${err.message}`))
    })

    proc.on("close", (code) => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        exitCode: code ?? 1,
      })
    })
  })
}

// ============================================================================
// STATS FOR MONITORING
// ============================================================================

export function getCacheStats() {
  return {
    size: videoInfoCache.size(),
    // Add more stats as needed
  }
}
