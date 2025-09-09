"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { searchTMDB, getGenres, discoverByGenre } from "@/lib/tmdb"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, MinusCircle, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface SearchResult {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  overview: string
  inWatchlist?: boolean
}

interface Genre {
  id: number
  name: string
}

export default function Search() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState<"movie" | "tv">("movie")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [genres, setGenres] = useState<Genre[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await getGenres(searchType)
        setGenres(data.genres || [])
      } catch (error) {
        console.error("Error fetching genres:", error)
      }
    }

    fetchGenres()
  }, [searchType])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      let data

      // If query is empty but genre is selected, do a genre-only search
      if (!query.trim() && selectedGenre !== "all") {
        data = await discoverByGenre(searchType, selectedGenre)
      } else if (query.trim()) {
        // If query exists, do a normal search with optional genre filter
        data = await searchTMDB(query, searchType, selectedGenre !== "all" ? selectedGenre : undefined)
      } else {
        // If both query and genre are empty/all, show popular items
        data = { results: [] }
      }

      // Check which items are in the watchlist
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("tmdb_id")
          .eq("user_id", userData.user.id)
          .eq("type", searchType)

        const watchlistIds = new Set((watchlistData || []).map((item) => item.tmdb_id))

        // Add inWatchlist flag to each result
        const resultsWithWatchlist = (data.results || []).map((item: SearchResult) => ({
          ...item,
          inWatchlist: watchlistIds.has(item.id),
        }))

        setResults(resultsWithWatchlist)
      } else {
        setResults(data.results || [])
      }

      setSearched(true)
    } catch (error) {
      console.error("Error searching TMDB:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenreChange = async (value: string) => {
    setSelectedGenre(value)

    // If no query is entered, automatically search by genre when genre changes
    if (!query.trim()) {
      setLoading(true)
      try {
        let data
        if (value !== "all") {
          data = await discoverByGenre(searchType, value)

          // Check which items are in the watchlist
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            const { data: watchlistData } = await supabase
              .from("watchlist")
              .select("tmdb_id")
              .eq("user_id", userData.user.id)
              .eq("type", searchType)

            const watchlistIds = new Set((watchlistData || []).map((item) => item.tmdb_id))

            // Add inWatchlist flag to each result
            const resultsWithWatchlist = (data.results || []).map((item: SearchResult) => ({
              ...item,
              inWatchlist: watchlistIds.has(item.id),
            }))

            setResults(resultsWithWatchlist)
          } else {
            setResults(data.results || [])
          }

          setSearched(true)
        } else {
          data = { results: [] }
          setSearched(false)
          return
        }
      } catch (error) {
        console.error("Error discovering by genre:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTypeChange = (value: string) => {
    setSearchType(value as "movie" | "tv")
    setSelectedGenre("all")
    setResults([])
    setSearched(false)
  }

  const addToWatchlist = async (item: SearchResult) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`watchlist-${item.id}`]: true }))

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to add items to your watchlist",
          variant: "destructive",
        })
        return
      }

      // Ensure watchlist table exists
      await fetch("/api/create-watchlist-table")

      const { error } = await supabase.from("watchlist").insert({
        user_id: userData.user.id,
        tmdb_id: item.id,
        type: searchType,
        title: item.title || item.name || "",
        poster_path: item.poster_path,
      })

      if (error) throw error

      toast({
        title: "Added to watchlist",
        description: `${item.title || item.name} has been added to your watchlist`,
      })

      // Update the local state to reflect the change
      setResults(results.map((result) => (result.id === item.id ? { ...result, inWatchlist: true } : result)))
    } catch (error) {
      console.error("Error adding to watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [`watchlist-${item.id}`]: false }))
    }
  }

  const removeFromWatchlist = async (item: SearchResult) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`watchlist-${item.id}`]: true }))

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to manage your watchlist",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("tmdb_id", item.id)
        .eq("type", searchType)

      if (error) throw error

      toast({
        title: "Removed from watchlist",
        description: `${item.title || item.name} has been removed from your watchlist`,
      })

      // Update the local state to reflect the change
      setResults(results.map((result) => (result.id === item.id ? { ...result, inWatchlist: false } : result)))
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [`watchlist-${item.id}`]: false }))
    }
  }

  const markAsWatched = async (item: SearchResult) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`watched-${item.id}`]: true }))

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to mark items as watched",
          variant: "destructive",
        })
        return
      }

      // Add to watched content
      const { error } = await supabase.from("watched_content").insert({
        user_id: userData.user.id,
        tmdb_id: item.id,
        type: searchType,
        title: item.title || item.name || "",
        poster_path: item.poster_path,
      })

      if (error) throw error

      // If it was in watchlist, remove it
      if (item.inWatchlist) {
        await removeFromWatchlist(item)
      }

      toast({
        title: "Marked as watched",
        description: `${item.title || item.name} has been marked as watched`,
      })
    } catch (error) {
      console.error("Error marking as watched:", error)
      toast({
        title: "Error",
        description: "Failed to mark as watched. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [`watched-${item.id}`]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find movies and TV shows to add to your watchlist</p>
      </div>

      <Tabs defaultValue="movie" onValueChange={handleTypeChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="movie">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV Shows</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={`Search for ${searchType === "movie" ? "movies" : "TV shows"}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />

            <Select value={selectedGenre} onValueChange={handleGenreChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>

          {searched && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results found</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex h-full overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:bg-accent/20 group relative"
              >
                <div className="w-1/3">
                  <Link href={`/dashboard/${searchType === "movie" ? "movies" : "tv-shows"}/${result.id}`}>
                    <img
                      src={
                        result.poster_path
                          ? `https://image.tmdb.org/t/p/w200${result.poster_path}`
                          : `/placeholder.svg?height=300&width=200`
                      }
                      alt={result.title || result.name || "Media poster"}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                </div>
                <div className="w-2/3 p-4 flex flex-col">
                  <Link href={`/dashboard/${searchType === "movie" ? "movies" : "tv-shows"}/${result.id}`}>
                    <h3 className="font-medium">{result.title || result.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {result.release_date || result.first_air_date || "Unknown date"}
                    </p>
                    <p className="text-sm line-clamp-3 mb-4">{result.overview || "No overview available"}</p>
                  </Link>

                  <div className="mt-auto flex gap-2">
                    {result.inWatchlist ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => removeFromWatchlist(result)}
                        disabled={actionLoading[`watchlist-${result.id}`]}
                      >
                        <MinusCircle className="mr-2 h-4 w-4" />
                        {actionLoading[`watchlist-${result.id}`] ? "Removing..." : "Remove"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => addToWatchlist(result)}
                        disabled={actionLoading[`watchlist-${result.id}`]}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {actionLoading[`watchlist-${result.id}`] ? "Adding..." : "Watchlist"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => markAsWatched(result)}
                      disabled={actionLoading[`watched-${result.id}`]}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {actionLoading[`watched-${result.id}`] ? "Marking..." : "Watched"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  )
}
