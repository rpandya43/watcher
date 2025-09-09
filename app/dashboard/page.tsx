"use client"

import { useEffect, useState, useCallback, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { getTrending, getUpcoming } from "@/lib/tmdb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MediaCard } from "@/components/media-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingContext } from "@/components/onboarding/onboarding-provider"

interface TrendingItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  media_type: "movie" | "tv"
  release_date?: string
  first_air_date?: string
  inWatchlist?: boolean
}

interface UpcomingEpisode {
  id: number
  tmdb_id: number
  show_name: string
  next_episode_date: string
  poster_path: string | null
}

interface UpcomingMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  inWatchlist?: boolean
}

// Sample data for fallback when API fails
const sampleTrendingItems: TrendingItem[] = [
  {
    id: 1,
    title: "Sample Movie 1",
    poster_path: null,
    media_type: "movie",
    release_date: "2023-01-01",
    inWatchlist: false,
  },
  {
    id: 2,
    name: "Sample TV Show 1",
    poster_path: null,
    media_type: "tv",
    first_air_date: "2023-02-01",
    inWatchlist: false,
  },
  {
    id: 3,
    title: "Sample Movie 2",
    poster_path: null,
    media_type: "movie",
    release_date: "2023-03-01",
    inWatchlist: false,
  },
  {
    id: 4,
    name: "Sample TV Show 2",
    poster_path: null,
    media_type: "tv",
    first_air_date: "2023-04-01",
    inWatchlist: false,
  },
]

export default function Dashboard() {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([])
  const [user, setUser] = useState<any>(null)
  const [watchedCount, setWatchedCount] = useState({ movies: 0, shows: 0 })
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingEpisode[]>([])
  const [loading, setLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [loadingMoreTrending, setLoadingMoreTrending] = useState(false)
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)
  const [trendingPage, setTrendingPage] = useState(1)
  const [processedTrendingIds, setProcessedTrendingIds] = useState<Set<number>>(new Set())

  // Safely access the onboarding context
  const onboardingContext = useContext(OnboardingContext)
  const userPreferences = onboardingContext?.userPreferences || {}

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

  // Fetch trending content with watchlist status
  const fetchTrendingWithWatchlist = useCallback(
    async (watchlistIds: Set<number>, page = 1, existingIds: Set<number> = new Set()) => {
      try {
        setTrendingLoading(page === 1)
        if (page > 1) setLoadingMoreTrending(true)

        const trendingData = await getTrending("week", "all", page)

        if (!trendingData || !trendingData.results || trendingData.results.length === 0) {
          console.error("No trending data returned from API", trendingData)
          setApiError("Failed to load trending content. Using sample data instead.")

          // Return sample data as fallback
          return sampleTrendingItems.map((item) => ({
            ...item,
            inWatchlist: watchlistIds.has(item.id),
          }))
        }

        // Filter out already processed IDs
        const newResults = trendingData.results.filter((item: any) => !existingIds.has(item.id))

        // Add inWatchlist flag to trending items
        const trendingWithWatchlist = newResults.slice(0, 10).map((item: any) => ({
          id: item.id,
          title: item.title,
          name: item.name,
          poster_path: item.poster_path,
          media_type: item.media_type || (item.title ? "movie" : "tv"),
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          inWatchlist: watchlistIds.has(item.id),
        }))

        return trendingWithWatchlist
      } catch (error) {
        console.error("Error fetching trending content:", error)
        setApiError("Failed to load trending content. Using sample data instead.")

        // Return sample data as fallback
        return sampleTrendingItems.map((item) => ({
          ...item,
          inWatchlist: watchlistIds.has(item.id),
        }))
      } finally {
        setTrendingLoading(false)
        if (page > 1) setLoadingMoreTrending(false)
      }
    },
    [],
  )

  // Fetch user data and basic stats
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Ensure profiles table is set up
        await fetch("/api/setup-profiles")

        setLoading(true)
        setApiError(null)

        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setLoading(false)
          return
        }

        setUser(userData.user)

        // Step 1: Fetch watchlist data first
        const watchlistIdSet = await fetchWatchlistIds()
        setWatchlistIds(watchlistIdSet)

        // Step 2: Fetch stats (watched counts)
        setStatsLoading(true)
        const [movieData, showData] = await Promise.all([
          supabase
            .from("watched_content")
            .select("id", { count: "exact" })
            .eq("user_id", userData.user.id)
            .eq("type", "movie"),

          supabase
            .from("watched_content")
            .select("id", { count: "exact" })
            .eq("user_id", userData.user.id)
            .eq("type", "tv"),
        ])

        setWatchedCount({
          movies: movieData.count || 0,
          shows: showData.count || 0,
        })
        setStatsLoading(false)

        // Step 3: Fetch upcoming episodes (handle case where table might not exist)
        try {
          // Ensure tracked_shows table exists
          await fetch("/api/create-tracked-shows-table")

          const { data: upcomingData, error } = await supabase
            .from("tracked_shows")
            .select("*")
            .eq("user_id", userData.user.id)

          if (!error && upcomingData) {
            setUpcomingCount(upcomingData.length || 0)

            // Process upcoming episodes
            // Filter shows with next_episode_date and sort by date
            const upcomingWithDates = upcomingData
              .filter((show) => show.next_episode_date)
              .sort((a, b) => {
                const dateA = new Date(a.next_episode_date).getTime()
                const dateB = new Date(b.next_episode_date).getTime()
                return dateA - dateB
              })

            setUpcomingEpisodes(upcomingWithDates)
          }
        } catch (error) {
          console.error("Error fetching upcoming episodes:", error)
          setUpcomingCount(0)
          setUpcomingEpisodes([])
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setApiError("Failed to load user data. Please try refreshing the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [fetchWatchlistIds])

  // Fetch trending content separately
  useEffect(() => {
    const fetchTrending = async () => {
      if (watchlistIds.size > 0 || loading === false) {
        const trendingWithWatchlist = await fetchTrendingWithWatchlist(watchlistIds, 1, new Set())
        setTrendingItems(trendingWithWatchlist)

        // Store the IDs of initial trending items
        const initialIds = new Set(trendingWithWatchlist.map((item) => item.id))
        setProcessedTrendingIds(initialIds)
      }
    }

    fetchTrending()
  }, [watchlistIds, loading, fetchTrendingWithWatchlist])

  // Fetch upcoming movies separately
  useEffect(() => {
    const fetchUpcoming = async () => {
      if (watchlistIds.size > 0 || loading === false) {
        try {
          setUpcomingLoading(true)
          const upcomingData = await getUpcoming()

          if (!upcomingData || !upcomingData.results || upcomingData.results.length === 0) {
            console.error("No upcoming movies data returned from API")
            return []
          }

          // Add inWatchlist flag to upcoming movies
          const upcomingWithWatchlist = upcomingData.results.slice(0, 10).map((item: any) => ({
            id: item.id,
            title: item.title || "Untitled",
            poster_path: item.poster_path,
            release_date: item.release_date || new Date().toISOString(),
            inWatchlist: watchlistIds.has(item.id),
          }))

          setUpcomingMovies(upcomingWithWatchlist)
        } catch (error) {
          console.error("Error fetching upcoming movies:", error)
          setUpcomingMovies([])
        } finally {
          setUpcomingLoading(false)
        }
      }
    }

    fetchUpcoming()
  }, [watchlistIds, loading])

  const refreshWatchlistStatus = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const watchlistIdSet = await fetchWatchlistIds()
      setWatchlistIds(watchlistIdSet)

      // Update trending items
      setTrendingItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          inWatchlist: watchlistIdSet.has(item.id),
        })),
      )

      // Update upcoming movies
      setUpcomingMovies((prevMovies) =>
        prevMovies.map((item) => ({
          ...item,
          inWatchlist: watchlistIdSet.has(item.id),
        })),
      )
    } catch (error) {
      console.error("Error refreshing watchlist status:", error)
    }
  }

  const loadMoreTrending = async () => {
    const nextPage = trendingPage + 1
    setTrendingPage(nextPage)

    try {
      // Get more trending items, passing the current processed IDs
      const moreTrendingItems = await fetchTrendingWithWatchlist(watchlistIds, nextPage, processedTrendingIds)

      // Add new items to existing ones
      setTrendingItems([...trendingItems, ...moreTrendingItems])

      // Update processed IDs
      const newProcessedIds = new Set(processedTrendingIds)
      moreTrendingItems.forEach((item) => newProcessedIds.add(item.id))
      setProcessedTrendingIds(newProcessedIds)
    } catch (error) {
      console.error("Error loading more trending items:", error)
    }
  }

  // Get user's name from preferences if available
  const userName = userPreferences?.name || user?.email?.split("@")[0] || "there"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {userName}!</p>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/movies" className="transition-transform hover:scale-[1.02]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Movies Watched</CardTitle>
              <CardDescription>Total movies you've tracked</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{watchedCount.movies}</div>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tv-shows" className="transition-transform hover:scale-[1.02]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>TV Shows Watched</CardTitle>
              <CardDescription>Total shows you've tracked</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{watchedCount.shows}</div>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/upcoming" className="transition-transform hover:scale-[1.02]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Episodes</CardTitle>
              <CardDescription>Shows you're tracking for new episodes</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{upcomingCount}</div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTrendingPage(1)
              setProcessedTrendingIds(new Set())
              fetchTrendingWithWatchlist(watchlistIds, 1, new Set()).then((items) => {
                setTrendingItems(items)
                const initialIds = new Set(items.map((item) => item.id))
                setProcessedTrendingIds(initialIds)
              })
            }}
          >
            Refresh
          </Button>
        </div>

        {trendingLoading ? (
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
        ) : trendingItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {trendingItems.map((item) => (
                <MediaCard
                  key={`${item.media_type || "unknown"}-${item.id}`}
                  id={item.id}
                  title={item.title || item.name || "Untitled"}
                  posterPath={item.poster_path}
                  releaseDate={item.release_date || item.first_air_date}
                  mediaType={item.media_type || "movie"}
                  isWatchlist={item.inWatchlist}
                  onWatchlistChange={refreshWatchlistStatus}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={loadMoreTrending} disabled={loadingMoreTrending} className="min-w-[200px]">
                {loadingMoreTrending ? "Loading..." : "Load More Trending"}
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="mb-4 text-muted-foreground">
                No trending content available. Please try refreshing the data.
              </p>
              <Button onClick={() => fetchTrendingWithWatchlist(watchlistIds).then(setTrendingItems)}>
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {upcomingEpisodes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Upcoming Episodes</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {upcomingEpisodes.slice(0, 5).map((episode) => (
                  <div key={episode.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="w-12 h-16 overflow-hidden rounded">
                      <img
                        src={
                          episode.poster_path
                            ? `https://image.tmdb.org/t/p/w200${episode.poster_path}`
                            : `/placeholder.svg?height=300&width=200`
                        }
                        alt={episode.show_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `/placeholder.svg?height=300&width=200`
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{episode.show_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        New episode on{" "}
                        {new Date(episode.next_episode_date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/tv-shows/${episode.tmdb_id}`}>View</Link>
                    </Button>
                  </div>
                ))}
                {upcomingEpisodes.length > 5 && (
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/dashboard/upcoming">View All ({upcomingEpisodes.length})</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {upcomingLoading ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Coming Soon to Theaters</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array(5)
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
        upcomingMovies &&
        upcomingMovies.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Coming Soon to Theaters</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/search?type=movie&filter=upcoming">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {upcomingMovies.map((movie) => (
                <MediaCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title || "Untitled"}
                  posterPath={movie.poster_path}
                  releaseDate={movie.release_date}
                  mediaType="movie"
                  isWatchlist={movie.inWatchlist}
                  onWatchlistChange={refreshWatchlistStatus}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}
