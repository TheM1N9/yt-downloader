import { getAllThumbnailUrls, type ThumbnailResolution } from "./youtube"

export type ThumbnailWithAvailability = ThumbnailResolution & {
  url: string
  available: boolean
}

export async function checkThumbnailAvailability(
  videoId: string
): Promise<ThumbnailWithAvailability[]> {
  const thumbnails = getAllThumbnailUrls(videoId)
  
  const results = await Promise.all(
    thumbnails.map(async (thumb) => {
      try {
        const res = await fetch(thumb.url, { method: "HEAD" })
        const contentType = res.headers.get("content-type")
        return {
          ...thumb,
          available: res.ok && contentType !== null && contentType.includes("image"),
        }
      } catch {
        return { ...thumb, available: false }
      }
    })
  )
  
  return results
}

export async function fetchThumbnailAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch thumbnail: ${res.status}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
