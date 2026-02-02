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
    href: "/instagram",
    title: "Instagram Downloader",
    description: "Download Instagram Reels, posts, and IGTV videos. Paste a URL and get the video file.",
    icon: InstagramIcon,
  },
  {
    href: "/twitter",
    title: "Twitter / X Downloader",
    description: "Download videos from Twitter (X) posts. Paste a tweet URL and get the video file.",
    icon: TwitterIcon,
  },
  {
    href: "/tiktok",
    title: "TikTok Downloader",
    description: "Download TikTok videos. Paste a video URL or short link (vm.tiktok.com) to get the file.",
    icon: TiktokIcon,
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
            Media Grab
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Download videos and thumbnails from YouTube, Instagram, TikTok, Twitter, and more. Paste a URL and grab the file.
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
              { step: "1", title: "Paste URL", description: "Copy a video URL from YouTube, Instagram, TikTok, Twitter, or another supported site." },
              { step: "2", title: "Preview & choose", description: "See the video info and pick format or quality where available." },
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
