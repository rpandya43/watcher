"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, CheckCircle, Eye, Trash2 } from "lucide-react"

interface MediaCardProps {
  id: number
  title: string
  posterPath: string | null
  releaseDate?: string
  mediaType: "movie" | "tv"
  isWatchlist?: boolean
  onWatchlistChange?: () => void
}

export function MediaCard({
  id,
  title,
  posterPath,
  releaseDate,
  mediaType,
  isWatchlist = false,
  onWatchlistChange,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)
  const [isRemovingFromWatchlist, setIsRemovingFromWatchlist] = useState(false)
  const [isMarkingAsWatched, setIsMarkingAsWatched] = useState(false)
  const [lastRemovedItem, setLastRemovedItem] = useState<any>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(isWatchlist)
  const [isInWatchlist, setIsInWatchlist] = useState(isWatchlist)
  const [imageError, setImageError] = useState(false)

  // Check if the item is in the watchlist when the component mounts
  useEffect(() => {
    // If isWatchlist prop is explicitly provided, use that value
    if (typeof isWatchlist !== "undefined") {
      setIsInWatchlist(isWatchlist)
      return
    }

    // Otherwise check the database, but only if we need to
    let isMounted = true
    const checkWatchlistStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user || !isMounted) return

        const { data } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", id)
          .eq("type", mediaType)
          .single()

        if (isMounted) {
          setIsInWatchlist(!!data)
        }
      } catch (error) {
        // If error is not found, it's not in watchlist
        if (isMounted) {
          setIsInWatchlist(false)
        }
      }
    }

    checkWatchlistStatus()

    return () => {
      isMounted = false
    }
  }, [id, mediaType, isWatchlist])

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

  const addToWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsAddingToWatchlist(true)

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
      await ensureWatchlistTable()

      const { error, data } = await supabase
        .from("watchlist")
        .insert({
          user_id: userData.user.id,
          tmdb_id: id,
          type: mediaType,
          title,
          poster_path: posterPath,
        })
        .select()

      if (error) throw error

      toast({
        title: "Added to watchlist",
        description: `${title} has been added to your watchlist`,
      })

      setInWatchlist(true)
      setIsInWatchlist(true)

      if (onWatchlistChange) {
        onWatchlistChange()
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingToWatchlist(false)
    }
  }

  const removeFromWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsRemovingFromWatchlist(true)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to manage your watchlist",
          variant: "destructive",
        })
        return
      }

      // First get the item data for potential undo
      const { data: itemData } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("tmdb_id", id)
        .eq("type", mediaType)
        .single()

      if (itemData) {
        setLastRemovedItem(itemData)
      }

      // Remove from watchlist
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("tmdb_id", id)
        .eq("type", mediaType)

      if (error) throw error

      toast({
        title: "Removed from watchlist",
        description: `${title} has been removed from your watchlist`,
      })

      setInWatchlist(false)
      setIsInWatchlist(false)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 5000)

      if (onWatchlistChange) {
        onWatchlistChange()
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingFromWatchlist(false)
    }
  }

  const markAsWatched = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsMarkingAsWatched(true)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to mark items as watched",
          variant: "destructive",
        })
        return
      }

      // First, add to watched content
      const { error: watchedError } = await supabase.from("watched_content").insert({
        user_id: userData.user.id,
        tmdb_id: id,
        type: mediaType,
        title,
        poster_path: posterPath,
      })

      if (watchedError) throw watchedError

      // Then, if it's in watchlist, remove it
      if (inWatchlist) {
        // First get the item data for potential undo
        const { data: itemData } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", id)
          .eq("type", mediaType)
          .single()

        if (itemData) {
          setLastRemovedItem(itemData)
        }

        const { error: removeError } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("tmdb_id", id)
          .eq("type", mediaType)

        if (removeError) throw removeError

        setInWatchlist(false)
        setIsInWatchlist(false)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }

      toast({
        title: "Marked as watched",
        description: `${title} has been marked as watched`,
      })

      if (onWatchlistChange) {
        onWatchlistChange()
      }
    } catch (error) {
      console.error("Error marking as watched:", error)
      toast({
        title: "Error",
        description: "Failed to mark as watched. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAsWatched(false)
    }
  }

  const undoRemove = async () => {
    if (!lastRemovedItem) return

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Remove the id to avoid conflicts
      const { id: itemId, ...itemData } = lastRemovedItem

      // Add back to watchlist
      const { error } = await supabase.from("watchlist").insert(itemData)

      if (error) throw error

      toast({
        title: "Item restored",
        description: `${title} has been added back to your watchlist`,
      })

      setInWatchlist(true)
      setIsInWatchlist(true)
      setShowUndo(false)

      if (onWatchlistChange) {
        onWatchlistChange()
      }
    } catch (error) {
      console.error("Error restoring watchlist item:", error)
      toast({
        title: "Error",
        description: "Failed to restore item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <>
      <Link href={`/dashboard/${mediaType === "movie" ? "movies" : "tv-shows"}/${id}`}>
        <div
          className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg hover:bg-accent/20 group relative hover:scale-[1.03] hover:border-primary/50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {releaseDate && new Date(releaseDate) > new Date() && (
            <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-md z-10">
              {new Date(releaseDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
          )}
          <div className="aspect-[2/3] relative">
            <img
              src={
                posterPath && !imageError
                  ? `https://image.tmdb.org/t/p/w500${posterPath}`
                  : `/placeholder.svg?height=450&width=300`
              }
              alt={title || "Media poster"}
              className="object-cover w-full h-full transition-transform group-hover:brightness-[0.85]"
              loading="lazy"
              onError={handleImageError}
            />

            {isHovered && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2 transition-opacity duration-200 animate-in fade-in">
                {!isInWatchlist ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-white hover:text-white hover:bg-primary/20"
                    onClick={addToWatchlist}
                    disabled={isAddingToWatchlist}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isAddingToWatchlist ? "Adding..." : "Add to Watchlist"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-white hover:text-white hover:bg-primary/20"
                      onClick={removeFromWatchlist}
                      disabled={isRemovingFromWatchlist}
                    >
                      <MinusCircle className="mr-2 h-4 w-4" />
                      {isRemovingFromWatchlist ? "Removing..." : "Remove from Watchlist"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-white hover:text-white hover:bg-primary/20"
                      onClick={markAsWatched}
                      disabled={isMarkingAsWatched}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {isMarkingAsWatched ? "Marking..." : "Mark as Watched"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="p-2">
            <h3 className="font-medium truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {releaseDate ? new Date(releaseDate).getFullYear() : "Unknown"}
            </p>
          </div>

          {isInWatchlist && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </Link>

      {showUndo && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg border animate-in slide-in-from-bottom-10">
          <Trash2 className="h-5 w-5 text-primary" />
          <span>Removed from watchlist.</span>
          <Button variant="outline" size="sm" onClick={undoRemove}>
            Undo
          </Button>
        </div>
      )}
    </>
  )
}
