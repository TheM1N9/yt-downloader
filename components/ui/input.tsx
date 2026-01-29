"use client"

import { cn } from "@/lib/utils"
import { forwardRef, type InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[6px] border bg-surface px-3 py-2 text-sm font-mono",
          "placeholder:text-text-secondary/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-error" : "border-border",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
