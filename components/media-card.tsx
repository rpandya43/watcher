"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, Calendar, Plus, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface MediaCardProps {
  id: number
  title: string
  overview: string
  posterPath: string | null
  voteAverage: number
  releaseDate: string
  mediaType: "movie" | "tv"
  isInWatchlist?: boolean
}

export function MediaCard({
  id,
  title,
  overview,
  posterPath,
  voteAverage,
  releaseDate,
  mediaType,
  isInWatchlist = false,
}: MediaCardProps) {
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist)
  const [loading, setLoading] = useState(false)

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add items to your watchlist",
          variant: "destructive",
        })
        return
      }

      if (inWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", id)
          .eq("media_type", mediaType)

        if (error) throw error

        setInWatchlist(false)
        toast({
          title: "Removed from watchlist",
          description: `${title} has been removed from your watchlist`,
        })
      } else {
        // Add to watchlist
        const { error } = await supabase.from("watchlist").insert({
          user_id: user.id,
          tmdb_id: id,
          title,
          overview,
          poster_path: posterPath,
          vote_average: voteAverage,
          release_date: releaseDate,
          media_type: mediaType,
        })

        if (error) throw error

        setInWatchlist(true)
        toast({
          title: "Added to watchlist",
          description: `${title} has been added to your watchlist`,
        })
      }
    } catch (error: any) {
      console.error("Error toggling watchlist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update watchlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA"
    return new Date(dateString).getFullYear().toString()
  }

  const formatRating = (rating: number) => {
    return (rating / 2).toFixed(1)
  }

  const detailsPath = mediaType === "movie" ? `/dashboard/movies/${id}` : `/dashboard/tv-shows/${id}`

  return (
    <Link href={detailsPath}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "/placeholder.svg?height=300&width=200"}
            alt={title}
            className="w-full h-[300px] object-cover transition-transform duration-200 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button variant="secondary" size="sm" onClick={toggleWatchlist} disabled={loading} className="mr-2">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : inWatchlist ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
          <Badge variant="secondary" className="absolute top-2 left-2 bg-black/70 text-white">
            {mediaType === "movie" ? "Movie" : "TV Show"}
          </Badge>
          {inWatchlist && (
            <Badge variant="default" className="absolute top-2 right-2 bg-green-600 text-white">
              <Heart className="w-3 h-3 mr-1 fill-current" />
              Watchlist
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{title}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(releaseDate)}
            </div>
            <div className="flex items-center">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {formatRating(voteAverage)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">{overview || "No description available."}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
