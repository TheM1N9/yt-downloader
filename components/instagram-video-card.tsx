"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDuration, formatNumber } from "@/lib/utils"
import type { InstagramVideoInfo } from "@/lib/instagram-url"

interface InstagramVideoCardProps {
  video: InstagramVideoInfo
  onDownload: () => void
  isDownloading?: boolean
}

export function InstagramVideoCard({
  video,
  onDownload,
  isDownloading = false,
}: InstagramVideoCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="relative shrink-0 w-full sm:w-64">
          <div className="aspect-[9/16] sm:aspect-video rounded-[6px] overflow-hidden bg-background">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
          {video.duration > 0 && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary text-lg leading-tight line-clamp-2">
              {video.title}
            </h2>
            {video.uploader && (
              <a
                href={video.uploaderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-secondary hover:text-primary inline-block"
              >
                @{video.uploader}
              </a>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
              {video.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <ViewIcon className="w-4 h-4" />
                  {formatNumber(video.viewCount)} views
                </span>
              )}
              {video.uploadDate && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {video.uploadDate}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            isLoading={isDownloading}
            className="w-full sm:w-auto"
          >
            Download video
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ViewIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
