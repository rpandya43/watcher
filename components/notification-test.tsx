"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { Bell } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function NotificationTest() {
  const { sendNotification, permission, supported, preferences } = useNotifications()

  const handleTestNotification = () => {
    if (!supported) {
      toast({
        title: "Not Supported",
        description: "Browser notifications are not supported in your current browser.",
        variant: "destructive",
      })
      return
    }

    if (permission !== "granted") {
      toast({
        title: "Permission Required",
        description: "You need to allow notifications in your browser settings.",
        variant: "destructive",
      })
      return
    }

    if (!preferences.browserNotifications) {
      toast({
        title: "Notifications Disabled",
        description: "You need to enable browser notifications in your settings.",
        variant: "destructive",
      })
      return
    }

    const success = sendNotification("Test Notification", {
      body: "This is a test notification from WatchTracker. If you can see this, notifications are working correctly!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
    })

    if (success) {
      toast({
        title: "Notification Sent",
        description: "Check your browser notifications to confirm it's working.",
      })
    } else {
      toast({
        title: "Notification Failed",
        description: "Failed to send test notification. Please check your browser settings.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestNotification}
      disabled={!supported || permission !== "granted" || !preferences.browserNotifications}
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      Test Notification
    </Button>
  )
}
