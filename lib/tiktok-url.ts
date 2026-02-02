/** Client-safe: URL validation and types only. No Node APIs. */

// tiktok.com/@user/video/ID, vm.tiktok.com/xxx, tiktok.com/t/xxx
const TIKTOK_FULL_VIDEO =
  /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@(?<user>[\w.]+)\/video\/(?<id>\d+)/i
const TIKTOK_SHORT = /(?:https?:\/\/)?(?:vm\.tiktok\.com|vt\.tiktok\.com)\/(?<code>[\w-]+)/i
const TIKTOK_T_LINK = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/(?<code>[\w-]+)/i

export function extractTiktokUrl(input: string): string | null {
  const trimmed = input.trim()
  let match = trimmed.match(TIKTOK_FULL_VIDEO)
  if (match?.groups?.user && match?.groups?.id) {
    return `https://www.tiktok.com/@${match.groups.user}/video/${match.groups.id}`
  }
  match = trimmed.match(TIKTOK_SHORT)
  if (match?.groups?.code) {
    return `https://vm.tiktok.com/${match.groups.code}`
  }
  match = trimmed.match(TIKTOK_T_LINK)
  if (match?.groups?.code) {
    return `https://www.tiktok.com/t/${match.groups.code}`
  }
  return null
}

export function isValidTiktokUrl(url: string): boolean {
  return extractTiktokUrl(url) !== null
}

export interface TiktokVideoInfo {
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
