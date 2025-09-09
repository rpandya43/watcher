"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface WatchedContent {
  id: number
  tmdb_id: number
  type: "movie" | "tv"
  title: string
  poster_path: string | null
  watched_at: string
  runtime?: number
}

interface GenreCount {
  name: string
  count: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function Stats() {
  const [watchedContent, setWatchedContent] = useState<WatchedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalShows: 0,
    totalMinutes: 0,
    avgMoviesPerMonth: 0,
    avgShowsPerMonth: 0,
    genreCounts: [] as GenreCount[],
    watchedByMonth: [] as { name: string; movies: number; shows: number }[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error("Not authenticated")

        // Fetch all watched content
        const { data, error } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("watched_at", { ascending: false })

        if (error) throw error

        // For simplicity, we'll use estimated runtimes
        const contentWithRuntime = data.map((item) => ({
          ...item,
          runtime: item.type === "movie" ? 120 : 30, // Estimate 2 hours for movies, 30 mins for TV episodes
        }))

        setWatchedContent(contentWithRuntime)

        // Calculate stats
        const movies = contentWithRuntime.filter((item) => item.type === "movie")
        const shows = contentWithRuntime.filter((item) => item.type === "tv")

        const totalMinutes = contentWithRuntime.reduce((sum, item) => sum + (item.runtime || 0), 0)

        // Calculate average per month
        const now = new Date()
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(now.getMonth() - 6)

        const recentMovies = movies.filter((m) => new Date(m.watched_at) > sixMonthsAgo)
        const recentShows = shows.filter((s) => new Date(s.watched_at) > sixMonthsAgo)

        const avgMoviesPerMonth = recentMovies.length / 6
        const avgShowsPerMonth = recentShows.length / 6

        // Generate genre data (in a real app, you'd fetch this from TMDB)
        const genreData = [
          { name: "Action", count: Math.floor(movies.length * 0.3) },
          { name: "Drama", count: Math.floor(movies.length * 0.25) },
          { name: "Comedy", count: Math.floor(movies.length * 0.2) },
          { name: "Sci-Fi", count: Math.floor(movies.length * 0.15) },
          { name: "Horror", count: Math.floor(movies.length * 0.1) },
        ].filter((genre) => genre.count > 0) // Only include genres with counts > 0

        // Create watched by month data
        const months = []
        for (let i = 0; i < 6; i++) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const monthName = d.toLocaleString("default", { month: "short" })
          const year = d.getFullYear()

          const monthMovies = movies.filter((m) => {
            const date = new Date(m.watched_at)
            return date.getMonth() === d.getMonth() && date.getFullYear() === year
          }).length

          const monthShows = shows.filter((s) => {
            const date = new Date(s.watched_at)
            return date.getMonth() === d.getMonth() && date.getFullYear() === year
          }).length

          months.unshift({ name: monthName, movies: monthMovies, shows: monthShows })
        }

        setStats({
          totalMovies: movies.length,
          totalShows: shows.length,
          totalMinutes,
          avgMoviesPerMonth,
          avgShowsPerMonth,
          genreCounts: genreData,
          watchedByMonth: months,
        })
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
        <h1 className="text-3xl font-bold tracking-tight">Your Stats</h1>
        <p className="text-muted-foreground">See your watching habits and trends</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Movies Watched</CardTitle>
            <CardDescription>Total movies in your history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMovies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>TV Shows Watched</CardTitle>
            <CardDescription>Total shows in your history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalShows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Watch Time</CardTitle>
            <CardDescription>Estimated total minutes watched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMinutes}</div>
            <p className="text-sm text-muted-foreground">
              That's about {Math.floor(stats.totalMinutes / 60)} hours or {Math.floor(stats.totalMinutes / 60 / 24)}{" "}
              days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Watching Trends</TabsTrigger>
          <TabsTrigger value="genres">Favorite Genres</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Movies and shows watched per month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.watchedByMonth}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="movies" name="Movies" fill="#0088FE" />
                    <Bar dataKey="shows" name="TV Shows" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Average Movies</CardTitle>
                <CardDescription>Movies watched per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgMoviesPerMonth.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Average Shows</CardTitle>
                <CardDescription>TV shows watched per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgShowsPerMonth.toFixed(1)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="genres">
          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>Your most watched genres</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.genreCounts.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genreCounts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.genreCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Watch more content to see your genre distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
