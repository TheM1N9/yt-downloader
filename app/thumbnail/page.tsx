"use client"

import { useState, useCallback } from "react"
import { UrlInput } from "@/components/url-input"
import { ThumbnailGrid } from "@/components/thumbnail-grid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ThumbnailWithAvailability } from "@/lib/thumbnail"

export default function ThumbnailPage() {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<ThumbnailWithAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchThumbnails = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    setVideoId(id)
    
    try {
      const response = await fetch(`/api/thumbnail/check?videoId=${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch thumbnails")
      }
      const data = await response.json()
      setThumbnails(data.thumbnails)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setThumbnails([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    if (!videoId) return
    
    setIsDownloadingAll(true)
    try {
      const response = await fetch(`/api/thumbnail/zip?videoId=${videoId}`)
      if (!response.ok) throw new Error("Failed to create ZIP")
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${videoId}_thumbnails.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download all failed:", err)
    } finally {
      setIsDownloadingAll(false)
    }
  }, [videoId])

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Thumbnail Downloader
          </h1>
          <p className="text-text-secondary">
            Download YouTube video thumbnails in all available resolutions
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter YouTube URL</CardTitle>
            <CardDescription>
              Paste a YouTube video URL or video ID to fetch available thumbnails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput onSubmit={fetchThumbnails} isLoading={isLoading} />
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

        {/* Results */}
        {videoId && thumbnails.length > 0 && (
          <ThumbnailGrid
            videoId={videoId}
            thumbnails={thumbnails}
            onDownloadAll={handleDownloadAll}
            isDownloadingAll={isDownloadingAll}
          />
        )}
      </div>
    </div>
  )
}
