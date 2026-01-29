"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatBytes } from "@/lib/utils"
import type { VideoFormat } from "@/lib/video"

interface FormatSelectorProps {
  formats: VideoFormat[]
  onDownload: (format: VideoFormat) => void
  isDownloading: boolean
  downloadingItag: number | null
}

type TabType = "video" | "audio"

export function FormatSelector({
  formats,
  onDownload,
  isDownloading,
  downloadingItag,
}: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("video")

  const videoFormats = formats.filter((f) => f.hasVideo && f.hasAudio)
  const videoOnlyFormats = formats.filter((f) => f.hasVideo && !f.hasAudio)
  const audioFormats = formats.filter((f) => f.hasAudio && !f.hasVideo)

  // Combine and dedupe video formats, prefer with audio
  const combinedVideoFormats = [...videoFormats]
  for (const vo of videoOnlyFormats) {
    if (!combinedVideoFormats.some((v) => v.qualityLabel === vo.qualityLabel)) {
      combinedVideoFormats.push(vo)
    }
  }

  // Sort by quality
  combinedVideoFormats.sort((a, b) => {
    const aNum = parseInt(a.qualityLabel) || 0
    const bNum = parseInt(b.qualityLabel) || 0
    return bNum - aNum
  })

  // Dedupe audio formats
  const uniqueAudioFormats = audioFormats.reduce((acc, curr) => {
    const existing = acc.find((a) => a.qualityLabel === curr.qualityLabel)
    if (!existing) acc.push(curr)
    return acc
  }, [] as VideoFormat[])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Select Format</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("video")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "video"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "audio"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Audio Only
          </button>
        </div>

        {/* Format List */}
        <div className="space-y-2">
          {activeTab === "video" && (
            <>
              {combinedVideoFormats.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">
                  No video formats available
                </p>
              ) : (
                combinedVideoFormats.map((format) => (
                  <FormatRow
                    key={format.itag}
                    format={format}
                    onDownload={onDownload}
                    isDownloading={isDownloading && downloadingItag === format.itag}
                    disabled={isDownloading}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "audio" && (
            <>
              {uniqueAudioFormats.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">
                  No audio formats available
                </p>
              ) : (
                uniqueAudioFormats.map((format) => (
                  <FormatRow
                    key={format.itag}
                    format={format}
                    onDownload={onDownload}
                    isDownloading={isDownloading && downloadingItag === format.itag}
                    disabled={isDownloading}
                    isAudio
                  />
                ))
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface FormatRowProps {
  format: VideoFormat
  onDownload: (format: VideoFormat) => void
  isDownloading: boolean
  disabled: boolean
  isAudio?: boolean
}

function FormatRow({
  format,
  onDownload,
  isDownloading,
  disabled,
  isAudio,
}: FormatRowProps) {
  const size = format.contentLength ? formatBytes(parseInt(format.contentLength)) : "~"

  return (
    <div className="flex items-center justify-between p-3 rounded-[6px] bg-background border border-border hover:border-primary/30">
      <div className="flex items-center gap-3">
        <span className="font-medium text-text-primary min-w-[60px]">
          {format.qualityLabel}
        </span>
        <span className="text-sm text-text-secondary font-mono uppercase">
          {format.container}
        </span>
        {!isAudio && !format.hasAudio && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
            No Audio
          </span>
        )}
        {format.hasVideo && format.hasAudio && (
          <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
            Video + Audio
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary font-mono">{size}</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onDownload(format)}
          isLoading={isDownloading}
          disabled={disabled}
        >
          {isDownloading ? "Downloading..." : "Download"}
        </Button>
      </div>
    </div>
  )
}
