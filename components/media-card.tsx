"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaCardProps {
  id: number
  title: string
  posterPath: string | null
  releaseDate?: string
  mediaType: "movie" | "tv"
  rating?: number
  isWatchlist?: boolean
  onWatchlistChange?: () => void
  className?: string
}

export function MediaCard({
  id,
  title,
  posterPath,
  releaseDate,
  mediaType,
  rating,
  isWatchlist = false,
  onWatchlistChange,
  className,
}: MediaCardProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(isWatchlist)
  const [isLoading, setIsLoading] = useState(false)
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
        const { data: session } = await supabase.auth.getSession()
        if (!session?.user || !isMounted) return

        const { data } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("tmdb_id", id)
          .eq("media_type", mediaType)
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

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        console.error("User not authenticated")
        return
      }

      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("tmdb_id", id)

        if (error) throw error
        setIsInWatchlist(false)
      } else {
        // Add to watchlist
        const { error } = await supabase.from("watchlist").insert({
          user_id: session.user.id,
          tmdb_id: id,
          title,
          poster_path: posterPath,
          media_type: mediaType,
          release_date: releaseDate,
        })

        if (error) throw error
        setIsInWatchlist(true)
      }

      onWatchlistChange?.()
    } catch (error) {
      console.error("Error updating watchlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Date(dateString).getFullYear().toString()
  }

  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : `/placeholder.svg?height=750&width=500&text=${encodeURIComponent(title)}`

  return (
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg", className)}>
      <Link href={`/dashboard/${mediaType === "movie" ? "movies" : "tv-shows"}/${id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl || "/placeholder.svg"}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `/placeholder.svg?height=750&width=500&text=${encodeURIComponent(title)}`
            }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="secondary">
              View Details
            </Button>
          </div>
          <Button
            size="icon"
            variant={isInWatchlist ? "default" : "secondary"}
            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleWatchlistToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isInWatchlist ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
          {rating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs text-white">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">{title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDate(releaseDate)}</span>
          <Badge variant="outline" className="text-xs">
            {mediaType === "movie" ? "Movie" : "TV"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
