import { NextRequest, NextResponse } from "next/server"
import { getUploadedFilePath } from "@/lib/upload.server"
import { extractCaptions } from "@/lib/transcribe.server"

/**
 * POST /api/caption/upload/transcribe
 *
 * Extracts captions from a previously uploaded video file.
 * Accepts a JSON body with { fileId }.
 *
 * Returns the extracted caption entries and the method used (embedded or whisper).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId } = body as { fileId?: string }

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId. Upload a video first." },
        { status: 400 }
      )
    }

    // Locate the uploaded file
    const filePath = getUploadedFilePath(fileId)

    if (!filePath) {
      return NextResponse.json(
        { error: "File not found. It may have been deleted or expired (files are removed after 1 hour)." },
        { status: 404 }
      )
    }

    // Extract captions
    const result = await extractCaptions(filePath)

    return NextResponse.json({
      entries: result.entries,
      method: result.method,
      language: result.language,
      entryCount: result.entries.length,
    })
  } catch (error) {
    console.error("[transcribe] Error:", error)

    const message =
      error instanceof Error ? error.message : "Failed to extract captions"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
