"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getTrending } from "@/lib/tmdb"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaCard } from "@/components/media-card"

interface WatchedMovie {
  id: number
  tmdb_id: number
  title: string
  poster_path: string | null
  watched_at: string
}

interface WatchlistMovie {
  id: number
  tmdb_id: number
  title: string
  poster_path: string | null
  added_at: string
}

interface TrendingMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

export default function Movies() {
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([])
  const [watchlistMovies, setWatchlistMovies] = useState<WatchlistMovie[]>([])
  const [recommendedMovies, setRecommendedMovies] = useState<TrendingMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error("Not authenticated")

        // Fetch watched movies
        const { data, error } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("type", "movie")
          .order("watched_at", { ascending: false })

        if (error) throw error
        setWatchedMovies(data || [])

        // Fetch watchlist movies
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("type", "movie")
          .order("added_at", { ascending: false })

        if (watchlistError) throw watchlistError
        setWatchlistMovies(watchlistData || [])

        // Fetch recommended/trending movies
        const trendingData = await getTrending("week", "movie")
        setRecommendedMovies(trendingData.results || [])
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
        .eq("type", "movie")
        .order("added_at", { ascending: false })

      if (error) throw error
      setWatchlistMovies(data || [])
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
          <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground">Movies you've watched and recommended titles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/search?type=movie">Find Movies</Link>
        </Button>
      </div>

      <Tabs defaultValue="watched" className="space-y-4">
        <TabsList>
          <TabsTrigger value="watched">Watched Movies</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="watched" className="space-y-4">
          {watchedMovies.length === 0 ? (
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
                <h3 className="mb-2 text-xl font-medium">No movies watched yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Start tracking your movie watching journey by adding movies you've watched.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=movie">Browse Movies</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchedMovies.map((movie) => (
                <Link key={movie.id} href={`/dashboard/movies/${movie.tmdb_id}`}>
                  <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/10 group">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : `/placeholder.svg?height=450&width=300`
                        }
                        alt={movie.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium truncate">{movie.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Watched on {new Date(movie.watched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          {watchlistMovies.length === 0 ? (
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
                  Add movies to your watchlist to keep track of what you want to watch next.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=movie">Browse Movies</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlistMovies.map((movie) => (
                <MediaCard
                  key={movie.id}
                  id={movie.tmdb_id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  mediaType="movie"
                  isWatchlist={true}
                  onWatchlistChange={refreshWatchlist}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recommendedMovies.map((movie) => (
              <Link key={movie.id} href={`/dashboard/movies/${movie.id}`}>
                <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/10 group">
                  <div className="aspect-[2/3] relative">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : `/placeholder.svg?height=450&width=300`
                      }
                      alt={movie.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium truncate">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "Unknown"}
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
