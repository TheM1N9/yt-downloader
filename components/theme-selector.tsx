"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  type Theme,
  THEMES,
} from "@/lib/theme"

const CYCLE_ORDER: Theme[] = ["system", "light", "dark"]

function nextTheme(current: Theme): Theme {
  const i = CYCLE_ORDER.indexOf(current)
  return CYCLE_ORDER[(i + 1) % CYCLE_ORDER.length]
}

const THEME_TITLE: Record<Theme, string> = {
  system: "System (click to change)",
  light: "Light (click to change)",
  dark: "Dark (click to change)",
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(getStoredTheme())
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted || theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme, mounted])

  const handleClick = useCallback(() => {
    setTheme((prev) => nextTheme(prev))
  }, [])

  if (!mounted) {
    return (
      <div
        className="h-8 w-8 rounded-[6px] border border-border bg-surface animate-pulse"
        aria-hidden
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={THEME_TITLE[theme]}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-border bg-surface/80 text-text-secondary shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary/30 hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-95"
    >
      {theme === "system" ? (
        <SystemIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      ) : theme === "light" ? (
        <SunIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      ) : (
        <MoonIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      )}
    </button>
  )
}

function SystemIcon({ className }: { className?: string }) {
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
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
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
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}
