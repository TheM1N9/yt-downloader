"use client"

import { Card } from "@/components/ui/card"
import { formatDuration, formatNumber } from "@/lib/utils"
import type { VideoInfo } from "@/lib/video.types"

interface VideoInfoCardProps {
  video: VideoInfo
}

export function VideoInfoCard({ video }: VideoInfoCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full sm:w-64">
          <div className="aspect-video rounded-[6px] overflow-hidden bg-background">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded">
            {formatDuration(video.lengthSeconds)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <h2 className="font-semibold text-text-primary text-lg leading-tight line-clamp-2">
            {video.title}
          </h2>
          
          <a
            href={video.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-primary inline-block"
          >
            {video.channelName}
          </a>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <ViewIcon className="w-4 h-4" />
              {formatNumber(video.viewCount)} views
            </span>
            {video.publishDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {video.publishDate}
              </span>
            )}
          </div>

          {video.description && (
            <p className="text-sm text-text-secondary line-clamp-2 mt-2">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function ViewIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
