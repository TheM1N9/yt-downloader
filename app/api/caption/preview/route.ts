import { NextRequest, NextResponse } from "next/server"
import { fetchCaptionXml } from "@/lib/caption.server"
import { parseCaptionXml } from "@/lib/caption"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const xml = await fetchCaptionXml(url)
    const entries = parseCaptionXml(xml)
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Error fetching caption preview:", error)
    return NextResponse.json(
      { error: "Failed to fetch caption preview" },
      { status: 500 }
    )
  }
}
