import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download,
  Image as ImageIcon, 
  FileText as CaptionIcon,
  Upload as UploadIcon,
  ArrowRight,
  Youtube,
  Instagram,
  Twitter,
  Sparkles,
  Zap,
  Shield
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero */}
        <section className="text-center space-y-8 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="w-4 h-4" />
            Free & Fast Downloads
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Media Grab
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            Download videos from YouTube, Instagram, TikTok, and Twitter in seconds.
          </p>

          {/* Supported Platforms */}
          <div className="flex items-center justify-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex items-center gap-2 text-text-secondary">
              <Youtube className="w-6 h-6 text-red-500" />
              <span className="text-sm font-medium">YouTube</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Instagram className="w-6 h-6 text-pink-500" />
              <span className="text-sm font-medium">Instagram</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Twitter className="w-6 h-6" />
              <span className="text-sm font-medium">Twitter/X</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <TiktokIcon className="w-6 h-6" />
              <span className="text-sm font-medium">TikTok</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <Link 
              href="/download"
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-hover transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/25"
            >
              <Download className="w-6 h-6" />
              Start Downloading
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Zap}
            title="Lightning Fast"
            description="Paste any URL and get your download in seconds. No waiting, no hassle."
          />
          <FeatureCard
            icon={Shield}
            title="Safe & Private"
            description="No data stored. Your downloads are processed securely and privately."
          />
          <FeatureCard
            icon={Sparkles}
            title="Multiple Formats"
            description="Choose from various quality options. Download video or audio only."
          />
        </section>

        {/* Tools Section */}
        <section className="space-y-8 py-8 border-t border-border/50">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-text-primary">
              More Tools
            </h2>
            <p className="text-text-secondary">Additional utilities for your media needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/thumbnail" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ImageIcon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                      Thumbnail Downloader
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Download YouTube thumbnails in all available resolutions. Get maxres, HD, SD, and more.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary pt-2 group-hover:gap-2 transition-all">
                      Open Tool <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/caption" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CaptionIcon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                      Caption Downloader
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Extract captions and subtitles from YouTube videos. Export as SRT, VTT, or plain text.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary pt-2 group-hover:gap-2 transition-all">
                      Open Tool <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/upload-caption" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <UploadIcon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                      Upload Video Captions
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Upload any video file to extract captions via embedded subtitles or speech-to-text. Files auto-delete after 1 hour.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary pt-2 group-hover:gap-2 transition-all">
                      Open Tool <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-10 py-8 border-t border-border/50">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-text-primary">
              How It Works
            </h2>
            <p className="text-text-secondary">Simple, fast, and free downloads in 3 steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Paste URL", description: "Copy a video URL from YouTube, Instagram, TikTok, Twitter, or any supported site." },
              { step: "2", title: "Preview", description: "See the video info and pick format or quality where available." },
              { step: "3", title: "Download", description: "Click download and save the file directly to your device." },
            ].map((item) => (
              <div key={item.step} className="relative p-6 rounded-2xl bg-surface border border-border/50 text-center hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string 
}) {
  return (
    <Card className="text-center p-6 hover:shadow-md transition-shadow">
      <CardContent className="p-0 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-bold text-lg text-text-primary">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}
