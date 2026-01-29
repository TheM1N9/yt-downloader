import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FEATURES = [
  {
    href: "/thumbnail",
    title: "Thumbnail Downloader",
    description: "Download YouTube video thumbnails in all available resolutions. Get maxres, HD, SD, and more.",
    icon: ImageIcon,
  },
  {
    href: "/video",
    title: "Video Downloader",
    description: "Download YouTube videos in various qualities. Supports 360p to 4K, plus audio-only formats.",
    icon: VideoIcon,
  },
  {
    href: "/caption",
    title: "Caption Downloader",
    description: "Extract captions and subtitles from YouTube videos. Export as SRT, VTT, or plain text.",
    icon: CaptionIcon,
  },
] as const

export default function HomePage() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            YouTube Downloader
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            A clean, professional tool for downloading thumbnails, videos, and captions from YouTube.
          </p>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <Link key={feature.href} href={feature.href} className="block group">
              <Card className="h-full hover:shadow-[var(--shadow-md)] hover:border-primary/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Get Started
                    <ArrowIcon className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text-primary text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Paste URL", description: "Copy any YouTube video URL and paste it into the input field." },
              { step: "2", title: "Choose Format", description: "Select the format and quality that suits your needs." },
              { step: "3", title: "Download", description: "Click download and save the file directly to your device." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}

function CaptionIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />
      <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
