"use client"

import { useState, useCallback } from "react"
import { VideoUpload } from "@/components/video-upload"
import { CaptionPreview } from "@/components/caption-preview"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import type { CaptionEntry, CaptionFormat } from "@/lib/caption"
import { CAPTION_FORMATS } from "@/lib/caption"
import { formatBytes } from "@/lib/utils"

type UploadState = "idle" | "uploading" | "transcribing" | "done" | "error"

export default function UploadCaptionPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [fileId, setFileId] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number>(0)
  const [captionEntries, setCaptionEntries] = useState<CaptionEntry[]>([])
  const [transcriptionMethod, setTranscriptionMethod] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<CaptionFormat>("srt")
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Upload the file, then immediately trigger transcription */
  const handleFileSelected = useCallback(async (file: File) => {
    setError(null)
    setCaptionEntries([])
    setTranscriptionMethod(null)
    setFileId(null)
    setFileName(file.name)
    setFileSize(file.size)

    // Step 1: Upload
    setUploadState("uploading")
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/caption/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || "Upload failed")
      }

      const uploadData = await uploadRes.json()
      const uploadedFileId = uploadData.fileId as string
      setFileId(uploadedFileId)

      // Step 2: Transcribe
      setUploadState("transcribing")

      const transcribeRes = await fetch("/api/caption/upload/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: uploadedFileId }),
      })

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json()
        throw new Error(data.error || "Transcription failed")
      }

      const transcribeData = await transcribeRes.json()
      setCaptionEntries(transcribeData.entries)
      setTranscriptionMethod(transcribeData.method)
      setUploadState("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setUploadState("error")
    }
  }, [])

  /** Download captions in the selected format */
  const handleDownload = useCallback(async () => {
    if (!fileId) return

    setIsDownloading(true)
    try {
      const res = await fetch(
        `/api/caption/upload/download?fileId=${encodeURIComponent(fileId)}&format=${selectedFormat}`
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Download failed")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `captions.${selectedFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
    } finally {
      setIsDownloading(false)
    }
  }, [fileId, selectedFormat])

  /** Reset the form to upload a new file */
  const handleReset = useCallback(() => {
    setUploadState("idle")
    setFileId(null)
    setFileName(null)
    setFileSize(0)
    setCaptionEntries([])
    setTranscriptionMethod(null)
    setError(null)
  }, [])

  const isProcessing = uploadState === "uploading" || uploadState === "transcribing"

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Upload Video Captions
          </h1>
          <p className="text-text-secondary">
            Upload a video file to extract captions and subtitles. Files are automatically deleted after 1 hour.
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Drag & drop or browse to upload a video file. Supports MP4, WebM, MOV, AVI, MKV, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadState === "idle" || uploadState === "error" ? (
              <VideoUpload
                onFileSelected={handleFileSelected}
                isUploading={false}
              />
            ) : (
              // Show file info + processing state
              <div className="space-y-4">
                {/* File info bar */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                  <FileVideoIcon className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatBytes(fileSize)}
                    </p>
                  </div>
                  {uploadState === "done" && (
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                      Done
                    </span>
                  )}
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="p-6 rounded-lg bg-surface border border-border">
                    <div className="flex flex-col items-center gap-4">
                      {/* Spinner */}
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-border/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {uploadState === "uploading" ? (
                            <UploadIcon className="w-6 h-6 text-primary animate-pulse" />
                          ) : (
                            <CaptionIcon className="w-6 h-6 text-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-text-primary font-medium">
                          {uploadState === "uploading"
                            ? "Uploading video..."
                            : "Extracting captions..."}
                        </p>
                        <p className="text-text-secondary text-sm">
                          {uploadState === "uploading"
                            ? "Saving your video file"
                            : "This may take a moment for longer videos"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ErrorIcon className="w-4 h-4 text-error" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-error text-sm font-medium">{error}</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Controls (show when captions are extracted) */}
        {uploadState === "done" && captionEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Export Captions</CardTitle>
              <CardDescription>
                {captionEntries.length} caption entries extracted
                {transcriptionMethod === "embedded"
                  ? " from embedded subtitles"
                  : " via speech-to-text"}
                .{" "}
                Choose a format and download.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="upload-caption-format"
                    className="text-sm font-medium text-text-primary"
                  >
                    Format
                  </label>
                  <Select
                    id="upload-caption-format"
                    value={selectedFormat}
                    onChange={(e) =>
                      setSelectedFormat(e.target.value as CaptionFormat)
                    }
                  >
                    {CAPTION_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    isLoading={isDownloading}
                    className="flex-1 sm:flex-initial"
                  >
                    <DownloadIcon className="w-4 h-4 mr-1.5" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    New Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Caption Preview */}
        {uploadState === "done" && captionEntries.length > 0 && (
          <CaptionPreview entries={captionEntries} maxLines={20} />
        )}

        {/* Info notice about file cleanup */}
        <div className="text-center text-xs text-text-secondary/70 space-y-1">
          <p>Uploaded files are automatically deleted after 1 hour for your privacy.</p>
          <p>
            Supports embedded subtitle extraction and speech-to-text via{" "}
            <a
              href="https://github.com/openai/whisper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Whisper
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INLINE SVG ICONS
// ============================================================================

function FileVideoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m10 11 5 3-5 3v-6Z" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

function CaptionIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M13 8H7" />
      <path d="M17 12H7" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" x2="9" y1="9" y2="15" />
      <line x1="9" x2="15" y1="9" y2="15" />
    </svg>
  )
}
