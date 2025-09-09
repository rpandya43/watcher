"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getTrending } from "@/lib/tmdb"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaCard } from "@/components/media-card"

interface WatchedShow {
  id: number
  tmdb_id: number
  title: string
  poster_path: string | null
  watched_at: string
}

interface WatchlistShow {
  id: number
  tmdb_id: number
  title: string
  poster_path: string | null
  added_at: string
}

interface TrendingShow {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string
}

export default function TVShows() {
  const [watchedShows, setWatchedShows] = useState<WatchedShow[]>([])
  const [watchlistShows, setWatchlistShows] = useState<WatchlistShow[]>([])
  const [recommendedShows, setRecommendedShows] = useState<TrendingShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error("Not authenticated")

        // Fetch watched shows
        const { data, error } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("type", "tv")
          .order("watched_at", { ascending: false })

        if (error) throw error
        setWatchedShows(data || [])

        // Fetch watchlist shows
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("type", "tv")
          .order("added_at", { ascending: false })

        if (watchlistError) throw watchlistError
        setWatchlistShows(watchlistData || [])

        // Fetch recommended/trending shows
        const trendingData = await getTrending("week", "tv")
        setRecommendedShows(trendingData.results || [])
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const refreshWatchlist = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("type", "tv")
        .order("added_at", { ascending: false })

      if (error) throw error
      setWatchlistShows(data || [])
    } catch (err) {
      console.error("Error refreshing watchlist:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TV Shows</h1>
          <p className="text-muted-foreground">TV shows you've watched and recommended titles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/search?type=tv">Find TV Shows</Link>
        </Button>
      </div>

      <Tabs defaultValue="watched" className="space-y-4">
        <TabsList>
          <TabsTrigger value="watched">Watched Shows</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="watched" className="space-y-4">
          {watchedShows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 text-muted-foreground"
                >
                  <rect width="20" height="15" x="2" y="7" rx="2" ry="2"></rect>
                  <polyline points="17 2 12 7 7 2"></polyline>
                </svg>
                <h3 className="mb-2 text-xl font-medium">No TV shows watched yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Start tracking your TV show watching journey by adding shows you've watched.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=tv">Browse TV Shows</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchedShows.map((show) => (
                <Link key={show.id} href={`/dashboard/tv-shows/${show.tmdb_id}`}>
                  <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/10 group">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={
                          show.poster_path
                            ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                            : `/placeholder.svg?height=450&width=300`
                        }
                        alt={show.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium truncate">{show.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Watched on {new Date(show.watched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          {watchlistShows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 text-muted-foreground"
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
                <h3 className="mb-2 text-xl font-medium">Your watchlist is empty</h3>
                <p className="mb-4 text-muted-foreground">
                  Add TV shows to your watchlist to keep track of what you want to watch next.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=tv">Browse TV Shows</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlistShows.map((show) => (
                <MediaCard
                  key={show.id}
                  id={show.tmdb_id}
                  title={show.title}
                  posterPath={show.poster_path}
                  mediaType="tv"
                  isWatchlist={true}
                  onWatchlistChange={refreshWatchlist}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recommendedShows.map((show) => (
              <Link key={show.id} href={`/dashboard/tv-shows/${show.id}`}>
                <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/10 group">
                  <div className="aspect-[2/3] relative">
                    <img
                      src={
                        show.poster_path
                          ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                          : `/placeholder.svg?height=450&width=300`
                      }
                      alt={show.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium truncate">{show.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {show.first_air_date ? new Date(show.first_air_date).getFullYear() : "Unknown"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
