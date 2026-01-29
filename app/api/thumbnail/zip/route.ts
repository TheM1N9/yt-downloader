import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { THUMBNAIL_RESOLUTIONS, getThumbnailUrl } from "@/lib/youtube"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
  }

  const zip = new JSZip()

  const downloadPromises = THUMBNAIL_RESOLUTIONS.map(async (res) => {
    const url = getThumbnailUrl(videoId, res.key)
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("image")) return null
      
      const buffer = await response.arrayBuffer()
      return { name: `${res.key}.jpg`, buffer }
    } catch {
      return null
    }
  })

  const results = await Promise.all(downloadPromises)
  
  for (const result of results) {
    if (result) {
      zip.file(result.name, result.buffer)
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${videoId}_thumbnails.zip"`,
    },
  })
}
