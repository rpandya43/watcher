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
        console.log("Checking user session...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) {
            router.push("/login")
          }
          return
        }

        if (!session?.user) {
          console.log("No session found, redirecting to login")
          if (mounted) {
            router.push("/login")
          }
          return
        }

        console.log("User session found:", session.user.id)

        if (mounted) {
          setUser(session.user)

          // Check admin status
          try {
            const { data: adminData } = await supabase
              .from("admin_users")
              .select("*")
              .eq("email", session.user.email)
              .single()

            if (mounted && adminData) {
              setIsAdmin(true)
            }
          } catch (adminError) {
            console.log("Not an admin user (this is normal)")
          }
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
      console.log("Auth state changed:", event, session?.user?.id)

      if (!mounted) return

      if (event === "SIGNED_OUT" || !session) {
        console.log("User signed out, redirecting to home")
        setUser(null)
        setIsAdmin(false)
        router.push("/")
      } else if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in:", session.user.id)
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    console.log("Signing out...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
    }
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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Redirecting to login...</p>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      </div>
    )
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
