"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CaptionEntry } from "@/lib/caption"

type YTPlayer = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  playVideo: () => void
  getCurrentTime: () => number
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        config: { videoId: string; width?: number; height?: number; playerVars?: Record<string, number | string> }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

const YT_SCRIPT_URL = "https://www.youtube.com/iframe_api"
const SYNC_INTERVAL_MS = 250

interface CaptionWithVideoProps {
  videoId: string
  entries: CaptionEntry[]
}

function findActiveIndex(entries: CaptionEntry[], currentTime: number): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (currentTime >= entries[i].start) return i
  }
  return 0
}

export function CaptionWithVideo({ videoId, entries }: CaptionWithVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const entryRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [apiReady, setApiReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const setReadyRef = useRef<(v: boolean) => void>(() => {})

  // Load YouTube IFrame API: set callback first, then inject script so onYouTubeIframeAPIReady runs
  useEffect(() => {
    setReadyRef.current = setApiReady
    if (typeof window === "undefined") return

    if (window.YT?.Player) {
      setApiReady(true)
      return
    }

    window.onYouTubeIframeAPIReady = () => {
      setReadyRef.current(true)
    }

    const existing = document.querySelector(`script[src="${YT_SCRIPT_URL}"]`)
    if (existing) return

    const script = document.createElement("script")
    script.src = YT_SCRIPT_URL
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      delete window.onYouTubeIframeAPIReady
    }
  }, [])

  const createPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player || playerRef.current) return
    playerRef.current = new window.YT!.Player(containerRef.current, {
      videoId,
      width: 640,
      height: 360,
      playerVars: { enablejsapi: 1 },
    })
  }, [videoId])

  useEffect(() => {
    if (!apiReady || !window.YT) return
    createPlayer()
    return () => {
      playerRef.current = null
    }
  }, [apiReady, createPlayer])

  // Sync active caption with video time and smooth-scroll transcript
  useEffect(() => {
    if (entries.length === 0) return
    const interval = setInterval(() => {
      const player = playerRef.current
      if (!player?.getCurrentTime) return
      const currentTime = player.getCurrentTime()
      const index = findActiveIndex(entries, currentTime)
      setActiveIndex((prev) => {
        if (prev === index) return prev
        const el = entryRefs.current[index]
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
        return index
      })
    }, SYNC_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [entries, apiReady])

  const handleEntryClick = useCallback((entry: CaptionEntry, index: number) => {
    const player = playerRef.current
    if (player?.seekTo) {
      player.seekTo(entry.start)
      player.playVideo()
      setActiveIndex(index)
      entryRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Watch with transcript</CardTitle>
        <p className="text-sm font-normal text-text-secondary">
          Click any phrase to jump to that moment. Captions scroll with the video.
        </p>
      </CardHeader>
      <CardContent>
        {/* Video and captions side-by-side */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Video */}
          <div className="relative shrink-0 rounded-[8px] overflow-hidden bg-background border border-border lg:min-w-0 lg:max-w-[560px]">
            <div ref={containerRef} className="w-full aspect-video min-h-[200px]" />
            {!apiReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background text-text-secondary text-sm">
                Loading player...
              </div>
            )}
          </div>

          {/* Captions (no timestamps, scrolls with video) */}
          <div className="flex-1 min-h-0 flex flex-col rounded-[6px] border border-border bg-surface/50">
            <div className="p-3 overflow-y-auto flex-1 max-h-[320px] lg:max-h-[315px]">
              {entries.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-8">
                  Loading transcript...
                </p>
              ) : (
                <div className="space-y-0.5">
                  {entries.map((entry, index) => (
                    <button
                      key={index}
                      type="button"
                      ref={(el) => {
                        entryRefs.current[index] = el
                      }}
                      onClick={() => handleEntryClick(entry, index)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-[6px] text-sm transition-colors",
                        "hover:bg-primary/10 hover:text-primary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                        activeIndex === index && "bg-primary/15 text-primary"
                      )}
                    >
                      <span className="text-text-primary">{entry.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
