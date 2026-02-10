import { NextRequest, NextResponse } from "next/server"
import {
  saveUploadedFile,
  isAcceptedVideoFile,
  MAX_UPLOAD_SIZE,
} from "@/lib/upload.server"

/**
 * POST /api/caption/upload
 *
 * Accepts a multipart form-data upload with a video file.
 * Saves the file to the uploads directory and returns a fileId
 * that can be used to trigger transcription.
 *
 * The file is automatically deleted after ~1 hour by the cleanup timer.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a video file." },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isAcceptedVideoFile(file.name, file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a video file (MP4, WebM, MOV, AVI, MKV, etc.)." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      const maxMB = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024))
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${maxMB} MB.` },
        { status: 400 }
      )
    }

    // Save the file
    const { fileId, originalName } = await saveUploadedFile(file)

    return NextResponse.json({
      fileId,
      originalName,
      size: file.size,
      message: "File uploaded successfully. Use the fileId to trigger transcription.",
    })
  } catch (error) {
    console.error("[upload] Error:", error)
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    )
  }
}
