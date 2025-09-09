"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { MediaCard } from "@/components/media-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search } from "lucide-react"

interface WatchlistItem {
  id: number
  tmdb_id: number
  title: string
  poster_path: string | null
  type: "movie" | "tv"
  added_at: string
  release_date?: string
  genre?: string
  language?: string
}

export default function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv" | "coming-soon">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"added" | "title" | "release_date" | "genre">("added")
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")

  const fetchWatchlist = async () => {
    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("added_at", { ascending: false })

      if (error) throw error

      // Extract unique genres and languages
      const uniqueGenres = new Set<string>()
      const uniqueLanguages = new Set<string>()

      // Add release_date info for movies that are coming soon
      const today = new Date()
      const enrichedData = await Promise.all(
        (data || []).map(async (item) => {
          // For demo purposes, let's add some sample genres and languages
          // In a real app, you would fetch this data from TMDB
          const sampleGenres = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance"]
          const sampleLanguages = ["English", "Spanish", "French", "Japanese", "Korean"]

          const genre = sampleGenres[Math.floor(Math.random() * sampleGenres.length)]
          const language = sampleLanguages[Math.floor(Math.random() * sampleLanguages.length)]

          uniqueGenres.add(genre)
          uniqueLanguages.add(language)

          // For movies, try to get the actual release date from TMDB
          let releaseDate = undefined
          if (item.type === "movie" || item.type === "tv") {
            try {
              const response = await fetch(`/api/tmdb?endpoint=details&type=${item.type}&id=${item.tmdb_id}`)
              if (response.ok) {
                const details = await response.json()
                releaseDate = item.type === "movie" ? details.release_date : details.first_air_date

                // If the release date is in the future, keep it
                const releaseDateTime = new Date(releaseDate).getTime()
                const todayTime = today.getTime()
                if (releaseDateTime <= todayTime) {
                  releaseDate = undefined
                }
              }
            } catch (error) {
              console.error(`Error fetching details for ${item.type} ${item.tmdb_id}:`, error)
            }
          }

          return {
            ...item,
            genre,
            language,
            release_date: releaseDate,
          }
        }),
      )

      setGenres(Array.from(uniqueGenres))
      setLanguages(Array.from(uniqueLanguages))
      setWatchlistItems(enrichedData)
    } catch (err) {
      console.error("Error fetching watchlist:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const handleWatchlistChange = () => {
    fetchWatchlist()
  }

  // Filter items based on active tab, search term, and filters
  const filteredItems = watchlistItems.filter((item) => {
    // First filter by tab
    if (activeTab === "movies" && item.type !== "movie") return false
    if (activeTab === "tv" && item.type !== "tv") return false
    if (activeTab === "coming-soon") {
      if (!item.release_date) return false
      const releaseDate = new Date(item.release_date)
      const today = new Date()
      if (releaseDate <= today) return false
    }

    // Then filter by search term
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Then filter by genre
    if (selectedGenre !== "all" && item.genre !== selectedGenre) {
      return false
    }

    // Then filter by language
    if (selectedLanguage !== "all" && item.language !== selectedLanguage) {
      return false
    }

    return true
  })

  // Sort the filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    } else if (sortBy === "release_date") {
      if (!a.release_date && !b.release_date) return 0
      if (!a.release_date) return 1
      if (!b.release_date) return -1
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    } else if (sortBy === "genre") {
      return (a.genre || "").localeCompare(b.genre || "")
    } else {
      // Default sort by added_at
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    }
  })

  // Group coming soon items
  const comingSoonItems = watchlistItems.filter((item) => {
    if (!item.release_date) return false
    const releaseDate = new Date(item.release_date)
    const today = new Date()
    return releaseDate > today
  })

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
          <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground">Movies and TV shows you want to watch</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/movies">Browse Movies</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/search">Find Content</Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added">Date Added</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="release_date">Release Date</SelectItem>
              <SelectItem value="genre">Genre</SelectItem>
            </SelectContent>
          </Select>

          {genres.length > 0 && (
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {languages.length > 0 && (
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Coming Soon Section - Always visible at the top if there are items */}
      {comingSoonItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {comingSoonItems.map((item) => (
              <MediaCard
                key={item.id}
                id={item.tmdb_id}
                title={item.title}
                posterPath={item.poster_path}
                mediaType={item.type}
                isWatchlist={true}
                onWatchlistChange={handleWatchlistChange}
                releaseDate={item.release_date}
              />
            ))}
          </div>
        </div>
      )}

      <Tabs
        defaultValue="all"
        onValueChange={(value) => setActiveTab(value as "all" | "movies" | "tv" | "coming-soon")}
      >
        <TabsList>
          <TabsTrigger value="all">All ({watchlistItems.length})</TabsTrigger>
          <TabsTrigger value="movies">
            Movies ({watchlistItems.filter((item) => item.type === "movie").length})
          </TabsTrigger>
          <TabsTrigger value="tv">TV Shows ({watchlistItems.filter((item) => item.type === "tv").length})</TabsTrigger>
          <TabsTrigger value="coming-soon">Coming Soon ({comingSoonItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">Your watchlist is empty</h3>
                <p className="mb-4 text-muted-foreground">
                  Add movies and TV shows to your watchlist to keep track of what you want to watch.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search">Find Content</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.tmdb_id}
                  title={item.title}
                  posterPath={item.poster_path}
                  mediaType={item.type}
                  isWatchlist={true}
                  onWatchlistChange={handleWatchlistChange}
                  releaseDate={item.release_date}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movies" className="mt-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No movies in your watchlist</h3>
                <p className="mb-4 text-muted-foreground">
                  Add movies to your watchlist to keep track of what you want to watch.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=movie">Browse Movies</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.tmdb_id}
                  title={item.title}
                  posterPath={item.poster_path}
                  mediaType={item.type}
                  isWatchlist={true}
                  onWatchlistChange={handleWatchlistChange}
                  releaseDate={item.release_date}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tv" className="mt-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No TV shows in your watchlist</h3>
                <p className="mb-4 text-muted-foreground">
                  Add TV shows to your watchlist to keep track of what you want to watch.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search?type=tv">Browse TV Shows</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.tmdb_id}
                  title={item.title}
                  posterPath={item.poster_path}
                  mediaType={item.type}
                  isWatchlist={true}
                  onWatchlistChange={handleWatchlistChange}
                  releaseDate={item.release_date}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coming-soon" className="mt-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="mb-2 text-xl font-medium">No upcoming releases in your watchlist</h3>
                <p className="mb-4 text-muted-foreground">
                  Add upcoming movies and TV shows to your watchlist to keep track of future releases.
                </p>
                <Button asChild>
                  <Link href="/dashboard/search">Find Content</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.tmdb_id}
                  title={item.title}
                  posterPath={item.poster_path}
                  mediaType={item.type}
                  isWatchlist={true}
                  onWatchlistChange={handleWatchlistChange}
                  releaseDate={item.release_date}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
