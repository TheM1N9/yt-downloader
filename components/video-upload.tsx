"use client"

import { useState, useCallback, useRef, type DragEvent } from "react"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/utils"
import { Upload, FileVideo, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Accepted video extensions for the file picker */
const ACCEPT_STRING = ".mp4,.webm,.mov,.avi,.mkv,.ogv,.3gp,.flv,.mpeg,.mpg,.ts,.m4v"

/** Max file size in bytes (500 MB) */
const MAX_SIZE = 500 * 1024 * 1024

interface VideoUploadProps {
  onFileSelected: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

export function VideoUpload({
  onFileSelected,
  isUploading = false,
  className,
}: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_SIZE) {
      return `File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_SIZE)}.`
    }

    const ext = file.name.toLowerCase().split(".").pop()
    const validExts = ACCEPT_STRING.replace(/\./g, "").split(",")
    if (ext && !validExts.includes(ext)) {
      return `Unsupported file type (.${ext}). Please upload a video file.`
    }

    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setSelectedFile(file)
      onFileSelected(file)
    },
    [onFileSelected, validateFile]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  const handleBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile && !isUploading ? handleBrowse : undefined}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all",
          !selectedFile && !isUploading && "cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : selectedFile
              ? "border-success/50 bg-success/5"
              : "border-border hover:border-primary/40 hover:bg-surface/50",
          isUploading && "pointer-events-none opacity-70"
        )}
      >
        {selectedFile ? (
          // File selected state
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <FileVideo className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          // Empty state
          <>
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                isDragOver ? "bg-primary/15" : "bg-surface border border-border"
              )}
            >
              <Upload
                className={cn(
                  "w-7 h-7 transition-colors",
                  isDragOver ? "text-primary" : "text-text-secondary"
                )}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-text-primary">
                {isDragOver ? "Drop your video here" : "Drag & drop a video file"}
              </p>
              <p className="text-xs text-text-secondary">
                or{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBrowse()
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-text-secondary/70 pt-1">
                MP4, WebM, MOV, AVI, MKV &bull; Max {formatBytes(MAX_SIZE)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-error px-1">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
