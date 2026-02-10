"use client"

import { useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { extractVideoId } from "@/lib/youtube"
import { ArrowRight, ClipboardPaste, X } from "lucide-react"

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
  const inputRef = useRef<HTMLInputElement>(null)

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
      } else {
        // If pasted content is invalid, focus input so user can edit
        inputRef.current?.focus()
      }
    } catch {
      // Clipboard access denied, focus input
      inputRef.current?.focus()
    }
  }, [onSubmit, resolve])

  const handleClear = useCallback(() => {
    setUrl("")
    setError(null)
    inputRef.current?.focus()
  }, [])

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
        <div className="relative flex-1 group">
          <Input
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            error={!!error}
            disabled={isLoading}
            className="pr-10 transition-shadow group-focus-within:shadow-sm"
          />
          {url && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface/50 transition-colors"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {!url ? (
          <Button
            type="button"
            variant="outline"
            onClick={handlePaste}
            disabled={isLoading}
            className="shrink-0 gap-2"
          >
            <ClipboardPaste className="h-4 w-4" />
            <span className="hidden sm:inline">Paste</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isLoading}
            className="shrink-0 gap-2 min-w-[80px]"
          >
            {!isLoading && <ArrowRight className="h-4 w-4" />}
            {isLoading ? "Loading..." : "Go"}
          </Button>
        )}
      </div>
      
      {/* Animated Error Message */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          error ? "max-h-10 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        )}
      >
        <p className="text-sm text-error flex items-center gap-1.5 px-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-error" />
          {error}
        </p>
      </div>
    </div>
  )
}
