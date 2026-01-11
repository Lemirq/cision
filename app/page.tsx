"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"

export default function HomePage() {
  const [svgContent, setSvgContent] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Always use dark theme for this landing page
    document.documentElement.classList.add("dark")
  }, [])

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch("/map-dark.svg")
        const svgText = await response.text()
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">C</span>
          </div>
          <span className="text-white font-semibold text-lg">Cision</span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/90 hover:text-white transition-colors text-sm">
            Home
          </a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">
            About
          </a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">
            Pricing
          </a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">
            Discovery
          </a>
        </div>

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
              transform: "scale(1.8)",
            }}
          />
        )}
      </div>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-4 text-center">
        {/* Badge */}
        <div className="mb-6 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
          <span className="text-white/80 text-sm">
            Latest update
            <span className="mx-2 text-white/40">|</span>
            AI-Powered Urban Planning Is Here!
            <ArrowRight className="inline-block w-4 h-4 ml-2 text-white/60" />
          </span>
        </div>

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
      </main>
      
      {/* Scroll Preview Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="flex flex-col overflow-hidden">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-white text-center">
                  Unleash the power of <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    Scroll Animations
                  </span>
                </h1>
              </>
            }
          >
            <img
              src={"/map-dark.svg"}
              alt="Cision map preview"
              height={720}
              width={1400}
              className="mx-auto object-cover h-full object-left-top"
              draggable={false}
            />
          </ContainerScroll>
        </div>
      </section>
    </div>
  )
}
