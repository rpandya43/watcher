"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { HoverSidebar } from "@/components/hover-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { NotificationChecker } from "@/components/notification-checker"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarPinned(localStorage.getItem("sidebarPinned") === "true")
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarPinned", sidebarPinned.toString())
    }
  }, [sidebarPinned])

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)

          // Check admin status
          const { data: adminData } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", session.user.email)
            .single()

          if (mounted && adminData) {
            setIsAdmin(true)
          }
        } else {
          router.push("/login")
          return
        }
      } catch (error) {
        console.error("Error checking user:", error)
        if (mounted) {
          router.push("/login")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setIsAdmin(false)
        router.push("/")
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const toggleSidebarPin = () => {
    setSidebarPinned(!sidebarPinned)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <OnboardingProvider>
      <OnboardingWrapper>
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1 overflow-hidden">
            <HoverSidebar isPinned={sidebarPinned} onTogglePin={toggleSidebarPin} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
                <div className="ml-auto flex items-center gap-2">
                  <ThemeToggle />
                  {isAdmin && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
              <Footer />
            </div>
          </div>
          <NotificationChecker />
        </div>
      </OnboardingWrapper>
    </OnboardingProvider>
  )
}
