"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMoviesWatched: 0,
    totalShowsWatched: 0,
    totalWatchlistItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Get total users
        const { count: userCount, error: userError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (userError) {
          console.error("Error fetching user count:", userError)
        }

        // Get total movies watched
        const { count: moviesCount, error: moviesError } = await supabase
          .from("watched_content")
          .select("*", { count: "exact", head: true })
          .eq("type", "movie")

        if (moviesError) {
          console.error("Error fetching movies count:", moviesError)
        }

        // Get total shows watched
        const { count: showsCount, error: showsError } = await supabase
          .from("watched_content")
          .select("*", { count: "exact", head: true })
          .eq("type", "tv")

        if (showsError) {
          console.error("Error fetching shows count:", showsError)
        }

        // Get total watchlist items
        const { count: watchlistCount, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*", { count: "exact", head: true })

        if (watchlistError) {
          console.error("Error fetching watchlist count:", watchlistError)
        }

        setStats({
          totalUsers: userCount || 0,
          totalMoviesWatched: moviesCount || 0,
          totalShowsWatched: showsCount || 0,
          totalWatchlistItems: watchlistCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast({
          title: "Error",
          description: "Failed to fetch statistics. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your application and view statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Number of registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Movies Watched</CardTitle>
            <CardDescription>Total movies marked as watched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMoviesWatched}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Shows Watched</CardTitle>
            <CardDescription>Total TV shows marked as watched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalShowsWatched}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Watchlist Items</CardTitle>
            <CardDescription>Total items in watchlists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalWatchlistItems}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>View and manage user accounts, reset passwords, and handle user permissions.</p>
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>View detailed application statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>View detailed statistics about user activity, popular content, and usage patterns.</p>
            <Button asChild>
              <Link href="/admin/stats">View Statistics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
