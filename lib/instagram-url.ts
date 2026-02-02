/** Client-safe: URL validation and types only. No Node APIs. */

const INSTAGRAM_URL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/i,
  /(?:https?:\/\/)?(?:www\.)?instagr\.am\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/i,
]

export function extractInstagramUrl(input: string): string | null {
  const trimmed = input.trim()
  for (const pattern of INSTAGRAM_URL_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      const [, pathType, id] = match
      return `https://www.instagram.com/${pathType}/${id}/`
    }
  }
  return null
}

export function isValidInstagramUrl(url: string): boolean {
  return extractInstagramUrl(url) !== null
}

export interface InstagramVideoInfo {
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
