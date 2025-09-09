"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type NotificationPermission = "default" | "granted" | "denied"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [supported, setSupported] = useState(false)
  const [preferences, setPreferences] = useState<{
    browserNotifications?: boolean
    episodeNotifications?: boolean
  }>({})

  // Check if notifications are supported
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator)

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission as NotificationPermission)
    }
  }, [])

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase.from("profiles").select("preferences").eq("id", userData.user.id).single()

      if (data?.preferences) {
        setPreferences({
          browserNotifications: data.preferences.browserNotifications,
          episodeNotifications: data.preferences.episodeNotifications,
        })
      }
    }

    loadPreferences()
  }, [])

  // Request permission
  const requestPermission = async () => {
    if (!supported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      // Update user preferences if permission granted
      if (result === "granted") {
        await updatePreference("browserNotifications", true)
      }

      return result === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  // Update user preference
  const updatePreference = async (key: string, value: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return false

      // Get current preferences
      const { data } = await supabase.from("profiles").select("preferences").eq("id", userData.user.id).single()

      const currentPreferences = data?.preferences || {}

      // Update preferences
      const updatedPreferences = {
        ...currentPreferences,
        [key]: value,
      }

      // Save to database
      await supabase.from("profiles").update({ preferences: updatedPreferences }).eq("id", userData.user.id)

      // Update local state
      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }))

      return true
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      return false
    }
  }

  // Send a notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!supported || permission !== "granted" || !preferences.browserNotifications) {
      return false
    }

    try {
      const notification = new Notification(title, options)
      return true
    } catch (error) {
      console.error("Error sending notification:", error)
      return false
    }
  }

  return {
    supported,
    permission,
    preferences,
    requestPermission,
    updatePreference,
    sendNotification,
  }
}
