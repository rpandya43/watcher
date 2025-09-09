"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { getDetails, getRecommendations, discoverByGenre } from "@/lib/tmdb"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaCard } from "@/components/media-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react"

interface WatchedContent {
  id: number
  tmdb_id: number
  type: "movie" | "tv"
  title: string
  poster_path: string | null
  watched_at: string
}

interface TrackedShow {
  id: number
  tmdb_id: number
  show_name: string
  poster_path: string | null
}

interface RecommendedContent {
  id: number
  title: string
  name?: string
  poster_path: string | null
  media_type: "movie" | "tv"
  release_date?: string
  first_air_date?: string
  vote_average?: number
  inWatchlist?: boolean
  source?: string
  similarity?: number
}

interface Genre {
  id: number
  name: string
}

interface Actor {
  id: number
  name: string
  character?: string
  profile_path?: string
}

// Loading messages to display during recommendation generation
const loadingMessages = [
  "Analyzing your watch history...",
  "Finding your favorite genres...",
  "Discovering hidden gems just for you...",
  "Curating personalized recommendations...",
  "Matching your taste with top-rated content...",
  "Using advanced algorithms to find your next favorite show...",
  "Exploring the best movies and TV shows for you...",
  "Almost there! Finalizing your personalized recommendations...",
]

export default function RecommendationsPage() {
  const [watchedContent, setWatchedContent] = useState<WatchedContent[]>([])
  const [trackedShows, setTrackedShows] = useState<TrackedShow[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([])
  const [favoriteGenres, setFavoriteGenres] = useState<Genre[]>([])
  const [favoriteActors, setFavoriteActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all")
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0])
  const [processedIds, setProcessedIds] = useState<Set<number>>(new Set())

  // Fetch watchlist IDs
  const fetchWatchlistIds = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return new Set<number>()

      const { data: watchlistData, error } = await supabase
        .from("watchlist")
        .select("tmdb_id")
        .eq("user_id", userData.user.id)

      if (error) throw error

      return new Set((watchlistData || []).map((item) => item.tmdb_id))
    } catch (error) {
      console.error("Error fetching watchlist IDs:", error)
      return new Set<number>()
    }
  }, [])

  // Fetch user's watched content and tracked shows
  const fetchUserContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      // Fetch watchlist IDs
      const watchlistIdSet = await fetchWatchlistIds()
      setWatchlistIds(watchlistIdSet)

      // Fetch watched content
      const { data: watchedData, error: watchedError } = await supabase
        .from("watched_content")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("watched_at", { ascending: false })

      if (watchedError) throw watchedError
      setWatchedContent(watchedData || [])

      // Fetch tracked shows
      const { data: trackedData, error: trackedError } = await supabase
        .from("tracked_shows")
        .select("*")
        .eq("user_id", userData.user.id)

      if (trackedError) throw trackedError
      setTrackedShows(trackedData || [])

      return { watchedData: watchedData || [], trackedData: trackedData || [] }
    } catch (error: any) {
      console.error("Error fetching user content:", error)
      // Check for rate limiting errors
      if (error.message && error.message.includes("Too Many Requests")) {
        setError("Rate limit exceeded. Please try again in a few minutes.")
      } else {
        setError("Failed to load your content. Please try again.")
      }
      return { watchedData: [], trackedData: [] }
    }
  }, [fetchWatchlistIds])

  // Extract favorite genres and actors from watched content
  const analyzeUserPreferences = useCallback(async (watchedData: WatchedContent[], trackedData: TrackedShow[]) => {
    try {
      // Only process if we have watched content
      if (watchedData.length === 0 && trackedData.length === 0) {
        return
      }

      // Update loading message
      setLoadingMessage(loadingMessages[1])

      const genreCounts: Record<number, { count: number; name: string }> = {}
      const actorCounts: Record<number, { count: number; actor: Actor }> = {}

      // Process watched content to extract genres and actors
      const contentDetailsPromises = watchedData.map(async (item) => {
        try {
          const details = await getDetails(item.tmdb_id.toString(), item.type)

          // Process genres
          if (details.genres) {
            details.genres.forEach((genre: Genre) => {
              if (!genreCounts[genre.id]) {
                genreCounts[genre.id] = { count: 0, name: genre.name }
              }
              genreCounts[genre.id].count += 1
            })
          }

          // Process actors (from credits)
          if (details.credits?.cast) {
            // Only consider top 5 actors from each content
            details.credits.cast.slice(0, 5).forEach((actor: Actor) => {
              if (!actorCounts[actor.id]) {
                actorCounts[actor.id] = {
                  count: 0,
                  actor: {
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path,
                  },
                }
              }
              actorCounts[actor.id].count += 1
            })
          }

          return details
        } catch (error) {
          console.error(`Error fetching details for ${item.type} ${item.tmdb_id}:`, error)
          return null
        }
      })

      // Update loading message
      setLoadingMessage(loadingMessages[2])

      // Process tracked shows as well
      const trackedDetailsPromises = trackedData.map(async (item) => {
        try {
          const details = await getDetails(item.tmdb_id.toString(), "tv")

          // Process genres
          if (details.genres) {
            details.genres.forEach((genre: Genre) => {
              if (!genreCounts[genre.id]) {
                genreCounts[genre.id] = { count: 0, name: genre.name }
              }
              genreCounts[genre.id].count += 1
            })
          }

          // Process actors (from credits)
          if (details.credits?.cast) {
            // Only consider top 5 actors from each content
            details.credits.cast.slice(0, 5).forEach((actor: Actor) => {
              if (!actorCounts[actor.id]) {
                actorCounts[actor.id] = {
                  count: 0,
                  actor: {
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path,
                  },
                }
              }
              actorCounts[actor.id].count += 1
            })
          }

          return details
        } catch (error) {
          console.error(`Error fetching details for TV show ${item.tmdb_id}:`, error)
          return null
        }
      })

      // Wait for all details to be fetched
      await Promise.all([...contentDetailsPromises, ...trackedDetailsPromises])

      // Update loading message
      setLoadingMessage(loadingMessages[3])

      // Sort genres by count and take top 5
      const topGenres = Object.values(genreCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
          id: Number.parseInt(
            Object.keys(genreCounts).find((key) => genreCounts[Number.parseInt(key)] === item) || "0",
          ),
          name: item.name,
        }))

      // Sort actors by count and take top 10
      const topActors = Object.values(actorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((item) => item.actor)

      setFavoriteGenres(topGenres)
      setFavoriteActors(topActors)

      return { topGenres, topActors }
    } catch (error) {
      console.error("Error analyzing user preferences:", error)
      return { topGenres: [], topActors: [] }
    }
  }, [])

  // Generate recommendations based on user preferences
  const generateRecommendations = useCallback(
    async (
      watchedData: WatchedContent[],
      trackedData: TrackedShow[],
      topGenres: Genre[],
      topActors: Actor[],
      page = 1,
      mediaType: "all" | "movie" | "tv" = "all",
      existingIds: Set<number> = new Set(),
    ) => {
      try {
        setLoadingMore(true)

        // If no watched content or tracked shows, return empty recommendations
        if (watchedData.length === 0 && trackedData.length === 0) {
          setLoadingMore(false)
          return []
        }

        // Update loading message
        setLoadingMessage(loadingMessages[4])

        const allRecommendations: RecommendedContent[] = []

        // Calculate how many items to fetch from each source to get a total of 25
        const itemsPerSource = Math.ceil(25 / 3) // Divide 25 items across 3 sources

        // 1. Get recommendations based on recently watched content (limited to 1-2 items)
        const recentlyWatched = watchedData.filter((item) => mediaType === "all" || item.type === mediaType).slice(0, 2) // Only use 1-2 items to reduce API calls

        // Add delay between API calls to avoid rate limiting
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

        // Update loading message
        setLoadingMessage(loadingMessages[5])

        for (const item of recentlyWatched) {
          try {
            const recData = await getRecommendations(item.tmdb_id.toString(), item.type, page)

            if (recData && recData.results) {
              // Filter by media type if needed
              const filteredResults =
                mediaType === "all"
                  ? recData.results
                  : recData.results.filter((rec: any) => {
                      const recType = rec.media_type || (rec.title ? "movie" : "tv")
                      return recType === mediaType
                    })

              // Filter out already processed IDs and already watched content
              const newResults = filteredResults.filter(
                (rec: any) => !existingIds.has(rec.id) && !watchedData.some((w) => w.tmdb_id === rec.id),
              )

              // Map and add source information (limit to itemsPerSource)
              const mappedRecs = newResults.slice(0, itemsPerSource).map((rec: any) => ({
                id: rec.id,
                title: rec.title || rec.name,
                name: rec.name,
                poster_path: rec.poster_path,
                media_type: rec.media_type || (rec.title ? "movie" : "tv"),
                release_date: rec.release_date,
                first_air_date: rec.first_air_date,
                vote_average: rec.vote_average,
                inWatchlist: watchlistIds.has(rec.id),
                source: `Based on ${item.title}`,
                similarity: 0.9, // High similarity since it's a direct recommendation
              }))

              allRecommendations.push(...mappedRecs)
            }

            // Add delay between API calls
            await delay(300)
          } catch (error) {
            console.error(`Error getting recommendations for ${item.type} ${item.tmdb_id}:`, error)
            // Continue with other sources even if one fails
          }
        }

        // Update loading message
        setLoadingMessage(loadingMessages[6])

        // 2. Get recommendations based on tracked shows (limited to 1 item)
        if (allRecommendations.length < 25) {
          const recentlyTracked = trackedData.filter((item) => mediaType === "all" || mediaType === "tv").slice(0, 1) // Only use 1 item to reduce API calls

          for (const item of recentlyTracked) {
            try {
              const recData = await getRecommendations(item.tmdb_id.toString(), "tv", page)

              if (recData && recData.results) {
                // Filter by media type if needed
                const filteredResults =
                  mediaType === "all"
                    ? recData.results
                    : recData.results.filter((rec: any) => {
                        const recType = rec.media_type || (rec.title ? "movie" : "tv")
                        return recType === mediaType
                      })

                // Filter out already processed IDs and already watched content
                const newResults = filteredResults.filter(
                  (rec: any) => !existingIds.has(rec.id) && !watchedData.some((w) => w.tmdb_id === rec.id),
                )

                // Map and add source information (limit to itemsPerSource)
                const mappedRecs = newResults.slice(0, itemsPerSource).map((rec: any) => ({
                  id: rec.id,
                  title: rec.title || rec.name,
                  name: rec.name,
                  poster_path: rec.poster_path,
                  media_type: rec.media_type || (rec.title ? "movie" : "tv"),
                  release_date: rec.release_date,
                  first_air_date: rec.first_air_date,
                  vote_average: rec.vote_average,
                  inWatchlist: watchlistIds.has(rec.id),
                  source: `Because you're tracking ${item.show_name}`,
                  similarity: 0.85, // High similarity since it's a direct recommendation
                }))

                allRecommendations.push(...mappedRecs)
              }

              // Add delay between API calls
              await delay(300)
            } catch (error) {
              console.error(`Error getting recommendations for TV show ${item.tmdb_id}:`, error)
              // Continue with other sources even if one fails
            }
          }
        }

        // 3. Get recommendations based on favorite genres (only if we need more items)
        if (allRecommendations.length < 25 && topGenres.length > 0) {
          // Only use 1 genre to reduce API calls
          const genre = topGenres[0]

          try {
            // Discover content by genre
            const type = mediaType === "all" ? (Math.random() > 0.5 ? "movie" : "tv") : mediaType
            const discoverData = await discoverByGenre(type, genre.id.toString(), page)

            if (discoverData && discoverData.results) {
              // Filter out already processed IDs and already watched content
              const newResults = discoverData.results.filter(
                (rec: any) => !existingIds.has(rec.id) && !watchedData.some((w) => w.tmdb_id === rec.id),
              )

              // Map and add source information (get enough to reach 25 total)
              const itemsNeeded = 25 - allRecommendations.length
              const mappedRecs = newResults.slice(0, itemsNeeded).map((rec: any) => ({
                id: rec.id,
                title: rec.title || rec.name,
                name: rec.name,
                poster_path: rec.poster_path,
                media_type: type,
                release_date: rec.release_date,
                first_air_date: rec.first_air_date,
                vote_average: rec.vote_average,
                inWatchlist: watchlistIds.has(rec.id),
                source: `Because you like ${genre.name}`,
                similarity: 0.7, // Medium similarity since it's based on genre
              }))

              allRecommendations.push(...mappedRecs)
            }
          } catch (error) {
            console.error(`Error discovering content for genre ${genre.name}:`, error)
            // Continue even if this source fails
          }
        }

        // Update loading message
        setLoadingMessage(loadingMessages[7])

        // 4. Remove duplicates (by ID)
        const uniqueRecommendations = Array.from(new Map(allRecommendations.map((item) => [item.id, item])).values())

        // 5. Remove items that the user has already watched
        const watchedIds = new Set(watchedData.map((item) => item.tmdb_id))
        const filteredRecommendations = uniqueRecommendations.filter((item) => !watchedIds.has(item.id))

        // 6. Sort by similarity score (higher first)
        filteredRecommendations.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))

        // 7. Return exactly 25 recommendations (or fewer if not enough available)
        const finalRecommendations = filteredRecommendations.slice(0, 25)

        // Add all new IDs to the processed set
        finalRecommendations.forEach((item) => existingIds.add(item.id))

        setLoadingMore(false)
        return finalRecommendations
      } catch (error) {
        console.error("Error generating recommendations:", error)
        setLoadingMore(false)
        return []
      }
    },
    [watchlistIds],
  )

  // Initial data loading
  useEffect(() => {
    let isMounted = true
    let currentMessageIndex = 0

    // Function to cycle through loading messages
    const cycleLoadingMessages = () => {
      const interval = setInterval(() => {
        if (!isMounted || !loading) {
          clearInterval(interval)
          return
        }

        currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length
        setLoadingMessage(loadingMessages[currentMessageIndex])
      }, 3000)

      return interval
    }

    const loadInitialData = async () => {
      try {
        // Start cycling through loading messages
        const messageInterval = cycleLoadingMessages()

        // Fetch user content
        const { watchedData, trackedData } = await fetchUserContent()

        if (!isMounted) {
          clearInterval(messageInterval)
          return
        }

        // Analyze user preferences
        const { topGenres, topActors } = (await analyzeUserPreferences(watchedData, trackedData)) || {
          topGenres: [],
          topActors: [],
        }

        if (!isMounted) {
          clearInterval(messageInterval)
          return
        }

        // Generate initial recommendations
        const initialRecommendations = await generateRecommendations(
          watchedData,
          trackedData,
          topGenres || [],
          topActors || [],
          1,
          "all",
          new Set(),
        )

        if (!isMounted) {
          clearInterval(messageInterval)
          return
        }

        // Store the IDs of initial recommendations
        const initialIds = new Set(initialRecommendations.map((item) => item.id))
        setProcessedIds(initialIds)

        setRecommendations(initialRecommendations || [])
        clearInterval(messageInterval)
      } catch (error) {
        console.error("Error loading initial data:", error)
        if (isMounted) {
          setError("Failed to load recommendations. Please try again.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once on mount

  // Handle tab change
  const handleTabChange = async (value: string) => {
    setActiveTab(value as "all" | "movies" | "tv")
    setPage(1)
    setLoading(true)
    setProcessedIds(new Set())

    try {
      // Generate recommendations for the selected tab
      const newRecommendations = await generateRecommendations(
        watchedContent,
        trackedShows,
        favoriteGenres,
        favoriteActors,
        1,
        value as "all" | "movie" | "tv",
        new Set(),
      )

      // Store the IDs of new recommendations
      const newIds = new Set(newRecommendations.map((item) => item.id))
      setProcessedIds(newIds)

      setRecommendations(newRecommendations || [])
    } catch (error) {
      console.error("Error changing tab:", error)
      setError("Failed to load recommendations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Load more recommendations
  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1

    try {
      // Add a retry mechanism with exponential backoff
      const retryWithBackoff = async (attempt = 1, maxAttempts = 3, initialDelay = 1000) => {
        try {
          // Generate more recommendations, passing the current processed IDs
          const moreRecommendations = await generateRecommendations(
            watchedContent,
            trackedShows,
            favoriteGenres,
            favoriteActors,
            nextPage,
            activeTab,
            processedIds,
          )

          // Add new recommendations to existing ones
          setRecommendations([...recommendations, ...moreRecommendations])

          // Update processed IDs
          const newProcessedIds = new Set(processedIds)
          moreRecommendations.forEach((item) => newProcessedIds.add(item.id))
          setProcessedIds(newProcessedIds)

          setPage(nextPage)
          return true
        } catch (error: any) {
          // Check if it's a rate limiting error
          if (error.message && error.message.includes("Too Many Requests") && attempt < maxAttempts) {
            const delay = initialDelay * Math.pow(2, attempt - 1)
            console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            return retryWithBackoff(attempt + 1, maxAttempts, initialDelay)
          }
          throw error
        }
      }

      await retryWithBackoff()
    } catch (error) {
      console.error("Error loading more recommendations:", error)
      setError("Rate limit exceeded. Please try again in a few minutes.")
    } finally {
      setLoadingMore(false)
    }
  }

  // Refresh recommendations
  const refreshRecommendations = async () => {
    setRefreshing(true)
    setPage(1)
    setProcessedIds(new Set())

    try {
      // Fetch user content again
      const { watchedData, trackedData } = await fetchUserContent()

      // Analyze user preferences again
      const { topGenres, topActors } = (await analyzeUserPreferences(watchedData, trackedData)) || {
        topGenres: [],
        topActors: [],
      }

      // Generate fresh recommendations
      const freshRecommendations = await generateRecommendations(
        watchedData,
        trackedData,
        topGenres || [],
        topActors || [],
        1,
        activeTab,
        new Set(),
      )

      // Store the IDs of fresh recommendations
      const freshIds = new Set(freshRecommendations.map((item) => item.id))
      setProcessedIds(freshIds)

      setRecommendations(freshRecommendations || [])
    } catch (error) {
      console.error("Error refreshing recommendations:", error)
      setError("Failed to refresh recommendations. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  // Update watchlist status
  const refreshWatchlistStatus = async () => {
    try {
      const watchlistIdSet = await fetchWatchlistIds()

      // Only update if the sets are different
      if (JSON.stringify([...watchlistIdSet].sort()) !== JSON.stringify([...watchlistIds].sort())) {
        setWatchlistIds(watchlistIdSet)

        // Update recommendations with new watchlist status
        setRecommendations((prevRecs) =>
          prevRecs.map((rec) => ({
            ...rec,
            inWatchlist: watchlistIdSet.has(rec.id),
          })),
        )
      }
    } catch (error) {
      console.error("Error refreshing watchlist status:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-muted-foreground">Personalized content based on your watch history</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRecommendations}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {favoriteGenres.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2">Your Favorite Genres</h2>
          <div className="flex flex-wrap gap-2">
            {favoriteGenres.map((genre) => (
              <div key={genre.id} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                {genre.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Recommendations</TabsTrigger>
          <TabsTrigger value="movie">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV Shows</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="space-y-8">
              <div className="flex items-center justify-center p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-lg font-medium">{loadingMessage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array(10)
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
          ) : recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recommendations.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <MediaCard
                      id={item.id}
                      title={item.title || item.name || "Untitled"}
                      posterPath={item.poster_path}
                      mediaType={item.media_type}
                      isWatchlist={item.inWatchlist}
                      onWatchlistChange={refreshWatchlistStatus}
                      releaseDate={item.release_date || item.first_air_date}
                    />
                    {item.source && <div className="mt-1 text-xs text-muted-foreground px-1">{item.source}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button onClick={loadMore} disabled={loadingMore} className="min-w-[200px]">
                  {loadingMore ? "Loading..." : "Load More Recommendations"}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No recommendations available</h3>
                <p className="mb-4 text-muted-foreground">Watch more content to get personalized recommendations.</p>
                <Button onClick={refreshRecommendations}>Refresh</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movie" className="mt-6">
          {loading ? (
            <div className="space-y-8">
              <div className="flex items-center justify-center p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-lg font-medium">{loadingMessage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array(10)
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
          ) : recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recommendations.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <MediaCard
                      id={item.id}
                      title={item.title || item.name || "Untitled"}
                      posterPath={item.poster_path}
                      mediaType={item.media_type}
                      isWatchlist={item.inWatchlist}
                      onWatchlistChange={refreshWatchlistStatus}
                      releaseDate={item.release_date || item.first_air_date}
                    />
                    {item.source && <div className="mt-1 text-xs text-muted-foreground px-1">{item.source}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button onClick={loadMore} disabled={loadingMore} className="min-w-[200px]">
                  {loadingMore ? "Loading..." : "Load More Recommendations"}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No movie recommendations available</h3>
                <p className="mb-4 text-muted-foreground">Watch more movies to get personalized recommendations.</p>
                <Button onClick={refreshRecommendations}>Refresh</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tv" className="mt-6">
          {loading ? (
            <div className="space-y-8">
              <div className="flex items-center justify-center p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-lg font-medium">{loadingMessage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array(10)
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
          ) : recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recommendations.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <MediaCard
                      id={item.id}
                      title={item.title || item.name || "Untitled"}
                      posterPath={item.poster_path}
                      mediaType={item.media_type}
                      isWatchlist={item.inWatchlist}
                      onWatchlistChange={refreshWatchlistStatus}
                      releaseDate={item.release_date || item.first_air_date}
                    />
                    {item.source && <div className="mt-1 text-xs text-muted-foreground px-1">{item.source}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button onClick={loadMore} disabled={loadingMore} className="min-w-[200px]">
                  {loadingMore ? "Loading..." : "Load More Recommendations"}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No TV show recommendations available</h3>
                <p className="mb-4 text-muted-foreground">Watch more TV shows to get personalized recommendations.</p>
                <Button onClick={refreshRecommendations}>Refresh</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
