"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { Pin, PinOff } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean
  onClose?: () => void
  isPinned?: boolean
  onTogglePin?: () => void
}

export function DashboardSidebar({ className, isOpen, onClose, isPinned, onTogglePin }: SidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
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
          className="h-5 w-5"
        >
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      ),
    },
    {
      name: "Movies",
      href: "/dashboard/movies",
      icon: (
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
          className="h-5 w-5"
        >
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M7 3v18"></path>
          <path d="M3 7h18"></path>
          <path d="M3 11h18"></path>
          <path d="M3 15h18"></path>
          <path d="M3 19h18"></path>
          <path d="M17 3v18"></path>
          <path d="M15 7v2"></path>
          <path d="M15 15v2"></path>
          <path d="M9 7v2"></path>
          <path d="M9 15v2"></path>
        </svg>
      ),
    },
    {
      name: "TV Shows",
      href: "/dashboard/tv-shows",
      icon: (
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
          className="h-5 w-5"
        >
          <rect width="20" height="15" x="2" y="7" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
      ),
    },
    {
      name: "Watchlist",
      href: "/dashboard/watchlist",
      icon: (
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
          className="h-5 w-5"
        >
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
          <path d="M12 2v2"></path>
          <path d="M12 22v-2"></path>
          <path d="m17 20.66-1-1.73"></path>
          <path d="M11 10.27 7 3.34"></path>
          <path d="m20.66 17-1.73-1"></path>
          <path d="m3.34 7 1.73 1"></path>
          <path d="M14 12h8"></path>
          <path d="M2 12h2"></path>
          <path d="m20.66 7-1.73 1"></path>
          <path d="m3.34 17 1.73-1"></path>
          <path d="m17 3.34-1 1.73"></path>
          <path d="m7 20.66 1-1.73"></path>
        </svg>
      ),
    },
    {
      name: "Recommendations",
      href: "/dashboard/recommendations",
      icon: (
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
          className="h-5 w-5"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
        </svg>
      ),
    },
    {
      name: "Upcoming Episodes",
      href: "/dashboard/upcoming",
      icon: (
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
          className="h-5 w-5"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
          <path d="m9 16 2 2 4-4"></path>
        </svg>
      ),
    },
    {
      name: "Search",
      href: "/dashboard/search",
      icon: (
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
          className="h-5 w-5"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      ),
    },
    {
      name: "Stats",
      href: "/dashboard/stats",
      icon: (
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
          className="h-5 w-5"
        >
          <path d="M3 3v18h18"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>
      ),
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: (
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
          className="h-5 w-5"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
    },
  ]

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
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
            <path d="m15 5 4 4"></path>
            <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"></path>
            <path d="m8 6 8 8"></path>
            <path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"></path>
          </svg>
          <span>WatchTracker</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} onClick={isMobile ? onClose : undefined}>
              <Button
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", {
                  "bg-secondary": pathname === route.href,
                })}
              >
                {route.icon}
                {route.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      {!isMobile && (
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onTogglePin}>
            {isPinned ? (
              <>
                <PinOff className="h-4 w-4" />
                <span>Unpin Sidebar</span>
              </>
            ) : (
              <>
                <Pin className="h-4 w-4" />
                <span>Pin Sidebar</span>
              </>
            )}
          </Button>
        </div>
      )}
    </>
  )

  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        {sidebarContent}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-64 border-r transition-all duration-300 ease-in-out",
        !isOpen && !isPinned && "-ml-64",
        className,
      )}
    >
      {sidebarContent}
    </div>
  )
}
