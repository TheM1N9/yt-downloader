import { Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface/50 py-8 px-4 mt-auto backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span>Media Grab</span>
          <span className="text-text-secondary font-normal">•</span>
          <span className="text-text-secondary font-normal">© {currentYear}</span>
        </div>
        
        <p className="text-xs text-text-secondary max-w-md leading-relaxed">
          For personal use only. Please respect copyright laws and the terms of service of the respective platforms.
          Only download content you have permission to use.
        </p>
      </div>
    </footer>
  )
}
