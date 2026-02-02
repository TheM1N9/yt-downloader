import { NextRequest, NextResponse } from "next/server"
import { getInstagramVideoInfo } from "@/lib/instagram"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const info = await getInstagramVideoInfo(url)
    return NextResponse.json(info)
  } catch (error) {
    console.error("Instagram info error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to fetch Instagram video info"
    if (message.includes("Private") || message.includes("Login")) {
      return NextResponse.json(
        { error: "This post is private or requires login" },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
