"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { extractVideoId } from "@/lib/youtube"

interface UrlInputProps {
  onSubmit: (value: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  /** When provided, used instead of YouTube extractVideoId (e.g. Instagram URL). */
  extractValue?: (input: string) => string | null
  invalidError?: string
}

export function UrlInput({
  onSubmit,
  isLoading,
  placeholder = "Paste YouTube URL or video ID...",
  className,
  extractValue,
  invalidError = "Invalid YouTube URL or video ID",
}: UrlInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(
    (input: string) => (extractValue ? extractValue(input) : extractVideoId(input)),
    [extractValue]
  )

  const handleSubmit = useCallback(() => {
    const value = resolve(url)
    if (!value) {
      setError(invalidError)
      return
    }
    setError(null)
    onSubmit(value)
  }, [url, onSubmit, resolve, invalidError])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      setError(null)
      const value = resolve(text)
      if (value) {
        onSubmit(value)
      }
    } catch {
      // Clipboard access denied
    }
  }, [onSubmit, resolve])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            error={!!error}
            disabled={isLoading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handlePaste}
          disabled={isLoading}
          className="shrink-0"
        >
          <ClipboardIcon className="h-4 w-4 mr-1.5" />
          Paste
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={isLoading}
          className="shrink-0"
        >
          {isLoading ? "Loading..." : "Go"}
        </Button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}
