/** Platform detection and URL extraction utilities */

import { extractVideoId } from "./youtube"
import { extractInstagramUrl } from "./instagram-url"
import { extractTwitterUrl } from "./twitter-url"
import { extractTiktokUrl } from "./tiktok-url"

export const PLATFORMS = ["youtube", "instagram", "twitter", "tiktok"] as const
export type Platform = (typeof PLATFORMS)[number]

export interface PlatformInfo {
  id: Platform
  name: string
  color: string
  placeholder: string
  examples: string[]
}

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    placeholder: "youtube.com/watch?v=...",
    examples: ["youtube.com/watch?v=xxx", "youtu.be/xxx"],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    color: "#E4405F",
    placeholder: "instagram.com/reel/...",
    examples: ["instagram.com/reel/xxx", "instagram.com/p/xxx"],
  },
  twitter: {
    id: "twitter",
    name: "Twitter / X",
    color: "#000000",
    placeholder: "x.com/user/status/...",
    examples: ["x.com/user/status/xxx", "twitter.com/user/status/xxx"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    color: "#000000",
    placeholder: "tiktok.com/@user/video/...",
    examples: ["tiktok.com/@user/video/xxx", "vm.tiktok.com/xxx"],
  },
}

export interface DetectedUrl {
  platform: Platform
  url: string
  /** For YouTube, this is the video ID. For others, it's the normalized URL */
  value: string
}

/**
 * Detects the platform from a URL and extracts the normalized value
 */
export function detectPlatform(input: string): DetectedUrl | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try YouTube first
  const youtubeId = extractVideoId(trimmed)
  if (youtubeId) {
    return { platform: "youtube", url: trimmed, value: youtubeId }
  }

  // Try Instagram
  const instagramUrl = extractInstagramUrl(trimmed)
  if (instagramUrl) {
    return { platform: "instagram", url: instagramUrl, value: instagramUrl }
  }

  // Try Twitter
  const twitterUrl = extractTwitterUrl(trimmed)
  if (twitterUrl) {
    return { platform: "twitter", url: twitterUrl, value: twitterUrl }
  }

  // Try TikTok
  const tiktokUrl = extractTiktokUrl(trimmed)
  if (tiktokUrl) {
    return { platform: "tiktok", url: tiktokUrl, value: tiktokUrl }
  }

  return null
}

/**
 * Returns a user-friendly error message for invalid URLs
 */
export function getInvalidUrlMessage(): string {
  return "Please enter a valid URL from YouTube, Instagram, Twitter/X, or TikTok"
}
