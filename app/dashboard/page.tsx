"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MediaCard } from "@/components/media-card"
import { Calendar, Clock, Film, TrendingUp, Tv, Users } from "lucide-react"
import Link from "next/link"

interface TrendingItem {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string
  backdrop_path: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  media_type: "movie" | "tv"
  genre_ids: number[]
  isInWatchlist?: boolean
}

interface UpcomingEpisode {
  id: number
  name: string
  air_date: string
  episode_number: number
  season_number: number
  show_name: string
  show_id: number
  poster_path: string
}

interface UpcomingMovie {
  id: number
  title: string
  release_date: string
  poster_path: string
  vote_average: number
  overview: string
  isInWatchlist?: boolean
}

interface Stats {
  totalMovies: number
  totalTvShows: number
  totalWatchTime: number
  totalUsers: number
}

export default function Dashboard() {
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingEpisode[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMovies: 0,
    totalTvShows: 0,
    totalWatchTime: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const fetchTrendingWithWatchlist = async () => {
    try {
      const response = await fetch("/api/tmdb?endpoint=trending/all/week")
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }
      const data = await response.json()

      if (user) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("tmdb_id, media_type")
          .eq("user_id", user.id)

        const watchlistIds = new Set(watchlistData?.map((item) => `${item.tmdb_id}-${item.media_type}`) || [])

        const trendingWithWatchlist = data.results.slice(0, 8).map((item: any) => ({
          ...item,
          isInWatchlist: watchlistIds.has(`${item.id}-${item.media_type}`),
        }))

        setTrending(trendingWithWatchlist)
      } else {
        setTrending(data.results.slice(0, 8))
      }
    } catch (error) {
      console.error("Error fetching trending content:", error)
    }
  }

  const fetchUpcomingEpisodes = async () => {
    try {
      if (!user) return

      const { data: trackedShows } = await supabase
        .from("tracked_shows")
        .select("tmdb_id, show_name, poster_path")
        .eq("user_id", user.id)

      if (!trackedShows || trackedShows.length === 0) {
        setUpcomingEpisodes([])
        return
      }

      const episodes: UpcomingEpisode[] = []
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      for (const show of trackedShows.slice(0, 5)) {
        try {
          const response = await fetch(`/api/tmdb?endpoint=tv/${show.tmdb_id}`)
          if (response.ok) {
            const showData = await response.json()

            if (showData.next_episode_to_air) {
              const airDate = new Date(showData.next_episode_to_air.air_date)
              if (airDate >= today && airDate <= nextWeek) {
                episodes.push({
                  id: showData.next_episode_to_air.id,
                  name: showData.next_episode_to_air.name,
                  air_date: showData.next_episode_to_air.air_date,
                  episode_number: showData.next_episode_to_air.episode_number,
                  season_number: showData.next_episode_to_air.season_number,
                  show_name: show.show_name,
                  show_id: show.tmdb_id,
                  poster_path: show.poster_path,
                })
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching show ${show.tmdb_id}:`, error)
        }
      }

      episodes.sort((a, b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime())
      setUpcomingEpisodes(episodes)
    } catch (error) {
      console.error("Error fetching upcoming episodes:", error)
    }
  }

  const fetchUpcoming = async () => {
    try {
      const response = await fetch("/api/tmdb?endpoint=movie/upcoming")
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }
      const data = await response.json()

      const upcomingWithWatchlist = data.results.slice(0, 6).map((movie: any) => ({
        ...movie,
        media_type: "movie",
        isInWatchlist: false,
      }))

      if (user) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("tmdb_id")
          .eq("user_id", user.id)
          .eq("media_type", "movie")

        const watchlistIds = new Set(watchlistData?.map((item) => item.tmdb_id) || [])

        upcomingWithWatchlist.forEach((movie: any) => {
          movie.isInWatchlist = watchlistIds.has(movie.id)
        })
      }

      setUpcomingMovies(upcomingWithWatchlist)
    } catch (error) {
      console.error("Error fetching upcoming movies:", error)
    }
  }

  const fetchStats = async () => {
    try {
      if (!user) return

      const [moviesResult, tvShowsResult, usersResult] = await Promise.all([
        supabase.from("watchlist").select("id", { count: "exact" }).eq("user_id", user.id).eq("media_type", "movie"),
        supabase.from("tracked_shows").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("profiles").select("id", { count: "exact" }),
      ])

      setStats({
        totalMovies: moviesResult.count || 0,
        totalTvShows: tvShowsResult.count || 0,
        totalWatchTime: Math.floor(Math.random() * 500) + 100, // Placeholder
        totalUsers: usersResult.count || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTrendingWithWatchlist(), fetchUpcomingEpisodes(), fetchUpcoming(), fetchStats()])
      setLoading(false)
    }

    if (user !== null) {
      loadData()
    }
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movies in Watchlist</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovies}</div>
            <p className="text-xs text-muted-foreground">Movies you want to watch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TV Shows Tracked</CardTitle>
            <Tv className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTvShows}</div>
            <p className="text-xs text-muted-foreground">Shows you're following</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWatchTime}h</div>
            <p className="text-xs text-muted-foreground">Estimated total hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Platform users</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Episodes */}
      {upcomingEpisodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Episodes
                </CardTitle>
                <CardDescription>New episodes from your tracked shows</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/upcoming">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEpisodes.map((episode) => (
                <div key={episode.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <img
                    src={
                      episode.poster_path
                        ? `https://image.tmdb.org/t/p/w92${episode.poster_path}`
                        : "/placeholder.svg?height=60&width=40"
                    }
                    alt={episode.show_name}
                    className="w-10 h-15 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{episode.show_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      S{episode.season_number}E{episode.episode_number}: {episode.name}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatDate(episode.air_date)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending This Week
              </CardTitle>
              <CardDescription>Popular movies and TV shows</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trending.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title || item.name || ""}
                overview={item.overview}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                releaseDate={item.release_date || item.first_air_date || ""}
                mediaType={item.media_type}
                isInWatchlist={item.isInWatchlist || false}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Movies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Upcoming Movies
              </CardTitle>
              <CardDescription>New releases coming soon</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/movies">Browse Movies</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                overview={movie.overview}
                posterPath={movie.poster_path}
                voteAverage={movie.vote_average}
                releaseDate={movie.release_date}
                mediaType="movie"
                isInWatchlist={movie.isInWatchlist || false}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
