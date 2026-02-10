"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VideoClipSelector, type ClipRange } from "@/components/video-clip-selector"
import {
  VIDEO_ENCODINGS,
  VIDEO_ENCODING_LABELS,
  type VideoFormat,
  type VideoEncoding,
} from "@/lib/video.types"
import { cn } from "@/lib/utils"
import { 
  Video, 
  Music, 
  Download, 
  Scissors, 
  Check, 
  Settings2,
  AlertCircle
} from "lucide-react"

interface FormatSelectorProps {
  formats: VideoFormat[]
  onDownload: (format: VideoFormat, encoding: VideoEncoding, clipRange?: ClipRange | null) => void
  isDownloading: boolean
  downloadingItag: number | null
  /** Total video duration in seconds (needed for clip range validation) */
  durationSeconds?: number
  /** YouTube video ID for clip preview */
  videoId?: string
}

type MediaType = "video" | "audio"

interface QualityOption {
  label: string
  value: string
  format: VideoFormat
  badge?: string
}

export function FormatSelector({
  formats,
  onDownload,
  isDownloading,
  durationSeconds = 0,
  videoId,
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
        label: label,
        value: label,
        format,
        badge: format.hasAudio ? undefined : "No Audio",
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
        label: label.replace('kbps', ''),
        value: label,
        format,
        badge: 'kbps'
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-surface/50">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Download Options
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-8 pt-6">
        {/* Media Type Selector (Segmented Control) */}
        <div className="bg-surface border border-border p-1 rounded-lg flex">
          <button
            onClick={() => handleMediaTypeChange("video")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all",
              mediaType === "video"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-background hover:text-text-primary"
            )}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
          <button
            onClick={() => handleMediaTypeChange("audio")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all",
              mediaType === "audio"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-background hover:text-text-primary"
            )}
          >
            <Music className="w-4 h-4" />
            Audio
          </button>
        </div>

        {/* Quality Selector (Grid) */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary flex items-center justify-between">
            <span>Select Quality</span>
            <span className="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">
              {currentQualities.length} options
            </span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentQualities.length === 0 ? (
              <div className="col-span-full py-8 text-center text-text-secondary bg-surface rounded-lg border border-border border-dashed">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No {mediaType} formats available
              </div>
            ) : (
              currentQualities.map((quality) => {
                const isSelected = selectedQuality === quality.value
                return (
                  <button
                    key={quality.value}
                    onClick={() => setSelectedQuality(quality.value)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-surface hover:border-primary/30 hover:bg-surface/80 text-text-secondary"
                    )}
                  >
                    <span className="text-lg font-bold">{quality.label}</span>
                    {quality.badge && (
                      <span className="text-[10px] uppercase tracking-wider opacity-70">
                        {quality.badge}
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Video Clip Selector with Preview */}
        {durationSeconds > 0 && videoId && (
          <div className="pt-2 border-t border-border/50">
            <VideoClipSelector
              videoId={videoId}
              durationSeconds={durationSeconds}
              onClipRangeChange={handleClipRangeChange}
            />
          </div>
        )}

        {/* Encoding Selector - Only for video */}
        {mediaType === "video" && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <label className="text-sm font-medium text-text-primary">
              Format Compatibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIDEO_ENCODINGS.map((encoding) => {
                 const isSelected = selectedEncoding === encoding
                 return (
                  <button
                    key={encoding}
                    onClick={() => setSelectedEncoding(encoding)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-surface hover:border-primary/30 text-text-secondary"
                    )}
                  >
                    <span className="text-sm font-medium">{VIDEO_ENCODING_LABELS[encoding]}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                 )
              })}
            </div>
            {selectedEncoding === "h264" && (
              <p className="text-xs text-text-secondary flex items-start gap-1.5 bg-surface p-2 rounded border border-border/50">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Re-encodes video with H.264 codec. Best for compatibility with older devices, but takes longer to process.
              </p>
            )}
          </div>
        )}

        {/* Loading Animation */}
        {isDownloading && (
          <div className="p-6 rounded-lg bg-surface border border-border animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              {/* Status text */}
              <div className="text-center space-y-1">
                <p className="text-text-primary font-medium">
                  {clipRange ? "Processing Clip & Downloading" : "Preparing Download"}...
                </p>
                <p className="text-text-secondary text-sm">
                  {selectedQuality} • {mediaType === "video" ? "Video" : "Audio"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        <Button
          className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
          onClick={handleDownload}
          disabled={!selectedFormat || isDownloading}
          isLoading={isDownloading}
        >
          {isDownloading ? (
            "Processing..."
          ) : (
            <span className="flex items-center gap-2">
              {clipRange ? <Scissors className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              {clipRange
                ? `Download Clip (${mediaType === "video" ? "Video" : "Audio"})`
                : `Download ${mediaType === "video" ? "Video" : "Audio"}`}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
