"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getDetails } from "@/lib/tmdb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface TrackedShow {
  id: number
  tmdb_id: number
  user_id: string
  show_name: string
  next_episode_date: string | null
  poster_path: string | null
}

export default function UpcomingEpisodes() {
  const [trackedShows, setTrackedShows] = useState<TrackedShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [lastRemovedShow, setLastRemovedShow] = useState<TrackedShow | null>(null)

  useEffect(() => {
    const fetchTrackedShows = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error("Not authenticated")

        const { data, error } = await supabase.from("tracked_shows").select("*").eq("user_id", userData.user.id)

        if (error) throw error

        // Fetch additional details for each show if needed
        const showsWithDetails = await Promise.all(
          (data || []).map(async (show) => {
            try {
              const details = await getDetails(show.tmdb_id.toString(), "tv")
              return {
                ...show,
                poster_path: details.poster_path,
                next_episode_date: details.next_episode_to_air?.air_date || null,
              }
            } catch (e) {
              console.error(`Error fetching details for show ${show.tmdb_id}:`, e)
              return show
            }
          }),
        )

        setTrackedShows(showsWithDetails)
      } catch (err) {
        console.error("Error fetching tracked shows:", err)
        setError("Failed to load your tracked shows. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTrackedShows()
  }, [])

  const removeTrackedShow = async (show: TrackedShow) => {
    try {
      setLastRemovedShow(show)

      const { error } = await supabase.from("tracked_shows").delete().eq("id", show.id)

      if (error) throw error

      setTrackedShows(trackedShows.filter((s) => s.id !== show.id))
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 5000)
    } catch (err) {
      console.error("Error removing tracked show:", err)
      setError("Failed to remove show from tracking. Please try again.")
    }
  }

  const undoRemove = async () => {
    if (!lastRemovedShow) return

    try {
      const { id, ...showData } = lastRemovedShow
      // Remove next_episode_date as it's not in the database schema
      const { next_episode_date, ...dataToInsert } = showData

      const { error, data } = await supabase.from("tracked_shows").insert(dataToInsert).select()

      if (error) throw error

      setTrackedShows([...trackedShows, data[0] as TrackedShow])
      toast({
        title: "Show restored",
        description: `${lastRemovedShow.show_name} has been added back to your tracked shows.`,
      })
    } catch (err) {
      console.error("Error restoring tracked show:", err)
      toast({
        title: "Error",
        description: "Failed to restore the show. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowUndo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upcoming Episodes</h1>
        <p className="text-muted-foreground">Track new episodes from your favorite shows</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {trackedShows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="mb-2">You're not tracking any shows yet.</p>
              <Button asChild>
                <a href="/dashboard/tv-shows">Browse TV Shows</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trackedShows.map((show) => (
            <Card key={show.id}>
              <div className="flex overflow-hidden">
                <div className="w-1/3">
                  <img
                    src={
                      show.poster_path
                        ? `https://image.tmdb.org/t/p/w200${show.poster_path}`
                        : `/placeholder.svg?height=300&width=200`
                    }
                    alt={show.show_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="w-2/3 flex flex-col">
                  <CardHeader className="p-3">
                    <CardTitle className="text-lg">{show.show_name}</CardTitle>
                    <CardDescription>
                      {show.next_episode_date
                        ? `Next episode: ${new Date(show.next_episode_date).toLocaleDateString()}`
                        : "No upcoming episodes announced"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 mt-auto">
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/tv-shows/${show.tmdb_id}`}>View Details</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeTrackedShow(show)}>
                        Untrack
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showUndo && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg border animate-in slide-in-from-bottom-10">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span>Show untracked.</span>
          <Button variant="outline" size="sm" onClick={undoRemove}>
            Undo
          </Button>
        </div>
      )}
    </div>
  )
}
