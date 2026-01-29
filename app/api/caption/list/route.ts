import { NextRequest, NextResponse } from "next/server"
import { getCaptionTracks } from "@/lib/caption.server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  try {
    const tracks = await getCaptionTracks(videoId)
    return NextResponse.json({ videoId, tracks })
  } catch (error) {
    console.error("Error fetching caption tracks:", error)
    
    const message =
      error instanceof Error ? error.message : "Failed to fetch captions"

    if (message.includes("Video unavailable")) {
      return NextResponse.json(
        { error: "This video is unavailable or private" },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
