"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ThumbnailWithAvailability } from "@/lib/thumbnail"

interface ThumbnailGridProps {
  videoId: string
  thumbnails: ThumbnailWithAvailability[]
  onDownloadAll: () => void
  isDownloadingAll?: boolean
}

export function ThumbnailGrid({
  videoId,
  thumbnails,
  onDownloadAll,
  isDownloadingAll,
}: ThumbnailGridProps) {
  const availableThumbnails = thumbnails.filter((t) => t.available)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {availableThumbnails.length} of {thumbnails.length} resolutions available
        </p>
        {availableThumbnails.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadAll}
            isLoading={isDownloadingAll}
          >
            <DownloadIcon className="h-4 w-4 mr-1.5" />
            Download All (ZIP)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {thumbnails.map((thumb) => (
          <ThumbnailCard
            key={thumb.key}
            videoId={videoId}
            thumbnail={thumb}
          />
        ))}
      </div>
    </div>
  )
}

interface ThumbnailCardProps {
  videoId: string
  thumbnail: ThumbnailWithAvailability
}

function ThumbnailCard({ videoId, thumbnail }: ThumbnailCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(
        `/api/thumbnail?videoId=${videoId}&resolution=${thumbnail.key}`
      )
      if (!response.ok) throw new Error("Download failed")
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${videoId}_${thumbnail.key}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const isUnavailable = !thumbnail.available || imageError

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isUnavailable && "opacity-50"
      )}
    >
      <div className="aspect-video bg-background relative">
        {!isUnavailable ? (
          <img
            src={thumbnail.url}
            alt={`${thumbnail.name} thumbnail`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
            Not Available
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="font-medium text-text-primary">{thumbnail.name}</p>
          <p className="text-sm text-text-secondary font-mono">
            {thumbnail.width} × {thumbnail.height}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleDownload}
          disabled={isUnavailable}
          isLoading={isDownloading}
        >
          <DownloadIcon className="h-4 w-4 mr-1.5" />
          Download
        </Button>
      </div>
    </Card>
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
