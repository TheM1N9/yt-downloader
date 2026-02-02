"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeSelector } from "@/components/theme-selector"

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/video", label: "Video" },
  { href: "/thumbnail", label: "Thumbnails" },
  { href: "/caption", label: "Captions" },
  { href: "/instagram", label: "Instagram" },
  { href: "/twitter", label: "Twitter" },
  { href: "/tiktok", label: "TikTok" },
] as const

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-sm">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[6px] bg-primary flex items-center justify-center">
            <LogoIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-text-primary group-hover:text-primary">
            Media Grab
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-background"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <ThemeSelector />
        </div>
      </nav>
    </header>
  )
}

function LogoIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
