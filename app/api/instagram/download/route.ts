import { NextRequest, NextResponse } from "next/server"
import { createInstagramDownloadStream, getInstagramVideoInfo } from "@/lib/instagram"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const info = await getInstagramVideoInfo(url)
    const stream = createInstagramDownloadStream(url)

    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        stream.on("end", () => controller.close())
        stream.on("error", (err: Error) => {
          console.error("Stream error:", err)
          controller.error(err)
        })
      },
      cancel() {
        stream.destroy()
      },
    })

    const safeTitle = info.title
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "_")
      .substring(0, 80)
    const filename = `${safeTitle || "instagram"}_${info.id}.mp4`

    const headers: HeadersInit = {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
    }

    return new Response(webStream, { headers })
  } catch (error) {
    console.error("Instagram download error:", error)
    const message =
      error instanceof Error ? error.message : "Download failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 120
