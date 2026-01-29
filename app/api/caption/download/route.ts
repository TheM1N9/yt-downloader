import { NextRequest, NextResponse } from "next/server"
import { fetchCaptionXml } from "@/lib/caption.server"
import {
  parseCaptionXml,
  convertCaptions,
  CAPTION_FORMATS,
  type CaptionFormat,
} from "@/lib/caption"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")
  const format = searchParams.get("format") as CaptionFormat
  const videoId = searchParams.get("videoId")
  const lang = searchParams.get("lang")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  if (!format || !CAPTION_FORMATS.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  }

  try {
    const xml = await fetchCaptionXml(url)
    const entries = parseCaptionXml(xml)
    const content = convertCaptions(entries, format)

    const mimeTypes: Record<CaptionFormat, string> = {
      srt: "application/x-subrip",
      vtt: "text/vtt",
      txt: "text/plain",
    }

    const filename = `${videoId || "captions"}_${lang || "en"}.${format}`

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
