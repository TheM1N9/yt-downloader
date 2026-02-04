import { NextRequest, NextResponse } from "next/server"
import { getCaptionContentViaYtDlp } from "@/lib/caption.server"
import { parseVtt } from "@/lib/caption"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const lang = searchParams.get("lang")

  if (!videoId || !lang) {
    return NextResponse.json(
      { error: "Missing videoId or lang" },
      { status: 400 }
    )
  }

  try {
    const vtt = await getCaptionContentViaYtDlp(videoId, lang)
    const entries = parseVtt(vtt)
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Error fetching caption preview:", error)
    return NextResponse.json(
      { error: "Failed to fetch caption preview" },
      { status: 500 }
    )
  }
}
