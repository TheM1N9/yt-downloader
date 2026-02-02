import { NextRequest, NextResponse } from "next/server"
import { getTwitterVideoInfo } from "@/lib/twitter"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const info = await getTwitterVideoInfo(url)
    return NextResponse.json(info)
  } catch (error) {
    console.error("Twitter info error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to fetch Twitter video info"
    if (message.includes("Private") || message.includes("Login") || message.includes("protected")) {
      return NextResponse.json(
        { error: "This post is private, protected, or requires login" },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
