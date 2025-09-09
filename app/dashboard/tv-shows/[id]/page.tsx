"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getDetails, getRecommendations } from "@/lib/tmdb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Calendar, Play, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface TVShowDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string | null
  last_air_date: string | null
  number_of_seasons: number
  number_of_episodes: number
  vote_average: number | null
  genres: { id: number; name: string }[] | null
  next_episode_to_air: {
    air_date: string
    episode_number: number
    season_number: number
  } | null
  seasons:
    | {
        id: number
        name: string
        season_number: number
        episode_count: number
        air_date: string | null
        poster_path: string | null
      }[]
    | null
}

interface SeasonDetails {
  id: number
  name: string
  season_number: number
  episodes:
    | {
        id: number
        name: string
        episode_number: number
        air_date: string | null
        overview: string
        still_path: string | null
        runtime: number | null
      }[]
    | null
}

interface RecommendedShow {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string | null
}

// Sample show data for fallback
const sampleShow: TVShowDetails = {
  id: 0,
  name: "Show Not Available",
  overview: "Show details could not be loaded. Please try again later.",
  poster_path: null,
  backdrop_path: null,
  first_air_date: null,
  last_air_date: null,
  number_of_seasons: 0,
  number_of_episodes: 0,
  vote_average: null,
  genres: [],
  next_episode_to_air: null,
  seasons: [],
}

export default function TVShowDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const [show, setShow] = useState<TVShowDetails | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedShow[]>([])
  const [isWatched, setIsWatched] = useState(false)
  const [isTracked, setIsTracked] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [userStatusLoading, setUserStatusLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: "add" | "remove"; data: any } | null>(null)
  const [seasonDetails, setSeasonDetails] = useState<{ [key: number]: SeasonDetails }>({})
  const [loadingSeasons, setLoadingSeasons] = useState<{ [key: number]: boolean }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()

  // Function to create the watchlist table if it doesn't exist
  const ensureWatchlistTable = async () => {
    try {
      const response = await fetch("/api/create-watchlist-table")
      const data = await response.json()
      if (!data.success) {
        console.error("Failed to create watchlist table:", data.error)
      }
    } catch (error) {
      console.error("Error ensuring watchlist table exists:", error)
    }
  }

  // Fetch show details
  const fetchShowDetails = useCallback(async () => {
    try {
      setDetailsLoading(true)
      setApiError(null)

      // Get TV show details from TMDB
      console.log(`Fetching TV show details for ID: ${id}`)
      const showData = await getDetails(id, "tv")

      if (!showData) {
        console.error("Failed to fetch show details, using sample data")
        setShow(sampleShow)
        setApiError("Failed to load show details. Using placeholder data.")
      } else {
        console.log("Show data received:", showData)
        setShow(showData)
      }
    } catch (error) {
      console.error("Error fetching TV show details:", error)
      setShow(sampleShow)
      setApiError("Failed to load show details. Using placeholder data.")
    } finally {
      setDetailsLoading(false)
      setLoading(false)
    }
  }, [id])

  // Fetch recommendations separately
  const fetchRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true)
      const recommendationsData = await getRecommendations(id, "tv")
      setRecommendations(recommendationsData?.results?.slice(0, 6) || [])
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setRecommendations([])
    } finally {
      setRecommendationsLoading(false)
    }
  }, [id])

  // Fetch user status (watched, tracked, watchlist)
  const fetchUserStatus = useCallback(async () => {
    try {
      setUserStatusLoading(true)

      // Ensure tables exist
      await ensureWatchlistTable()
      try {
        await fetch("/api/create-tracked-shows-table")
      } catch (error) {
        console.error("Error ensuring tracked_shows table:", error)
      }

      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: watchedData } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", id)
          .eq("type", "tv")
          .single()

        // Try to get tracked data, but handle the case where the table might not exist
        let trackedData = null
        try {
          const { data } = await supabase
            .from("tracked_shows")
            .select("*")
            .eq("user_id", userData.user.id)
            .eq("tmdb_id", id)
            .single()

          trackedData = data
        } catch (error) {
          console.error("Error fetching tracked data:", error)
        }

        // Check if show is in watchlist
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", id)
          .eq("type", "tv")
          .single()

        setIsWatched(!!watchedData)
        setIsTracked(!!trackedData)
        setIsInWatchlist(!!watchlistData)
      }
    } catch (error) {
      console.error("Error fetching user status:", error)
    } finally {
      setUserStatusLoading(false)
    }
  }, [id])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)

      // Load show details first (most important)
      await fetchShowDetails()

      // Load user status and recommendations in parallel
      await Promise.all([fetchUserStatus(), fetchRecommendations()])
    }

    loadInitialData()
  }, [fetchShowDetails, fetchUserStatus, fetchRecommendations])

  const fetchSeasonDetails = async (seasonNumber: number) => {
    if (seasonDetails[seasonNumber] || loadingSeasons[seasonNumber]) return

    setLoadingSeasons((prev) => ({ ...prev, [seasonNumber]: true }))

    try {
      const response = await fetch(`/api/tmdb?endpoint=season&id=${id}&season=${seasonNumber}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch season details: ${response.status}`)
      }
      const data = await response.json()

      setSeasonDetails((prev) => ({
        ...prev,
        [seasonNumber]: data,
      }))
    } catch (error) {
      console.error(`Error fetching season ${seasonNumber} details:`, error)
    } finally {
      setLoadingSeasons((prev) => ({ ...prev, [seasonNumber]: false }))
    }
  }

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
          .eq("tmdb_id", show?.id)
          .eq("type", "tv")
          .single()

        setLastAction({ type: "remove", data: currentData })

        // Remove from watched
        const { error } = await supabase
          .from("watched_content")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", show?.id)
          .eq("type", "tv")

        if (error) throw error
        toast({
          title: "Removed from watched",
          description: `${show?.name} has been removed from your watched list.`,
        })
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      } else {
        // Add to watched
        const { error, data } = await supabase
          .from("watched_content")
          .insert({
            user_id: userData.user.id,
            tmdb_id: show?.id,
            type: "tv",
            title: show?.name,
            poster_path: show?.poster_path,
          })
          .select()

        if (error) throw error
        setLastAction({ type: "add", data: data[0] })

        toast({
          title: "Added to watched",
          description: `${show?.name} has been added to your watched list.`,
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

  const toggleTracked = async () => {
    try {
      setActionLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      if (isTracked) {
        // Remove from tracked
        const { error } = await supabase
          .from("tracked_shows")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", show?.id)

        if (error) throw error
        toast({
          title: "Removed from tracking",
          description: `${show?.name} has been removed from your tracked shows.`,
        })
      } else {
        // Add to tracked - use a simpler approach to avoid schema cache issues
        // First, create the basic data without the problematic column
        const trackData = {
          user_id: userData.user.id,
          tmdb_id: show?.id,
          show_name: show?.name || "",
          poster_path: show?.poster_path || null,
        }

        const { error, data } = await supabase.from("tracked_shows").insert(trackData).select()

        if (error) throw error

        // If we have next episode data and the insert was successful, update the row
        // with a separate query to set the next_episode_date
        if (show?.next_episode_to_air?.air_date && data && data.length > 0) {
          // Use RPC to update the next_episode_date using raw SQL to bypass schema cache
          await supabase.rpc("execute_sql", {
            sql_query: `
              UPDATE tracked_shows 
              SET next_episode_date = '${show.next_episode_to_air.air_date}'
              WHERE id = ${data[0].id}
            `,
          })
        }

        toast({
          title: "Added to tracking",
          description: `${show?.name} has been added to your tracked shows.`,
        })
      }

      setIsTracked(!isTracked)
    } catch (error) {
      console.error("Error updating tracked status:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your tracked shows.",
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
          .eq("tmdb_id", show?.id)
          .eq("type", "tv")

        if (error) throw error

        if (!skipToast) {
          toast({
            title: "Removed from watchlist",
            description: `${show?.name} has been removed from your watchlist.`,
          })
        }
      } else {
        // Add to watchlist
        const { error } = await supabase.from("watchlist").insert({
          user_id: userData.user.id,
          tmdb_id: show?.id,
          type: "tv",
          title: show?.name,
          poster_path: show?.poster_path,
        })

        if (error) throw error

        if (!skipToast) {
          toast({
            title: "Added to watchlist",
            description: `${show?.name} has been added to your watchlist.`,
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-muted md:h-[400px]">
          <Skeleton className="h-full w-full" />
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <div>
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>

            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!show) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>TV show not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {apiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div
        className="relative h-[300px] w-full overflow-hidden rounded-lg bg-cover bg-center md:h-[400px]"
        style={{
          backgroundImage: show.backdrop_path
            ? `url(https://image.tmdb.org/t/p/original${show.backdrop_path})`
            : "none",
          backgroundColor: !show.backdrop_path ? "rgba(0,0,0,0.2)" : undefined,
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{show.name}</h1>
          <p className="text-lg opacity-90">
            {show.first_air_date ? new Date(show.first_air_date).getFullYear() : "Unknown"} • {show.number_of_seasons}{" "}
            Season
            {show.number_of_seasons !== 1 ? "s" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(show.genres || []).map((genre) => (
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
                  show.poster_path
                    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                    : `/placeholder.svg?height=450&width=300`
                }
                alt={show.name}
                className="w-full rounded-lg"
                onError={(e) => {
                  // @ts-ignore
                  e.currentTarget.src = `/placeholder.svg?height=450&width=300`
                }}
              />
            </CardContent>
          </Card>
          <div className="mt-4 space-y-2">
            {userStatusLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <Button
                  className="w-full"
                  variant={isWatched ? "outline" : "default"}
                  onClick={toggleWatched}
                  disabled={actionLoading}
                >
                  {actionLoading && !isTracked && !isInWatchlist
                    ? "Updating..."
                    : isWatched
                      ? "Mark as Unwatched"
                      : "Mark as Watched"}
                </Button>

                {!isWatched && (
                  <Button
                    className="w-full"
                    variant={isInWatchlist ? "outline" : "secondary"}
                    onClick={() => toggleWatchlist()}
                    disabled={actionLoading}
                  >
                    {actionLoading && isInWatchlist
                      ? "Updating..."
                      : isInWatchlist
                        ? "Remove from Watchlist"
                        : "Add to Watchlist"}
                  </Button>
                )}

                <Button
                  className="w-full"
                  variant={isTracked ? "outline" : "secondary"}
                  onClick={toggleTracked}
                  disabled={actionLoading}
                >
                  {actionLoading && isTracked ? "Updating..." : isTracked ? "Stop Tracking" : "Track New Episodes"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="mt-2 text-muted-foreground">{show.overview || "No overview available."}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Details</h2>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">First Air Date</span>
                <span>{show.first_air_date ? formatDate(show.first_air_date) : "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Air Date</span>
                <span>{show.last_air_date ? formatDate(show.last_air_date) : "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Seasons</span>
                <span>{show.number_of_seasons || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Episodes</span>
                <span>{show.number_of_episodes || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rating</span>
                <span>{show.vote_average ? show.vote_average.toFixed(1) : "?"} / 10</span>
              </div>
            </div>
          </div>

          {show.next_episode_to_air && (
            <div>
              <h2 className="text-2xl font-bold">Next Episode</h2>
              <div className="mt-2 rounded-lg border p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Air Date</span>
                    <span>{formatDate(show.next_episode_to_air.air_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Season</span>
                    <span>{show.next_episode_to_air.season_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Episode</span>
                    <span>{show.next_episode_to_air.episode_number}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold mb-4">Watch Online</h2>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <a
                  href={`https://www.cineby.app/tv/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Watch on Cineby
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://ww25.soap2day.day/?s=${encodeURIComponent(show.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Watch on Soap2day
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " trailer")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Watch Trailer
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      {show.seasons && show.seasons.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Episodes</h2>
          <Accordion type="single" collapsible className="w-full">
            {show.seasons
              .filter((season) => season.season_number > 0) // Filter out specials (season 0)
              .map((season) => (
                <AccordionItem key={season.id} value={`season-${season.season_number}`}>
                  <AccordionTrigger
                    onClick={() => fetchSeasonDetails(season.season_number)}
                    className="hover:bg-accent/20 px-4 rounded-md"
                  >
                    <div className="flex items-center gap-4">
                      {season.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${season.poster_path}`}
                          alt={season.name}
                          className="h-16 w-12 object-cover rounded-md hidden sm:block"
                          loading="lazy"
                          onError={(e) => {
                            // @ts-ignore
                            e.currentTarget.src = `/placeholder.svg?height=96&width=64`
                          }}
                        />
                      )}
                      <div className="text-left">
                        <div className="font-semibold">{season.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {season.episode_count} episodes •{" "}
                          {season.air_date ? formatDate(season.air_date) : "No air date"}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {loadingSeasons[season.season_number] ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : seasonDetails[season.season_number] ? (
                      <div className="space-y-4 p-2">
                        {(seasonDetails[season.season_number]?.episodes || []).map((episode) => (
                          <div key={episode.id} className="border rounded-md p-4 hover:bg-accent/10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                                  {episode.episode_number}
                                </div>
                                <div>
                                  <h4 className="font-medium">{episode.name}</h4>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(episode.air_date)}
                                    {episode.runtime && <span className="ml-2">{episode.runtime} min</span>}
                                  </div>
                                </div>
                              </div>
                              <Button asChild size="sm" variant="outline" className="mt-2 sm:mt-0">
                                <a
                                  href={`https://www.cineby.app/tv/${id}/${season.season_number}/${episode.episode_number}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <Play className="h-3 w-3" />
                                  Watch
                                </a>
                              </Button>
                            </div>
                            {episode.overview && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{episode.overview}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-muted-foreground">
                        Failed to load episodes. Please try again.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendationsLoading ? (
        <div>
          <Separator className="my-6" />
          <h2 className="text-2xl font-bold mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
          </div>
        </div>
      ) : (
        recommendations &&
        recommendations.length > 0 && (
          <div>
            <Separator className="my-6" />
            <h2 className="text-2xl font-bold mb-4">You Might Also Like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recommendations.map((rec) => (
                <Link key={rec.id} href={`/dashboard/tv-shows/${rec.id}`}>
                  <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/20 group">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={
                          rec.poster_path
                            ? `https://image.tmdb.org/t/p/w500${rec.poster_path}`
                            : `/placeholder.svg?height=450&width=300`
                        }
                        alt={rec.name || "Show poster"}
                        className="object-cover w-full h-full"
                        loading="lazy"
                        onError={(e) => {
                          // @ts-ignore
                          e.currentTarget.src = `/placeholder.svg?height=450&width=300`
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium truncate">{rec.name || "Untitled"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {rec.first_air_date ? new Date(rec.first_air_date).getFullYear() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
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
