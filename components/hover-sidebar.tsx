"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Button } from "@/components/ui/button"

interface HoverSidebarProps {
  isPinned?: boolean
  onTogglePin?: () => void
}

export function HoverSidebar({ isPinned, onTogglePin }: HoverSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleMouseEnter = () => {
    if (isPinned || isMobile) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    if (isPinned || isMobile) return

    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300) // Small delay to prevent flickering
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (isPinned) {
    return <DashboardSidebar isOpen={true} isPinned={isPinned} onTogglePin={onTogglePin} />
  }

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden fixed top-3 left-4 z-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="12" y2="12"></line>
            <line x1="4" x2="20" y1="6" y2="6"></line>
            <line x1="4" x2="20" y1="18" y2="18"></line>
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <DashboardSidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
        />
      </>
    )
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="fixed left-0 top-0 h-full w-4 z-40 hidden md:block"
        onMouseEnter={handleMouseEnter}
      />
      <div ref={sidebarRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <DashboardSidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
        />
      </div>
    </>
  )
}
