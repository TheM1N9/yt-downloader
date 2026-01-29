import { NextRequest, NextResponse } from "next/server"
import { THUMBNAIL_RESOLUTIONS, getThumbnailUrl } from "@/lib/youtube"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  const thumbnails = await Promise.all(
    THUMBNAIL_RESOLUTIONS.map(async (res) => {
      const url = getThumbnailUrl(videoId, res.key)
      try {
        const response = await fetch(url, { method: "HEAD" })
        const contentType = response.headers.get("content-type")
        const available = response.ok && contentType?.includes("image")
        return {
          ...res,
          url,
          available,
        }
      } catch {
        return {
          ...res,
          url,
          available: false,
        }
      }
    })
  )

  return NextResponse.json({ videoId, thumbnails })
}
