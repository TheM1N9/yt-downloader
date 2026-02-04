import { NextResponse } from "next/server"
import { getCacheStats } from "@/lib/yt-dlp"

export async function GET() {
  const stats = getCacheStats()

  return NextResponse.json({
    cache: stats,
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  })
}
