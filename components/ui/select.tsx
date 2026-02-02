"use client"

import { cn } from "@/lib/utils"
import { forwardRef, type SelectHTMLAttributes } from "react"

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[6px] border bg-surface pl-3 pr-8 py-2 text-sm font-mono",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "border-border appearance-none bg-no-repeat",
          "bg-[length:1rem_1rem] bg-[right_0.5rem_center]",
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        }}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = "Select"
