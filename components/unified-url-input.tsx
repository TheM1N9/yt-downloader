"use client"

import { useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { detectPlatform, getInvalidUrlMessage, PLATFORM_INFO, type DetectedUrl } from "@/lib/platform-detect"
import { 
  ArrowRight, 
  ClipboardPaste, 
  X, 
  Loader2,
  Youtube,
  Instagram,
  Twitter
} from "lucide-react"

interface UnifiedUrlInputProps {
  onSubmit: (detected: DetectedUrl) => void
  isLoading?: boolean
  className?: string
}

export function UnifiedUrlInput({
  onSubmit,
  isLoading,
  className,
}: UnifiedUrlInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const detected = detectPlatform(url)
    if (!detected) {
      setError(getInvalidUrlMessage())
      return
    }
    setError(null)
    onSubmit(detected)
  }, [url, onSubmit])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      setError(null)
      const detected = detectPlatform(text)
      if (detected) {
        onSubmit(detected)
      } else {
        inputRef.current?.focus()
      }
    } catch {
      inputRef.current?.focus()
    }
  }, [onSubmit])

  const handleClear = useCallback(() => {
    setUrl("")
    setError(null)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Detect platform as user types for visual feedback
  const detected = url ? detectPlatform(url) : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Input
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste any video URL..."
            error={!!error}
            disabled={isLoading}
            className={cn(
              "h-14 text-base pl-5 pr-12 transition-all",
              detected && "border-primary/50"
            )}
          />
          
          {/* Platform indicator */}
          {detected && !isLoading && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <PlatformBadge platform={detected.platform} />
            </div>
          )}
          
          {/* Clear button */}
          {url && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-surface/50 transition-colors"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          )}
        </div>
        
        {!url ? (
          <Button
            type="button"
            variant="outline"
            onClick={handlePaste}
            disabled={isLoading}
            className="h-14 px-6 gap-2 shrink-0"
          >
            <ClipboardPaste className="h-5 w-5" />
            <span>Paste URL</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isLoading}
            className="h-14 px-8 gap-2 shrink-0 min-w-[140px]"
          >
            {!isLoading && <ArrowRight className="h-5 w-5" />}
            {isLoading ? "Loading..." : "Download"}
          </Button>
        )}
      </div>
      
      {/* Error Message */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          error ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-sm text-error flex items-center gap-2 px-1 py-2 bg-error/5 rounded-lg border border-error/20">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-error shrink-0" />
          {error}
        </p>
      </div>
      
      {/* Supported Platforms */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-secondary pt-2">
        <span>Supports:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-red-500" />
            YouTube
          </span>
          <span className="flex items-center gap-1.5">
            <Instagram className="w-4 h-4 text-pink-500" />
            Instagram
          </span>
          <span className="flex items-center gap-1.5">
            <Twitter className="w-4 h-4" />
            Twitter/X
          </span>
          <span className="flex items-center gap-1.5">
            <TiktokIcon className="w-4 h-4" />
            TikTok
          </span>
        </div>
      </div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    youtube: "bg-red-500 text-white",
    instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    twitter: "bg-black text-white dark:bg-white dark:text-black",
    tiktok: "bg-black text-white dark:bg-white dark:text-black",
  }
  
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
      colors[platform]
    )}>
      {platform === "twitter" ? "X" : platform}
    </span>
  )
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}
