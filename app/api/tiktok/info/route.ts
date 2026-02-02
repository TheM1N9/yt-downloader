import { NextRequest, NextResponse } from "next/server"
import { getTiktokVideoInfo } from "@/lib/tiktok"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const info = await getTiktokVideoInfo(url)
    return NextResponse.json(info)
  } catch (error) {
    console.error("TikTok info error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to fetch TikTok video info"
    if (message.includes("Private") || message.includes("Login") || message.includes("region")) {
      return NextResponse.json(
        { error: "This video is private, region-locked, or requires login" },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
