"use client"

import { useState, useCallback } from "react"
import { UrlInput } from "@/components/url-input"
import { VideoInfoCard } from "@/components/video-info-card"
import { FormatSelector } from "@/components/format-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { VideoInfo, VideoFormat } from "@/lib/video"

export default function VideoPage() {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [formats, setFormats] = useState<VideoFormat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingItag, setDownloadingItag] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchVideoInfo = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    setVideoId(id)
    setVideoInfo(null)
    setFormats([])

    try {
      const response = await fetch(`/api/video/info?videoId=${id}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch video info")
      }
      const data = await response.json()
      setVideoInfo(data.info)
      setFormats(data.formats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownload = useCallback(
    async (format: VideoFormat) => {
      if (!videoId) return

      setIsDownloading(true)
      setDownloadingItag(format.itag)
      setError(null)

      try {
        // Always download through backend server
        const downloadUrl = `/api/video/download?videoId=${videoId}&itag=${format.itag}`

        // Use anchor tag with download attribute to trigger browser download
        const a = document.createElement("a")
        a.href = downloadUrl
        a.style.display = "none"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (err) {
        console.error("Download failed:", err)
        setError(err instanceof Error ? err.message : "Download failed")
      } finally {
        setIsDownloading(false)
        setDownloadingItag(null)
      }
    },
    [videoId]
  )

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">Video Downloader</h1>
          <p className="text-text-secondary">
            Download YouTube videos in various qualities and formats
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter YouTube URL</CardTitle>
            <CardDescription>
              Paste a YouTube video URL or video ID to see available formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput onSubmit={fetchVideoInfo} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="py-4">
              <p className="text-error text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Video Info */}
        {videoInfo && <VideoInfoCard video={videoInfo} />}

        {/* Format Selector */}
        {formats.length > 0 && (
          <FormatSelector
            formats={formats}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            downloadingItag={downloadingItag}
          />
        )}

        {/* Note about formats */}
        {formats.length > 0 && (
          <Card className="bg-background">
            <CardContent className="py-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Note:</strong> All downloads are
                processed through the server. Formats marked &quot;Video + Audio&quot;
                contain both streams. Video-only formats require separate audio.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
