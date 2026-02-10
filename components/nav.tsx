"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeSelector } from "@/components/theme-selector"
import { Download, Menu, X, Image, FileText, Upload } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/download", label: "Download", icon: Download },
  { href: "/thumbnail", label: "Thumbnails", icon: Image },
  { href: "/caption", label: "Captions", icon: FileText },
  { href: "/upload-caption", label: "Upload", icon: Upload },
] as const

export function Nav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group z-50">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-text-primary tracking-tight group-hover:text-primary transition-colors">
            Media Grab
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = 'icon' in item ? item.icon : null
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="w-px h-6 bg-border mx-2" />
          <ThemeSelector />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSelector />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="z-50"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 md:hidden animate-in fade-in slide-in-from-top-5 duration-200 flex flex-col pt-24 px-6 pb-6">
            <ul className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                const Icon = 'icon' in item ? item.icon : null
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl text-lg font-medium transition-all border border-transparent",
                        isActive
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface border-border/50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {Icon && <Icon className="w-5 h-5" />}
                        {item.label}
                      </span>
                      {isActive && <Download className="w-4 h-4" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>
    </header>
  )
}
