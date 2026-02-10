import { NextRequest, NextResponse } from "next/server"
import { getUploadedFilePath } from "@/lib/upload.server"
import { extractCaptions } from "@/lib/transcribe.server"
import {
  convertCaptions,
  CAPTION_FORMATS,
  type CaptionFormat,
} from "@/lib/caption"

/**
 * GET /api/caption/upload/download?fileId=...&format=srt
 *
 * Downloads captions extracted from an uploaded video in the requested format.
 * Re-extracts captions from the stored file (which remains until the 1-hour cleanup).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileId = searchParams.get("fileId")
  const format = searchParams.get("format") as CaptionFormat

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing fileId parameter." },
      { status: 400 }
    )
  }

  if (!format || !CAPTION_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `Invalid format. Supported formats: ${CAPTION_FORMATS.join(", ")}` },
      { status: 400 }
    )
  }

  // Locate the uploaded file
  const filePath = getUploadedFilePath(fileId)

  if (!filePath) {
    return NextResponse.json(
      { error: "File not found. It may have been deleted or expired." },
      { status: 404 }
    )
  }

  try {
    const result = await extractCaptions(filePath)
    const content = convertCaptions(result.entries, format)

    const mimeTypes: Record<CaptionFormat, string> = {
      srt: "application/x-subrip",
      vtt: "text/vtt",
      txt: "text/plain",
    }

    const filename = `captions_${result.language || "und"}.${format}`

    return new NextResponse(content, {
      headers: {
        "Content-Type": `${mimeTypes[format]}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[download] Error:", error)

    const message =
      error instanceof Error ? error.message : "Failed to extract captions"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
