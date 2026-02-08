import { NextRequest, NextResponse } from "next/server"
import {
  createVideoStream,
  createMergedStream,
  createH264EncodedStream,
  getVideoInfo,
  getFormatInfo,
  VIDEO_ENCODINGS,
  type VideoEncoding,
} from "@/lib/video"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const itag = searchParams.get("itag")
  const quality = searchParams.get("quality") // e.g., "1080", "720", "480"
  const mergeAudio = searchParams.get("mergeAudio") === "true"
  const encodeParam = searchParams.get("encode") as VideoEncoding | null

  // Validate encoding option
  const encoding: VideoEncoding =
    encodeParam && VIDEO_ENCODINGS.includes(encodeParam) ? encodeParam : "original"

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  // Need either itag or quality
  if (!itag && !quality) {
    return NextResponse.json({ error: "Missing itag or quality" }, { status: 400 })
  }

  try {
    // Get video info for filename
    const videoInfo = await getVideoInfo(videoId)

    let stream
    let qualityLabel: string
    let formatInfo = null

    // Determine quality for stream creation
    let targetQuality: string | null = null

    if (quality) {
      targetQuality = quality
      qualityLabel = `${quality}p`
    } else {
      // Itag-based download
      const itagNum = parseInt(itag!, 10)
      if (isNaN(itagNum)) {
        return NextResponse.json({ error: "Invalid itag" }, { status: 400 })
      }

      formatInfo = await getFormatInfo(videoId, itagNum)
      qualityLabel = formatInfo?.qualityLabel || itagNum.toString()

      // Extract quality from format for H264 encoding
      if (formatInfo?.qualityLabel) {
        const heightMatch = formatInfo.qualityLabel.match(/(\d+)p/)
        targetQuality = heightMatch ? heightMatch[1] : null
      }
    }

    // Create appropriate stream based on encoding option
    if (encoding === "h264" && targetQuality) {
      // H.264 encoded stream (YouTube compatible)
      stream = createH264EncodedStream(videoId, targetQuality)
    } else if (quality) {
      // Quality-based download (auto merges video + audio)
      stream = createMergedStream(videoId, quality)
    } else {
      // Itag-based download
      const itagNum = parseInt(itag!, 10)

      // If video-only format and mergeAudio requested, use merged stream with quality
      const isVideoOnly = formatInfo?.hasVideo && !formatInfo?.hasAudio
      if (mergeAudio && isVideoOnly && targetQuality) {
        stream = createMergedStream(videoId, targetQuality)
      } else {
        stream = createVideoStream(videoId, itagNum)
      }
    }

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })

        stream.on("end", () => {
          controller.close()
        })

        stream.on("error", (error: Error) => {
          console.error("Stream error:", error)
          controller.error(error)
        })
      },
      cancel() {
        stream.destroy()
      },
    })

    // Create safe filename with encoding suffix
    const sanitizedTitle = videoInfo.title
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "_")
      .substring(0, 100)
    const encodingSuffix = encoding === "h264" ? "_h264" : ""
    const filename = `${sanitizedTitle}_${qualityLabel}${encodingSuffix}.mp4`

    // Build response headers
    const headers: HeadersInit = {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
    }

    return new Response(webStream, { headers })
  } catch (error) {
    console.error("Download error:", error)
    const message = error instanceof Error ? error.message : "Download failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300
