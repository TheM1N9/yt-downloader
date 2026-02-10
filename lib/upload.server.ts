/**
 * Server-side upload storage management.
 * Handles saving uploaded video files to a temporary directory,
 * generating unique filenames, and cleaning up files older than 1 hour.
 */
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

// ============================================================================
// UPLOAD DIRECTORY CONFIG
// ============================================================================

/** Resolve the uploads directory path (uses /tmp in production for ephemeral storage) */
function getUploadsDir(): string {
  const base = process.env.UPLOADS_DIR || join(process.cwd(), "uploads")
  if (!existsSync(base)) {
    mkdirSync(base, { recursive: true })
  }
  return base
}

export const UPLOADS_DIR = getUploadsDir()

/** Max file age before auto-deletion (1 hour in ms) */
const MAX_FILE_AGE_MS = 60 * 60 * 1000

/** Cleanup interval (every 10 minutes) */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000

/** Max upload file size (500 MB) */
export const MAX_UPLOAD_SIZE = 500 * 1024 * 1024

/** Accepted video MIME types */
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/ogg",
  "video/3gpp",
  "video/x-flv",
  "video/mpeg",
  "video/mp2t",
] as const

/** Accepted video file extensions */
export const ACCEPTED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
  ".ogv",
  ".3gp",
  ".flv",
  ".mpeg",
  ".mpg",
  ".ts",
  ".m4v",
] as const

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/** Generate a unique file ID */
export function generateFileId(): string {
  return crypto.randomBytes(16).toString("hex")
}

/** Get the file extension from a filename */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : ""
}

/** Validate that the file type is an accepted video format */
export function isAcceptedVideoFile(filename: string, mimeType?: string): boolean {
  const ext = getExtension(filename)
  const isValidExt = ACCEPTED_VIDEO_EXTENSIONS.includes(ext as typeof ACCEPTED_VIDEO_EXTENSIONS[number])

  if (mimeType) {
    const isValidMime = ACCEPTED_VIDEO_TYPES.includes(mimeType as typeof ACCEPTED_VIDEO_TYPES[number])
    return isValidExt || isValidMime
  }

  return isValidExt
}

/** Save an uploaded file to the uploads directory. Returns the fileId and stored path. */
export async function saveUploadedFile(
  file: File
): Promise<{ fileId: string; filePath: string; originalName: string }> {
  const fileId = generateFileId()
  const ext = getExtension(file.name) || ".mp4"
  const storedName = `${fileId}${ext}`
  const filePath = join(UPLOADS_DIR, storedName)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  return { fileId, filePath, originalName: file.name }
}

/** Get the stored file path for a given fileId. Returns null if not found. */
export function getUploadedFilePath(fileId: string): string | null {
  if (!fileId || !/^[a-f0-9]{32}$/.test(fileId)) return null

  const dir = UPLOADS_DIR
  if (!existsSync(dir)) return null

  const files = readdirSync(dir)
  const match = files.find((f) => f.startsWith(fileId))

  return match ? join(dir, match) : null
}

/** Delete an uploaded file by fileId */
export function deleteUploadedFile(fileId: string): boolean {
  const filePath = getUploadedFilePath(fileId)
  if (!filePath) return false

  try {
    unlinkSync(filePath)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// AUTOMATIC CLEANUP (deletes files older than 1 hour)
// ============================================================================

/** Remove all files in the uploads directory older than MAX_FILE_AGE_MS */
function cleanupOldUploads(): void {
  const dir = UPLOADS_DIR
  if (!existsSync(dir)) return

  const now = Date.now()
  let deletedCount = 0

  try {
    const files = readdirSync(dir)
    for (const file of files) {
      const filePath = join(dir, file)
      try {
        const stats = statSync(filePath)
        if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
          unlinkSync(filePath)
          deletedCount++
        }
      } catch {
        // Skip files we can't stat or delete
      }
    }

    if (deletedCount > 0) {
      console.log(`[upload-cleanup] Deleted ${deletedCount} expired upload(s)`)
    }
  } catch (err) {
    console.error("[upload-cleanup] Error during cleanup:", err)
  }
}

// Start the cleanup interval (runs every 10 minutes, auto-unref so it doesn't block shutdown)
const cleanupTimer = setInterval(cleanupOldUploads, CLEANUP_INTERVAL_MS)
cleanupTimer.unref()

// Run cleanup once on module load
cleanupOldUploads()
