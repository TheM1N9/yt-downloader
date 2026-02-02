/** Client-safe: URL validation and types only. No Node APIs. */

// twitter.com/username/status/ID or x.com/username/status/ID or x.com/i/status/ID
const TWITTER_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:(?<user>\w+)\/status\/|i\/status\/)(?<id>\d+)/i

export function extractTwitterUrl(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(TWITTER_URL_REGEX)
  if (!match || !match.groups?.id) return null
  const username = match.groups.user ?? "i"
  const statusId = match.groups.id
  return `https://x.com/${username}/status/${statusId}`
}

export function isValidTwitterUrl(url: string): boolean {
  return extractTwitterUrl(url) !== null
}

export interface TwitterVideoInfo {
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
