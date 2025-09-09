"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export function TodayShowChecker() {
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only check once per session
    if (checked) return

    const checkTodayShows = async () => {
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        // Get today's date
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        // Get tracked shows with episodes airing today
        const { data: shows, error } = await supabase
          .from("tracked_shows")
          .select("*")
          .eq("user_id", userData.user.id)
          .not("next_episode_date", "is", null)

        if (error) throw error

        // Filter shows airing today
        const todayShows =
          shows?.filter((show) => {
            const episodeDate = show.next_episode_date?.split("T")[0]
            return episodeDate === todayStr
          }) || []

        // If there are shows airing today, show a toast notification
        if (todayShows.length > 0) {
          toast({
            title: `${todayShows.length} show${todayShows.length > 1 ? "s" : ""} airing today!`,
            description: (
              <div className="mt-2">
                <p className="mb-2">{todayShows.map((show) => show.show_name).join(", ")}</p>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => router.push("/dashboard/upcoming")}>
                  <Bell className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            ),
            duration: 10000, // 10 seconds
          })
        }

        setChecked(true)
      } catch (error) {
        console.error("Error checking for today shows:", error)
      }
    }

    // Check after a short delay to allow the page to load
    const timer = setTimeout(checkTodayShows, 2000)

    return () => clearTimeout(timer)
  }, [checked, router])

  // This component doesn't render anything
  return null
}
