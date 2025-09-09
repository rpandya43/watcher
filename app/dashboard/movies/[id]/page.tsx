"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getDetails, getRecommendations } from "@/lib/tmdb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react"

interface MovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  runtime: number
  vote_average: number
  genres: { id: number; name: string }[]
}

interface RecommendedMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

export default function MovieDetail({ params }: { params: { id: string } }) {
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([])
  const [isWatched, setIsWatched] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: "add" | "remove"; data: any } | null>(null)
  const router = useRouter()

  // Function to ensure the watchlist table exists
  const ensureWatchlistTable = async () => {
    try {
      // We'll just check if the table exists by trying to count records
      const { error } = await supabase.from("watchlist").select("id", { count: "exact", head: true })

      if (error && error.code === "42P01") {
        // Table doesn't exist error code
        // Try to create it via our API
        await fetch("/api/create-watchlist-table")
      }
    } catch (error) {
      console.error("Error checking watchlist table:", error)
    }
  }

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Ensure watchlist table exists
        await ensureWatchlistTable()

        // Get movie details from TMDB
        const movieData = await getDetails(params.id, "movie")
        setMovie(movieData)

        // Get recommendations
        const recommendationsData = await getRecommendations(params.id, "movie")
        setRecommendations(recommendationsData?.results?.slice(0, 6) || [])

        // Check if user has watched this movie
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: watchedData } = await supabase
            .from("watched_content")
            .select("*")
            .eq("user_id", userData.user.id)
            .eq("tmdb_id", params.id)
            .eq("type", "movie")
            .single()

          setIsWatched(!!watchedData)

          // Check if movie is in watchlist
          const { data: watchlistData } = await supabase
            .from("watchlist")
            .select("*")
            .eq("user_id", userData.user.id)
            .eq("tmdb_id", params.id)
            .eq("type", "movie")
            .single()

          setIsInWatchlist(!!watchlistData)
        }
      } catch (error) {
        console.error("Error fetching movie details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovieDetails()
  }, [params.id])

  const toggleWatched = async () => {
    try {
      setActionLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      if (isWatched) {
        // Store data for undo
        const { data: currentData } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", movie?.id)
          .eq("type", "movie")
          .single()

        setLastAction({ type: "remove", data: currentData })

        // Remove from watched
        const { error } = await supabase
          .from("watched_content")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", movie?.id)
          .eq("type", "movie")

        if (error) throw error
        toast({
          title: "Removed from watched",
          description: `${movie?.title} has been removed from your watched list.`,
        })
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      } else {
        // Add to watched
        const newData = {
          user_id: userData.user.id,
          tmdb_id: movie?.id,
          type: "movie",
          title: movie?.title,
          poster_path: movie?.poster_path,
        }

        const { error, data } = await supabase.from("watched_content").insert(newData).select()

        if (error) throw error
        setLastAction({ type: "add", data: data[0] })

        toast({
          title: "Added to watched",
          description: `${movie?.title} has been added to your watched list.`,
        })

        // If it was in watchlist, remove it
        if (isInWatchlist) {
          await toggleWatchlist(true)
        }
      }

      setIsWatched(!isWatched)
    } catch (error) {
      console.error("Error updating watched status:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your watched list.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleWatchlist = async (skipToast = false) => {
    try {
      setActionLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", movie?.id)
          .eq("type", "movie")

        if (error) throw error

        if (!skipToast) {
          toast({
            title: "Removed from watchlist",
            description: `${movie?.title} has been removed from your watchlist.`,
          })
        }
      } else {
        // Add to watchlist
        const { error } = await supabase.from("watchlist").insert({
          user_id: userData.user.id,
          tmdb_id: movie?.id,
          type: "movie",
          title: movie?.title,
          poster_path: movie?.poster_path,
        })

        if (error) throw error

        if (!skipToast) {
          toast({
            title: "Added to watchlist",
            description: `${movie?.title} has been added to your watchlist.`,
          })
        }
      }

      setIsInWatchlist(!isInWatchlist)
    } catch (error) {
      console.error("Error updating watchlist:", error)
      if (!skipToast) {
        toast({
          title: "Error",
          description: "There was a problem updating your watchlist.",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const undoAction = async () => {
    if (!lastAction) return

    try {
      setActionLoading(true)

      if (lastAction.type === "add") {
        // Undo add (delete)
        await supabase.from("watched_content").delete().eq("id", lastAction.data.id)

        setIsWatched(false)
      } else {
        // Undo remove (insert)
        await supabase.from("watched_content").insert(lastAction.data)

        setIsWatched(true)
      }

      toast({
        title: "Action undone",
        description: "Your previous action has been reversed.",
      })
    } catch (error) {
      console.error("Error undoing action:", error)
      toast({
        title: "Error",
        description: "There was a problem undoing your action.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setShowUndo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Movie not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div
        className="relative h-[300px] w-full overflow-hidden rounded-lg bg-cover bg-center md:h-[400px]"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{movie.title}</h1>
          <p className="text-lg opacity-90">
            {new Date(movie.release_date).getFullYear()} • {movie.runtime} min
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div>
          <Card>
            <CardContent className="p-0">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : `/placeholder.svg?height=450&width=300`
                }
                alt={movie.title}
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
          <div className="mt-4 space-y-2">
            <Button
              className="w-full"
              variant={isWatched ? "outline" : "default"}
              onClick={toggleWatched}
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : isWatched ? "Mark as Unwatched" : "Mark as Watched"}
            </Button>

            {!isWatched && (
              <Button
                className="w-full"
                variant={isInWatchlist ? "outline" : "secondary"}
                onClick={() => toggleWatchlist()}
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="mt-2 text-muted-foreground">{movie.overview}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Details</h2>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Release Date</span>
                <span>{new Date(movie.release_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Runtime</span>
                <span>{movie.runtime} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rating</span>
                <span>{movie.vote_average.toFixed(1)} / 10</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Watch Online</h2>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <a
                  href={`https://www.cineby.app/movie/${params.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <path d="m12 19 7-7 3 3-7 7-3-3z"></path>
                    <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="m2 2 7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                  </svg>
                  Watch on Cineby
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://ww25.soap2day.day/?s=${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Watch on Soap2day
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://uflix.cc/search?keyword=${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <path d="m12 19 7-7 3 3-7 7-3-3z"></path>
                    <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="m2 2 7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                  </svg>
                  Watch on Uflix
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://flixbaba.com/search?q=${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <path d="M6 12H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 12h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M6 12h12"></path>
                    <path d="M6 12v8"></path>
                    <path d="M18 12v8"></path>
                    <path d="M6 16h12"></path>
                  </svg>
                  Watch on FlixBaba
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://www3.zoechip.com/search/${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <path d="m22 8-6 4 6 4V8Z"></path>
                    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
                  </svg>
                  Watch on Zoechip
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
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
                    className="h-4 w-4"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Watch Trailer
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div>
          <Separator className="my-6" />
          <h2 className="text-2xl font-bold mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recommendations.map((rec) => (
              <Link key={rec.id} href={`/dashboard/movies/${rec.id}`}>
                <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/20 group">
                  <div className="aspect-[2/3] relative">
                    <img
                      src={
                        rec.poster_path
                          ? `https://image.tmdb.org/t/p/w500${rec.poster_path}`
                          : `/placeholder.svg?height=450&width=300`
                      }
                      alt={rec.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium truncate">{rec.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {rec.release_date ? new Date(rec.release_date).getFullYear() : "Unknown"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showUndo && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg border animate-in slide-in-from-bottom-10">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span>Action completed.</span>
          <Button variant="outline" size="sm" onClick={undoAction} disabled={actionLoading}>
            Undo
          </Button>
        </div>
      )}
    </div>
  )
}
