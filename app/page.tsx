"use client"

import { useEffect, useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [svgContent, setSvgContent] = useState<string>("")
  const [mounted] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch("/map-dark.svg")
        let svgText = await response.text()
        // Replace teal dots (#0C9784) with red (#ef4444)
        svgText = svgText.replace(/#0C9784/g, "#ef4444")
        setSvgContent(svgText)
      } catch (error) {
        console.error("Failed to load SVG:", error)
      }
    }

    if (mounted) {
      loadSVG()
    }
  }, [mounted])

  useEffect(() => {
    if (svgContent) {
      const timer = setTimeout(() => {
        const rects = document.querySelectorAll("#map-svg rect")

        rects.forEach((rect) => {
          const duration = Math.random() * 1.5 + 0.5
          const delay = Math.random() * 1

          rect.setAttribute("style", `animation: glimmer ${duration}s ease-in-out ${delay}s infinite alternate;`)
          
          // Replace teal dots (#0C9784) with red
          const fillColor = rect.getAttribute("fill")
          if (fillColor === "#0C9784") {
            rect.setAttribute("fill", "#ef4444") // red-500
          }
        })

        const style = document.createElement("style")
        style.textContent = `
          @keyframes glimmer {
            0% { opacity: 1; }
            100% { opacity: 0.1; }
          }
        `
        document.head.appendChild(style)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [svgContent])

  if (!mounted) {
    return <div className="min-h-screen w-full bg-[#0A0A0A]" />
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        {/* Logo */}
        <Link href="/" aria-label="Go to homepage" className="flex items-center gap-2">
          <Image
            src="/Logo.svg"
            alt="Cision logo"
            width={32}
            height={32}
            className="w-8 h-8"
            priority
          />
          <span className="text-white font-semibold text-lg">Cision</span>
        </Link>

        {/* App Link */}
        <a href="/map" className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-sm">
          Open App
          <ArrowRight className="w-4 h-4" />
        </a>
      </nav>

      {/* Background Map - positioned absolutely behind content */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {svgContent && (
          <div
            id="map-svg"
            className="opacity-40 w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              transform: "translateY(-20%) scale(1.8)",
            }}
          />
        )}
      </div>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-4 text-center">
        

        {/* Headline */}
        <h1 className="font-mono text-6xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight text-balance">
          Cursor for
          <br />
          City Planning
        </h1>

        {/* Subtext */}
        <p className="text-white/60 text-lg md:text-xl max-w-2xl mb-8">
          Design and simulate urban development in minutes.
        </p>

        {/* CTA Button */}
        <a
          href="/map"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          Explore Cision
          <ArrowRight className="w-4 h-4" />
        </a>

        {/* Down Arrow Hint */}
        <div
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70"
          aria-hidden="true"
        >
          <span className="text-xs md:text-sm">swipe down</span>
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </div>
      </main>
      
      {/* Scroll Preview Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="flex flex-col overflow-hidden">
          <div 
            onClick={() => router.push("/map")}
            className="cursor-pointer transition-opacity hover:opacity-90"
          >
            <ContainerScroll
              titleComponent={
                <>
                  <h1 className="text-4xl font-semibold text-white text-center">
                   AI-Powered <br />
                    <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    Urban Planning
                    </span>
                  </h1>
                </>
              }
            >
              {/* Replace the src with your actual demo video (e.g., /demo.mp4) */}
              <video
                src="/yur.mov"
                className="mx-auto rounded-xl border border-zinc-800 w-[1400px] h-[720px] bg-zinc-900 object-contain"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={(e) => {
                  const v = e.currentTarget
                  // Freeze on the last frame (avoid jumping back to start)
                  try {
                    v.pause()
                    // Nudge to the exact end to prevent a black frame on some browsers
                    if (Number.isFinite(v.duration) && v.duration > 0) {
                      v.currentTime = v.duration - 0.001
                    }
                  } catch {}
                }}
              >
                {/* Fallback text for unsupported browsers */}
                Your browser does not support the video tag.
              </video>
            </ContainerScroll>
          </div>
        </div>
      </section>
    </div>
  )
}
