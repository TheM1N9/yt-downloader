import { NextRequest, NextResponse } from "next/server"
import { getCaptionContentViaYtDlp } from "@/lib/caption.server"
import {
  parseVtt,
  convertCaptions,
  CAPTION_FORMATS,
  type CaptionFormat,
} from "@/lib/caption"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const lang = searchParams.get("lang")
  const format = searchParams.get("format") as CaptionFormat

  if (!videoId || !lang) {
    return NextResponse.json(
      { error: "Missing videoId or lang" },
      { status: 400 }
    )
  }

  if (!format || !CAPTION_FORMATS.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  }

  try {
    const vtt = await getCaptionContentViaYtDlp(videoId, lang)
    const entries = parseVtt(vtt)
    const content = convertCaptions(entries, format)

    const mimeTypes: Record<CaptionFormat, string> = {
      srt: "application/x-subrip",
      vtt: "text/vtt",
      txt: "text/plain",
    }

    const filename = `${videoId}_${lang}.${format}`

    return new NextResponse(content, {
      headers: {
        "Content-Type": `${mimeTypes[format]}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading captions:", error)
    return NextResponse.json(
      { error: "Failed to download captions" },
      { status: 500 }
    )
  }
}
