"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDuration, formatNumber } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Platform } from "@/lib/platform-detect"
import { 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Clock, 
  ExternalLink,
  Youtube,
  Instagram,
  Twitter
} from "lucide-react"

// Unified video info interface that works across all platforms
export interface UnifiedMediaInfo {
  platform: Platform
  id: string
  title: string
  description?: string
  duration: number
  thumbnail: string
  uploader?: string
  uploaderUrl?: string
  viewCount?: number
  uploadDate?: string
  channelName?: string
  channelUrl?: string
}

interface UnifiedMediaCardProps {
  media: UnifiedMediaInfo
  onDownload?: () => void
  isDownloading?: boolean
  showDownloadButton?: boolean
  children?: React.ReactNode
}

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  tiktok: TiktokIcon,
}

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "bg-red-500",
  instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
  twitter: "bg-black dark:bg-white dark:text-black",
  tiktok: "bg-black dark:bg-white dark:text-black",
}

export function UnifiedMediaCard({
  media,
  onDownload,
  isDownloading = false,
  showDownloadButton = true,
  children,
}: UnifiedMediaCardProps) {
  const PlatformIcon = PLATFORM_ICONS[media.platform]
  const uploaderName = media.uploader || media.channelName
  const uploaderLink = media.uploaderUrl || media.channelUrl

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full md:w-80">
          <div 
            className={cn(
              "rounded-lg overflow-hidden bg-background shadow-sm border border-border/50",
              media.platform === "tiktok" || media.platform === "instagram" 
                ? "aspect-[9/16] md:aspect-video" 
                : "aspect-video"
            )}
          >
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          
          {/* Duration badge */}
          {media.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDuration(media.duration)}
            </div>
          )}
          
          {/* Platform badge */}
          <div className={cn(
            "absolute top-2 left-2 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5",
            PLATFORM_COLORS[media.platform]
          )}>
            <PlatformIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{media.platform === "twitter" ? "X" : media.platform}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h2 className="font-bold text-text-primary text-xl leading-snug line-clamp-2">
              {media.title}
            </h2>
            
            {uploaderName && (
              <a
                href={uploaderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors group/channel"
              >
                <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                {media.platform === "youtube" ? uploaderName : `@${uploaderName}`}
                <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover/channel:opacity-100 group-hover/channel:translate-x-0 transition-all" />
              </a>
            )}
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              {media.viewCount !== undefined && media.viewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-text-secondary/70" />
                  {formatNumber(media.viewCount)} views
                </span>
              )}
              {media.uploadDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-text-secondary/70" />
                  {media.uploadDate}
                </span>
              )}
            </div>

            {media.description && (
              <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed opacity-90">
                {media.description}
              </p>
            )}
          </div>

          {/* Download button for simple platforms */}
          {showDownloadButton && onDownload && (
            <Button
              onClick={onDownload}
              disabled={isDownloading}
              isLoading={isDownloading}
              className="w-full md:w-auto gap-2"
            >
              <Download className="w-4 h-4" />
              Download Video
            </Button>
          )}
          
          {/* Custom children (for YouTube format selector, etc.) */}
          {children}
        </div>
      </div>
    </Card>
  )
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}
