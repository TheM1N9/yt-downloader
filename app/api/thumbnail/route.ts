import { NextRequest, NextResponse } from "next/server"
import { extractVideoId, getThumbnailUrl, THUMBNAIL_RESOLUTIONS } from "@/lib/youtube"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const resolution = searchParams.get("resolution")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  const validResolutions = THUMBNAIL_RESOLUTIONS.map((r) => r.key)
  if (!resolution || !validResolutions.includes(resolution as typeof validResolutions[number])) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 })
  }

  const thumbnailUrl = getThumbnailUrl(videoId, resolution)

  try {
    const response = await fetch(thumbnailUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 })
    }

    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${videoId}_${resolution}.jpg"`,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 500 })
  }
}
