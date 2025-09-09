"use client"

import { useEffect, useState, useCallback, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { getTrending, getUpcoming } from "@/lib/tmdb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
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

interface UpcomingMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  inWatchlist?: boolean
}

export default function Dashboard() {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([])
  const [user, setUser] = useState<any>(null)
  const [watchedCount, setWatchedCount] = useState({ movies: 0, shows: 0 })
  const [loading, setLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)

  const onboardingContext = useContext(OnboardingContext)
  const userPreferences = onboardingContext?.userPreferences || {}

  // Fetch watchlist IDs
  const fetchWatchlistIds = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return new Set<number>()

      const { data: watchlistData } = await supabase.from("watchlist").select("tmdb_id").eq("user_id", userData.user.id)

      return new Set((watchlistData || []).map((item) => item.tmdb_id))
    } catch (error) {
      console.error("Error fetching watchlist IDs:", error)
      return new Set<number>()
    }
  }, [])

  // Fetch trending content
  const fetchTrending = useCallback(async (watchlistIds: Set<number>) => {
    try {
      setTrendingLoading(true)
      const trendingData = await getTrending("week", "all", 1)

      if (!trendingData?.results) {
        setApiError("Failed to load trending content")
        return []
      }

      const trendingWithWatchlist = trendingData.results.slice(0, 10).map((item: any) => ({
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
      console.error("Error fetching trending:", error)
      setApiError("Failed to load trending content")
      return []
    } finally {
      setTrendingLoading(false)
    }
  }, [])

  // Fetch upcoming movies
  const fetchUpcoming = useCallback(async (watchlistIds: Set<number>) => {
    try {
      const upcomingData = await getUpcoming()

      if (!upcomingData?.results) {
        return []
      }

      const upcomingWithWatchlist = upcomingData.results.slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.title || "Untitled",
        poster_path: item.poster_path,
        release_date: item.release_date || new Date().toISOString(),
        inWatchlist: watchlistIds.has(item.id),
      }))

      return upcomingWithWatchlist
    } catch (error) {
      console.error("Error fetching upcoming movies:", error)
      return []
    }
  }, [])

  // Main data fetch
  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setApiError(null)

        const { data: userData } = await supabase.auth.getUser()
        if (!mounted || !userData.user) return

        setUser(userData.user)

        // Fetch watchlist IDs first
        const watchlistIdSet = await fetchWatchlistIds()
        if (!mounted) return
        setWatchlistIds(watchlistIdSet)

        // Fetch stats
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

        if (!mounted) return

        setWatchedCount({
          movies: movieData.count || 0,
          shows: showData.count || 0,
        })

        // Fetch trending and upcoming
        const [trending, upcoming] = await Promise.all([fetchTrending(watchlistIdSet), fetchUpcoming(watchlistIdSet)])

        if (!mounted) return

        setTrendingItems(trending)
        setUpcomingMovies(upcoming)
      } catch (error) {
        console.error("Error fetching data:", error)
        if (mounted) {
          setApiError("Failed to load data. Please refresh the page.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [fetchWatchlistIds, fetchTrending, fetchUpcoming])

  const refreshWatchlistStatus = async () => {
    const watchlistIdSet = await fetchWatchlistIds()
    setWatchlistIds(watchlistIdSet)

    setTrendingItems((prev) =>
      prev.map((item) => ({
        ...item,
        inWatchlist: watchlistIdSet.has(item.id),
      })),
    )

    setUpcomingMovies((prev) =>
      prev.map((item) => ({
        ...item,
        inWatchlist: watchlistIdSet.has(item.id),
      })),
    )
  }

  const userName = userPreferences?.name || user?.email?.split("@")[0] || "there"

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

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
              <div className="text-3xl font-bold">{watchedCount.movies}</div>
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
              <div className="text-3xl font-bold">{watchedCount.shows}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/watchlist" className="transition-transform hover:scale-[1.02]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Watchlist</CardTitle>
              <CardDescription>Items in your watchlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{watchlistIds.size}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {trendingItems.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                id={item.id}
                title={item.title || item.name || "Untitled"}
                posterPath={item.poster_path}
                releaseDate={item.release_date || item.first_air_date}
                mediaType={item.media_type}
                isWatchlist={item.inWatchlist}
                onWatchlistChange={refreshWatchlistStatus}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="mb-4 text-muted-foreground">No trending content available.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {upcomingMovies.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {upcomingMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                releaseDate={movie.release_date}
                mediaType="movie"
                isWatchlist={movie.inWatchlist}
                onWatchlistChange={refreshWatchlistStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
