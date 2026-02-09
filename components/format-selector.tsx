"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipRangeSelector, type ClipRange } from "@/components/clip-range-selector"
import {
  VIDEO_ENCODINGS,
  VIDEO_ENCODING_LABELS,
  type VideoFormat,
  type VideoEncoding,
} from "@/lib/video.types"

interface FormatSelectorProps {
  formats: VideoFormat[]
  onDownload: (format: VideoFormat, encoding: VideoEncoding, clipRange?: ClipRange | null) => void
  isDownloading: boolean
  downloadingItag: number | null
  /** Total video duration in seconds (needed for clip range validation) */
  durationSeconds?: number
}

type MediaType = "video" | "audio"

interface QualityOption {
  label: string
  value: string
  format: VideoFormat
}

export function FormatSelector({
  formats,
  onDownload,
  isDownloading,
  durationSeconds = 0,
}: FormatSelectorProps) {
  const [mediaType, setMediaType] = useState<MediaType>("video")
  const [selectedQuality, setSelectedQuality] = useState<string>("")
  const [selectedEncoding, setSelectedEncoding] = useState<VideoEncoding>("original")
  const [clipRange, setClipRange] = useState<ClipRange | null>(null)

  const handleClipRangeChange = useCallback((range: ClipRange | null) => {
    setClipRange(range)
  }, [])

  // Process formats into quality options
  const { videoQualities, audioQualities } = useMemo(() => {
    const videoFormats = formats.filter((f) => f.hasVideo)
    const audioFormats = formats.filter((f) => f.hasAudio && !f.hasVideo)

    // Dedupe and sort video formats by quality (prefer formats with audio)
    const videoMap = new Map<string, VideoFormat>()
    for (const f of videoFormats) {
      const key = f.qualityLabel
      if (!key) continue
      const existing = videoMap.get(key)
      // Prefer format with audio, or higher bitrate
      if (!existing || (f.hasAudio && !existing.hasAudio)) {
        videoMap.set(key, f)
      }
    }

    const videoQualities: QualityOption[] = Array.from(videoMap.entries())
      .map(([label, format]) => ({
        label: `${label}${format.hasAudio ? "" : " "}`,
        value: label,
        format,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.value) || 0
        const bNum = parseInt(b.value) || 0
        return bNum - aNum
      })

    // Dedupe and sort audio formats by bitrate
    const audioMap = new Map<string, VideoFormat>()
    for (const f of audioFormats) {
      const key = f.qualityLabel
      if (!key) continue
      if (!audioMap.has(key)) {
        audioMap.set(key, f)
      }
    }

    const audioQualities: QualityOption[] = Array.from(audioMap.entries())
      .map(([label, format]) => ({
        label,
        value: label,
        format,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.value) || 0
        const bNum = parseInt(b.value) || 0
        return bNum - aNum
      })

    return { videoQualities, audioQualities }
  }, [formats])

  // Set default selection when qualities change
  useMemo(() => {
    if (mediaType === "video" && videoQualities.length > 0 && !selectedQuality) {
      // Default to 720p if available, otherwise first option
      const defaultQuality = videoQualities.find((q) => q.value === "720p")?.value || videoQualities[0]?.value
      setSelectedQuality(defaultQuality || "")
    } else if (mediaType === "audio" && audioQualities.length > 0 && !selectedQuality) {
      // Default to 128kbps if available
      const defaultQuality = audioQualities.find((q) => q.value.includes("128"))?.value || audioQualities[0]?.value
      setSelectedQuality(defaultQuality || "")
    }
  }, [mediaType, videoQualities, audioQualities, selectedQuality])

  // Reset quality when media type changes
  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type)
    if (type === "video") {
      const defaultQuality = videoQualities.find((q) => q.value === "720p")?.value || videoQualities[0]?.value
      setSelectedQuality(defaultQuality || "")
    } else {
      const defaultQuality = audioQualities.find((q) => q.value.includes("128"))?.value || audioQualities[0]?.value
      setSelectedQuality(defaultQuality || "")
    }
  }

  const currentQualities = mediaType === "video" ? videoQualities : audioQualities
  const selectedFormat = currentQualities.find((q) => q.value === selectedQuality)?.format

  const handleDownload = () => {
    if (selectedFormat) {
      onDownload(selectedFormat, selectedEncoding, clipRange)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Download Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Media Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Download Type
          </label>
          <div className="relative">
            <select
              value={mediaType}
              onChange={(e) => handleMediaTypeChange(e.target.value as MediaType)}
              className="w-full h-11 px-4 pr-10 rounded-lg border border-border bg-background text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quality Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            {mediaType === "video" ? "Video Quality" : "Audio Quality"}
          </label>
          <div className="relative">
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-lg border border-border bg-background text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {currentQualities.length === 0 ? (
                <option value="">No {mediaType} formats available</option>
              ) : (
                currentQualities.map((quality) => (
                  <option key={quality.value} value={quality.value}>
                    {quality.label}
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clip Range Selector */}
        {durationSeconds > 0 && (
          <ClipRangeSelector
            durationSeconds={durationSeconds}
            onClipRangeChange={handleClipRangeChange}
          />
        )}

        {/* Encoding Selector - Only for video */}
        {mediaType === "video" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Video Format
            </label>
            <div className="relative">
              <select
                value={selectedEncoding}
                onChange={(e) => setSelectedEncoding(e.target.value as VideoEncoding)}
                className="w-full h-11 px-4 pr-10 rounded-lg border border-border bg-background text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {VIDEO_ENCODINGS.map((encoding) => (
                  <option key={encoding} value={encoding}>
                    {VIDEO_ENCODING_LABELS[encoding]}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {selectedEncoding === "h264" && (
              <p className="text-xs text-text-secondary">
                Re-encodes video with H.264 codec for YouTube compatibility. Takes longer but ensures maximum compatibility.
              </p>
            )}
          </div>
        )}

        {/* Loading Animation */}
        {isDownloading && (
          <div className="p-6 rounded-lg bg-surface border border-border">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-border"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                {/* Download icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </div>
              {/* Status text */}
              <div className="text-center">
                <p className="text-text-primary font-medium">
                  {clipRange ? "Clipping & Downloading" : "Downloading"} {mediaType === "video" ? "Video" : "Audio"}...
                </p>
                <p className="text-text-secondary text-sm mt-1">
                  {selectedQuality}{clipRange ? " (clip)" : ""} • Please wait, this may take a moment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        <Button
          className="w-full h-12 text-base"
          onClick={handleDownload}
          disabled={!selectedFormat || isDownloading}
          isLoading={isDownloading}
        >
          {isDownloading
            ? (clipRange ? "Clipping & Downloading..." : "Downloading...")
            : clipRange
              ? `Download Clip (${mediaType === "video" ? "Video" : "Audio"})`
              : `Download ${mediaType === "video" ? "Video" : "Audio"}`}
        </Button>
      </CardContent>
    </Card>
  )
}
