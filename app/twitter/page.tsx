"use client"

import { useState, useCallback } from "react"
import { UrlInput } from "@/components/url-input"
import { TwitterVideoCard } from "@/components/twitter-video-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { extractTwitterUrl } from "@/lib/twitter-url"
import type { TwitterVideoInfo } from "@/lib/twitter-url"

export default function TwitterPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<TwitterVideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideoInfo = useCallback(async (url: string) => {
    setIsLoading(true)
    setError(null)
    setVideoUrl(url)
    setVideoInfo(null)

    try {
      const response = await fetch(`/api/twitter/info?url=${encodeURIComponent(url)}`)
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
      const downloadUrl = `/api/twitter/download?url=${encodeURIComponent(videoUrl)}`
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Download failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "twitter_video.mp4"
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
            Twitter / X Video Downloader
          </h1>
          <p className="text-text-secondary">
            Download videos from Twitter (X) posts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Twitter / X URL</CardTitle>
            <CardDescription>
              Paste a tweet URL that contains a video to preview and download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput
              onSubmit={fetchVideoInfo}
              isLoading={isLoading}
              placeholder="Paste Twitter or X post URL..."
              extractValue={extractTwitterUrl}
              invalidError="Invalid Twitter / X URL (e.g. x.com/username/status/123)"
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
          <TwitterVideoCard
            video={videoInfo}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        )}
      </div>
    </div>
  )
}
