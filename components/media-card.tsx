"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, Star } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface MediaCardProps {
  id: number
  title: string
  posterPath: string | null
  releaseDate?: string
  mediaType: "movie" | "tv"
  rating?: number
  isWatchlist?: boolean
  onWatchlistChange?: () => void
  showWatchlistButton?: boolean
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
  showWatchlistButton = true,
}: MediaCardProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(isWatchlist)
  const [isLoading, setIsLoading] = useState(false)

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage your watchlist.",
          variant: "destructive",
        })
        return
      }

      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase.from("watchlist").delete().eq("user_id", userData.user.id).eq("tmdb_id", id)

        if (error) throw error

        setIsInWatchlist(false)
        toast({
          title: "Removed from watchlist",
          description: `${title} has been removed from your watchlist.`,
        })
      } else {
        // Add to watchlist
        const { error } = await supabase.from("watchlist").insert({
          user_id: userData.user.id,
          tmdb_id: id,
          title,
          poster_path: posterPath,
          media_type: mediaType,
          release_date: releaseDate,
          added_at: new Date().toISOString(),
        })

        if (error) throw error

        setIsInWatchlist(true)
        toast({
          title: "Added to watchlist",
          description: `${title} has been added to your watchlist.`,
        })
      }

      // Call the callback to refresh parent component
      if (onWatchlistChange) {
        onWatchlistChange()
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).getFullYear().toString()
    } catch {
      return ""
    }
  }

  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : `/placeholder.svg?height=750&width=500&text=${encodeURIComponent(title)}`

  return (
    <Link href={`/dashboard/${mediaType === "movie" ? "movies" : "tv-shows"}/${id}`}>
      <Card className="group overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <div className="relative">
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={posterUrl || "/placeholder.svg"}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `/placeholder.svg?height=750&width=500&text=${encodeURIComponent(title)}`
              }}
            />
          </div>

          {/* Watchlist button overlay */}
          {showWatchlistButton && (
            <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                size="sm"
                variant={isInWatchlist ? "default" : "secondary"}
                className="h-8 w-8 rounded-full p-0"
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
            </div>
          )}

          {/* Rating badge */}
          {rating && rating > 0 && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
              </Badge>
            </div>
          )}

          {/* Media type badge */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="text-xs">
              {mediaType === "movie" ? "Movie" : "TV Show"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{title}</h3>
          {releaseDate && <p className="text-xs text-muted-foreground">{formatDate(releaseDate)}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}
