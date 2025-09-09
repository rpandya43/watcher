"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/hooks/use-notifications"
import { Bell, Mail, AlertCircle } from "lucide-react"
// Add the import for NotificationTest
import { NotificationTest } from "@/components/notification-test"

// Update the component to include browser notifications
export default function Settings() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<{
    emailNotifications?: boolean
    episodeReminders?: boolean
    browserNotifications?: boolean
    episodeNotifications?: boolean
    theme?: string
  }>({})

  const {
    supported: notificationsSupported,
    permission: notificationPermission,
    requestPermission,
    updatePreference,
  } = useNotifications()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error("Not authenticated")

        const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

        if (error && error.code !== "PGRST116") throw error

        if (data) {
          setUsername(data.username || "")
          setPreferences(data.preferences || {})
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const updateProfile = async () => {
    try {
      setUpdating(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      // Check if username exists
      if (username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .neq("id", userData.user.id)
          .single()

        if (!checkError && existingUser) {
          throw new Error("Username already taken")
        }
      }

      // Upsert profile
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: userData.user.id,
        username,
        preferences,
        updated_at: new Date().toISOString(),
      })

      if (updateError) throw updateError

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "An error occurred while updating your profile")
    } finally {
      setUpdating(false)
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))

    // If enabling browser notifications, request permission
    if (key === "browserNotifications" && value === true) {
      requestPermission().then((granted) => {
        if (!granted) {
          toast({
            title: "Permission Denied",
            description: "You need to allow notifications in your browser settings.",
            variant: "destructive",
          })
          // Revert the preference change if permission denied
          setPreferences((prev) => ({
            ...prev,
            browserNotifications: false,
          }))
        }
      })
    }

    // Update the preference in the notifications hook
    updatePreference(key, value)
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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a username"
                />
              </div>
              <Button onClick={updateProfile} disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Receive email notifications from WatchTracker</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications || false}
                  onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="episode-reminders">Episode Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified by email when new episodes of your tracked shows are airing
                  </p>
                </div>
                <Switch
                  id="episode-reminders"
                  checked={preferences.episodeReminders || false}
                  disabled={!preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange("episodeReminders", checked)}
                />
              </div>

              {notificationsSupported && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="browser-notifications">Browser Notifications</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser when you're using WatchTracker
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="browser-notifications"
                        checked={preferences.browserNotifications || false}
                        onCheckedChange={(checked) => handlePreferenceChange("browserNotifications", checked)}
                      />
                      {preferences.browserNotifications && <NotificationTest />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="episode-notifications">Episode Launch Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get browser notifications when new episodes of your tracked shows are available
                      </p>
                    </div>
                    <Switch
                      id="episode-notifications"
                      checked={preferences.episodeNotifications || false}
                      disabled={!preferences.browserNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange("episodeNotifications", checked)}
                    />
                  </div>
                </>
              )}

              {!notificationsSupported && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Browser notifications are not supported in your current browser or environment.
                  </AlertDescription>
                </Alert>
              )}

              {notificationPermission === "denied" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Notification permission has been denied. Please update your browser settings to allow notifications
                    from this site.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={updateProfile} disabled={updating}>
                {updating ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  value={supabase.auth.getUser().then(({ data }) => data.user?.email || "")}
                  placeholder="Your email address"
                />
              </div>
              <Button variant="outline" asChild>
                <a href="/dashboard/settings/change-password">Change Password</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
