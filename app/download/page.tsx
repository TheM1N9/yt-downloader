"use client"

import { useState, useCallback } from "react"
import { UnifiedUrlInput } from "@/components/unified-url-input"
import { UnifiedMediaCard, type UnifiedMediaInfo } from "@/components/unified-media-card"
import { FormatSelector } from "@/components/format-selector"
import { Card, CardContent } from "@/components/ui/card"
import { detectPlatform, type DetectedUrl, type Platform } from "@/lib/platform-detect"
import type { VideoInfo, VideoFormat, VideoEncoding } from "@/lib/video.types"
import type { ClipRange } from "@/components/video-clip-selector"
import { AlertCircle, Download, Sparkles } from "lucide-react"

// State for different platform responses
interface YouTubeData {
  info: VideoInfo
  formats: VideoFormat[]
}

interface SocialMediaData {
  id: string
  title: string
  description: string
  duration: number
  thumbnail: string
  uploader: string
  uploaderUrl: string
  viewCount: number
  uploadDate: string
  url: string
}

type MediaData = 
  | { platform: "youtube"; data: YouTubeData }
  | { platform: "instagram" | "twitter" | "tiktok"; data: SocialMediaData }

export default function DownloadPage() {
  const [detectedUrl, setDetectedUrl] = useState<DetectedUrl | null>(null)
  const [mediaData, setMediaData] = useState<MediaData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingItag, setDownloadingItag] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMediaInfo = useCallback(async (detected: DetectedUrl) => {
    setIsLoading(true)
    setError(null)
    setDetectedUrl(detected)
    setMediaData(null)

    try {
      let response: Response
      
      switch (detected.platform) {
        case "youtube":
          response = await fetch(`/api/video/info?videoId=${detected.value}`)
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Failed to fetch video info")
          }
          const ytData = await response.json()
          setMediaData({ platform: "youtube", data: ytData })
          break
          
        case "instagram":
          response = await fetch(`/api/instagram/info?url=${encodeURIComponent(detected.value)}`)
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Failed to fetch video info")
          }
          const igData = await response.json()
          setMediaData({ platform: "instagram", data: igData })
          break
          
        case "twitter":
          response = await fetch(`/api/twitter/info?url=${encodeURIComponent(detected.value)}`)
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Failed to fetch video info")
          }
          const twData = await response.json()
          setMediaData({ platform: "twitter", data: twData })
          break
          
        case "tiktok":
          response = await fetch(`/api/tiktok/info?url=${encodeURIComponent(detected.value)}`)
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Failed to fetch video info")
          }
          const ttData = await response.json()
          setMediaData({ platform: "tiktok", data: ttData })
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // YouTube download handler
  const handleYouTubeDownload = useCallback(
    async (format: VideoFormat, encoding: VideoEncoding = "original", clipRange?: ClipRange | null) => {
      if (!detectedUrl || detectedUrl.platform !== "youtube") return

      setIsDownloading(true)
      setDownloadingItag(format.itag)
      setError(null)

      try {
        const isVideoOnly = format.hasVideo && !format.hasAudio
        const params = new URLSearchParams({
          videoId: detectedUrl.value,
          itag: format.itag.toString(),
        })
        if (isVideoOnly) {
          params.set("mergeAudio", "true")
        }
        if (format.hasVideo && encoding !== "original") {
          params.set("encode", encoding)
        }
        if (clipRange) {
          params.set("startTime", clipRange.startSeconds.toString())
          params.set("endTime", clipRange.endSeconds.toString())
        }
        
        const downloadUrl = `/api/video/download?${params.toString()}`
        const response = await fetch(downloadUrl)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Download failed")
        }

        const contentDisposition = response.headers.get("Content-Disposition")
        let filename = `video_${detectedUrl.value}.mp4`
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i)
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1])
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
        setDownloadingItag(null)
      }
    },
    [detectedUrl]
  )

  // Social media download handler (Instagram, Twitter, TikTok)
  const handleSocialDownload = useCallback(async () => {
    if (!detectedUrl) return

    setIsDownloading(true)
    setError(null)

    try {
      const apiPath = `/api/${detectedUrl.platform}/download?url=${encodeURIComponent(detectedUrl.value)}`
      const response = await fetch(apiPath)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Download failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${detectedUrl.platform}_video.mp4`
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
  }, [detectedUrl])

  // Convert media data to unified format for display
  const getUnifiedMedia = (): UnifiedMediaInfo | null => {
    if (!mediaData) return null

    if (mediaData.platform === "youtube") {
      const { info } = mediaData.data
      return {
        platform: "youtube",
        id: info.videoId,
        title: info.title,
        description: info.description,
        duration: info.lengthSeconds,
        thumbnail: info.thumbnail,
        channelName: info.channelName,
        channelUrl: info.channelUrl,
        viewCount: info.viewCount,
        uploadDate: info.publishDate,
      }
    }

    return {
      platform: mediaData.platform,
      id: mediaData.data.id,
      title: mediaData.data.title,
      description: mediaData.data.description,
      duration: mediaData.data.duration,
      thumbnail: mediaData.data.thumbnail,
      uploader: mediaData.data.uploader,
      uploaderUrl: mediaData.data.uploaderUrl,
      viewCount: mediaData.data.viewCount,
      uploadDate: mediaData.data.uploadDate,
    }
  }

  const unifiedMedia = getUnifiedMedia()
  const isYouTube = mediaData?.platform === "youtube"

  return (
    <div className="py-12 px-4 min-h-[calc(100vh-8rem)]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            All-in-One Downloader
          </div>
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
            Download Any Video
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Paste a URL from YouTube, Instagram, Twitter/X, or TikTok and download instantly
          </p>
        </div>

        {/* Input Section */}
        <Card className="border-2 border-dashed border-border/50 bg-surface/30 hover:border-primary/30 transition-colors">
          <CardContent className="py-8">
            <UnifiedUrlInput onSubmit={fetchMediaInfo} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-error/50 bg-error/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <p className="text-error text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Media Info */}
        {unifiedMedia && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UnifiedMediaCard
              media={unifiedMedia}
              onDownload={!isYouTube ? handleSocialDownload : undefined}
              isDownloading={!isYouTube && isDownloading}
              showDownloadButton={!isYouTube}
            />
          </div>
        )}

        {/* YouTube Format Selector */}
        {isYouTube && mediaData.data.formats.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <FormatSelector
              formats={mediaData.data.formats}
              onDownload={handleYouTubeDownload}
              isDownloading={isDownloading}
              downloadingItag={downloadingItag}
              durationSeconds={mediaData.data.info.lengthSeconds}
              videoId={mediaData.data.info.videoId}
            />
          </div>
        )}

        {/* Info Note */}
        {unifiedMedia && (
          <Card className="bg-surface/50 border-border/50 animate-in fade-in duration-500 delay-300">
            <CardContent className="py-4">
              <p className="text-sm text-text-secondary flex items-start gap-2">
                <Download className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  {isYouTube 
                    ? "All downloads are processed through the server. Video-only formats will automatically be merged with the best available audio track."
                    : "Click the download button to save the video to your device. The file will be processed and downloaded automatically."
                  }
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
