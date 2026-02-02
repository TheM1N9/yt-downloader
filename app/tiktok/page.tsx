"use client"

import { useState, useCallback } from "react"
import { UrlInput } from "@/components/url-input"
import { TiktokVideoCard } from "@/components/tiktok-video-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { extractTiktokUrl } from "@/lib/tiktok-url"
import type { TiktokVideoInfo } from "@/lib/tiktok-url"

export default function TiktokPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<TiktokVideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideoInfo = useCallback(async (url: string) => {
    setIsLoading(true)
    setError(null)
    setVideoUrl(url)
    setVideoInfo(null)

    try {
      const response = await fetch(`/api/tiktok/info?url=${encodeURIComponent(url)}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch video info")
      }
      const data = await response.json()
      setVideoInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!videoUrl) return

    setIsDownloading(true)
    setError(null)

    try {
      const downloadUrl = `/api/tiktok/download?url=${encodeURIComponent(videoUrl)}`
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Download failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "tiktok_video.mp4"
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i)
        if (match) {
          filename = decodeURIComponent(match[1])
        }
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = filename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error("Download failed:", err)
      setError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setIsDownloading(false)
    }
  }, [videoUrl])

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            TikTok Video Downloader
          </h1>
          <p className="text-text-secondary">
            Download TikTok videos. Paste a video or short link to preview and download.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter TikTok URL</CardTitle>
            <CardDescription>
              Paste a TikTok video URL or short link (vm.tiktok.com, tiktok.com/t/...)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput
              onSubmit={fetchVideoInfo}
              isLoading={isLoading}
              placeholder="Paste TikTok video or short link..."
              extractValue={extractTiktokUrl}
              invalidError="Invalid TikTok URL (e.g. tiktok.com/@user/video/123 or vm.tiktok.com/xxx)"
            />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="py-4">
              <p className="text-error text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {videoInfo && (
          <TiktokVideoCard
            video={videoInfo}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        )}
      </div>
    </div>
  )
}
