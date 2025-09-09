"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// List of admin emails
const ADMIN_EMAILS = ["admin@example.com"] // Replace with your admin email(s)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)

        // Check if user is an admin by querying the admin_users table
        const { data: adminData, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", data.user.email)
          .single()

        if (adminData) {
          setIsAdmin(true)
        } else {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin panel.</p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Link href="/admin" className="flex items-center gap-2">
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Admin Panel
          </Link>
        </div>
        <nav className="hidden flex-1 md:flex">
          <ul className="flex gap-4">
            <li>
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/admin-users" className="text-muted-foreground hover:text-foreground">
                Admin Users
              </Link>
            </li>
            <li>
              <Link href="/admin/stats" className="text-muted-foreground hover:text-foreground">
                Statistics
              </Link>
            </li>
            <li>
              <Link href="/admin/email-reminders" className="text-muted-foreground hover:text-foreground">
                Email Reminders
              </Link>
            </li>
            <li>
              <Link href="/admin/api-status" className="text-muted-foreground hover:text-foreground">
                API Status
              </Link>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Exit Admin</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
      <Footer />
    </div>
  )
}
