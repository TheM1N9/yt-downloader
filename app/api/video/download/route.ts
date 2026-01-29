import { NextRequest, NextResponse } from "next/server"
import { getDirectDownloadUrl, createVideoStream } from "@/lib/video"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const itag = searchParams.get("itag")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  if (!itag) {
    return NextResponse.json({ error: "Missing itag" }, { status: 400 })
  }

  const itagNum = parseInt(itag, 10)
  if (isNaN(itagNum)) {
    return NextResponse.json({ error: "Invalid itag" }, { status: 400 })
  }

  try {
    // First try to get direct URL
    const directUrl = await getDirectDownloadUrl(videoId, itagNum)
    
    if (directUrl) {
      // Redirect to direct URL for faster download
      return NextResponse.redirect(directUrl)
    }

    // Fallback to streaming through server
    const stream = createVideoStream(videoId, itagNum)
    const chunks: Buffer[] = []

    return new Promise<NextResponse>((resolve) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      stream.on("end", () => {
        const buffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(buffer, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": buffer.length.toString(),
            },
          })
        )
      })

      stream.on("error", (error: Error) => {
        console.error("Stream error:", error)
        resolve(
          NextResponse.json(
            { error: "Download failed. This video may be restricted." },
            { status: 500 }
          )
        )
      })
    })
  } catch (error) {
    console.error("Download error:", error)
    const message = error instanceof Error ? error.message : "Download failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300
