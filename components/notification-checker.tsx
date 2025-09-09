"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationChecker() {
  const { sendNotification, preferences } = useNotifications()
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  useEffect(() => {
    // Only run if browser notifications are enabled
    if (!preferences.browserNotifications || !preferences.episodeNotifications) {
      return
    }

    const checkUpcomingShows = async () => {
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        // Get today's date
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        // Check if we've already checked today
        if (lastChecked === todayStr) return

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

        // Send notifications for each show
        todayShows.forEach((show) => {
          sendNotification(`New Episode: ${show.show_name}`, {
            body: `A new episode of ${show.show_name} is available today!`,
            icon: show.poster_path ? `https://image.tmdb.org/t/p/w200${show.poster_path}` : "/favicon.ico",
            badge: "/favicon.ico",
            tag: `show-${show.tmdb_id}`, // Prevent duplicate notifications
            data: {
              url: `/dashboard/tv-shows/${show.tmdb_id}`,
            },
            requireInteraction: true,
          })
        })

        // Update last checked date
        setLastChecked(todayStr)

        // Store last checked date in localStorage
        localStorage.setItem("lastNotificationCheck", todayStr)
      } catch (error) {
        console.error("Error checking for upcoming shows:", error)
      }
    }

    // Check on component mount
    checkUpcomingShows()

    // Set up interval to check periodically (every hour)
    const interval = setInterval(checkUpcomingShows, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [preferences, sendNotification, lastChecked])

  // Load last checked date from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLastChecked = localStorage.getItem("lastNotificationCheck")
      if (storedLastChecked) {
        setLastChecked(storedLastChecked)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
