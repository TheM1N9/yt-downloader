"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CaptionEntry } from "@/lib/caption"
import { formatDuration } from "@/lib/utils"

interface CaptionPreviewProps {
  entries: CaptionEntry[]
  maxLines?: number
}

export function CaptionPreview({ entries, maxLines = 10 }: CaptionPreviewProps) {
  const previewEntries = entries.slice(0, maxLines)
  const hasMore = entries.length > maxLines

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Preview</span>
          <span className="text-sm font-normal text-text-secondary">
            {entries.length} entries
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-background rounded-[6px] border border-border p-4 max-h-[300px] overflow-y-auto font-mono text-sm">
          {previewEntries.map((entry, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <span className="text-text-secondary text-xs">
                [{formatTimestamp(entry.start)}]
              </span>
              <p className="text-text-primary mt-0.5">{entry.text}</p>
            </div>
          ))}
          {hasMore && (
            <p className="text-text-secondary text-center pt-2 border-t border-border mt-4">
              ... and {entries.length - maxLines} more entries
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
