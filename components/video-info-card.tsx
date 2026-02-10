"use client"

import { Card } from "@/components/ui/card"
import { formatDuration, formatNumber } from "@/lib/utils"
import type { VideoInfo } from "@/lib/video.types"
import { Calendar, Eye, ExternalLink, User, Clock } from "lucide-react"

interface VideoInfoCardProps {
  video: VideoInfo
}

export function VideoInfoCard({ video }: VideoInfoCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-5 p-5">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full sm:w-72">
          <div className="aspect-video rounded-md overflow-hidden bg-background shadow-sm border border-border/50">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-sm flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {formatDuration(video.lengthSeconds)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h2 className="font-bold text-text-primary text-xl leading-snug line-clamp-2">
              {video.title}
            </h2>
            
            <a
              href={video.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors group/channel"
            >
              <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              {video.channelName}
              <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover/channel:opacity-100 group-hover/channel:translate-x-0 transition-all" />
            </a>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-text-secondary/70" />
                {formatNumber(video.viewCount)} views
              </span>
              {video.publishDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-text-secondary/70" />
                  {video.publishDate}
                </span>
              )}
            </div>

            {video.description && (
              <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed opacity-90">
                {video.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
