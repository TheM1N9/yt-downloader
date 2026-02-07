import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import "./globals.css"

const THEME_INIT_SCRIPT = `(function(){var k='theme';var t=localStorage.getItem(k)||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);})();`

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Media Grab - Download Videos from YouTube, Instagram, TikTok, Twitter",
  description: "Download videos and thumbnails from YouTube, Instagram, TikTok, Twitter (X), and more. Paste a URL and grab the file.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
