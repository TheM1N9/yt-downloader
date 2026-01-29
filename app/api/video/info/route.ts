import { NextRequest, NextResponse } from "next/server"
import { getVideoInfo, getVideoFormats } from "@/lib/video"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  try {
    const [info, formats] = await Promise.all([
      getVideoInfo(videoId),
      getVideoFormats(videoId),
    ])

    return NextResponse.json({ info, formats })
  } catch (error) {
    console.error("Error fetching video info:", error)
    
    const message =
      error instanceof Error ? error.message : "Failed to fetch video info"
    
    // Handle common errors
    if (message.includes("Video unavailable")) {
      return NextResponse.json(
        { error: "This video is unavailable or private" },
        { status: 404 }
      )
    }
    
    if (message.includes("age-restricted")) {
      return NextResponse.json(
        { error: "This video is age-restricted and cannot be downloaded" },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
