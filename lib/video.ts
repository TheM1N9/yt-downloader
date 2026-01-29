import ytdl from "@distube/ytdl-core"

// Create agent with proper headers to avoid 403 errors
const agent = ytdl.createAgent(undefined, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  },
})

export interface VideoInfo {
  id: string
  title: string
  description: string
  lengthSeconds: number
  viewCount: number
  channelName: string
  channelUrl: string
  thumbnail: string
  publishDate: string
}

export interface VideoFormat {
  itag: number
  qualityLabel: string
  container: string
  hasVideo: boolean
  hasAudio: boolean
  contentLength?: string
  bitrate?: number
  audioBitrate?: number
  mimeType?: string
  url?: string
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })
  const details = info.videoDetails

  return {
    id: details.videoId,
    title: details.title,
    description: details.description || "",
    lengthSeconds: parseInt(details.lengthSeconds),
    viewCount: parseInt(details.viewCount),
    channelName: details.author.name,
    channelUrl: details.author.channel_url,
    thumbnail: details.thumbnails[details.thumbnails.length - 1]?.url || "",
    publishDate: details.publishDate || "",
  }
}

export async function getVideoFormats(videoId: string): Promise<VideoFormat[]> {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })
  
  // Only return formats that have a direct URL (don't need signature deciphering)
  return info.formats
    .filter((f) => (f.qualityLabel || f.audioBitrate) && f.url)
    .map((f) => ({
      itag: f.itag,
      qualityLabel: f.qualityLabel || `${f.audioBitrate}kbps`,
      container: f.container,
      hasVideo: f.hasVideo,
      hasAudio: f.hasAudio,
      contentLength: f.contentLength,
      bitrate: f.bitrate,
      audioBitrate: f.audioBitrate,
      mimeType: f.mimeType,
      url: f.url,
    }))
    .sort((a, b) => {
      // Sort by quality (higher first)
      const aQuality = parseInt(a.qualityLabel) || 0
      const bQuality = parseInt(b.qualityLabel) || 0
      return bQuality - aQuality
    })
}

// Format presets for UI
export const VIDEO_QUALITY_PRESETS = [
  { label: "1080p", itag: 137, hasAudio: false },
  { label: "720p", itag: 136, hasAudio: false },
  { label: "720p", itag: 22, hasAudio: true },
  { label: "480p", itag: 135, hasAudio: false },
  { label: "360p", itag: 18, hasAudio: true },
  { label: "360p", itag: 134, hasAudio: false },
] as const

export const AUDIO_QUALITY_PRESETS = [
  { label: "256kbps", itag: 141 },
  { label: "128kbps", itag: 140 },
  { label: "128kbps", itag: 251 },
  { label: "64kbps", itag: 250 },
] as const

export function createVideoStream(videoId: string, itag: number) {
  return ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
    quality: itag,
    highWaterMark: 1024 * 1024 * 16, // 16MB buffer
    agent,
  })
}

// Get direct download URL for a format (for client-side download)
export async function getDirectDownloadUrl(videoId: string, itag: number): Promise<string | null> {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, { agent })
  const format = info.formats.find((f) => f.itag === itag)
  return format?.url || null
}
