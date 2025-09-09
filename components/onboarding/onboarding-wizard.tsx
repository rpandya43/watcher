"use client"

import { useState } from "react"
import { useOnboarding } from "./onboarding-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"

export function OnboardingWizard() {
  const { currentStep, nextStep, prevStep, skipOnboarding, completeOnboarding, setUserPreference, userPreferences } =
    useOnboarding()
  const { setTheme } = useTheme()
  const [name, setName] = useState(userPreferences.name || "")

  const handleThemeSelect = (theme: string) => {
    setUserPreference("theme", theme)
    setTheme(theme)
  }

  const handleNameSubmit = () => {
    setUserPreference("name", name)
    nextStep()
  }

  const handleNotificationSettings = (emailNotifications: boolean, browserNotifications: boolean) => {
    setUserPreference("emailNotifications", emailNotifications)
    setUserPreference("browserNotifications", browserNotifications)
    nextStep()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {currentStep === "welcome" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to TMDB Tracker!</CardTitle>
              <CardDescription>
                Let's get you set up with a personalized experience in just a few steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={nextStep} className="w-full">
                Get Started
              </Button>
              <Button onClick={skipOnboarding} variant="outline" className="w-full bg-transparent">
                Skip Setup
              </Button>
            </CardContent>
          </>
        )}

        {currentStep === "theme" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Choose Your Theme</CardTitle>
              <CardDescription>Select your preferred appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={userPreferences.theme === "light" ? "default" : "outline"}
                  onClick={() => handleThemeSelect("light")}
                  className="flex flex-col gap-2 h-auto p-4"
                >
                  <Sun className="h-6 w-6" />
                  Light
                </Button>
                <Button
                  variant={userPreferences.theme === "dark" ? "default" : "outline"}
                  onClick={() => handleThemeSelect("dark")}
                  className="flex flex-col gap-2 h-auto p-4"
                >
                  <Moon className="h-6 w-6" />
                  Dark
                </Button>
                <Button
                  variant={userPreferences.theme === "system" ? "default" : "outline"}
                  onClick={() => handleThemeSelect("system")}
                  className="flex flex-col gap-2 h-auto p-4"
                >
                  <Monitor className="h-6 w-6" />
                  System
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "name" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>What's your name?</CardTitle>
              <CardDescription>This will help us personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNameSubmit} className="flex-1" disabled={!name.trim()}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "notifications" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you'd like to be notified about new episodes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified via email about new episodes</p>
                  </div>
                  <Switch
                    checked={userPreferences.emailNotifications !== false}
                    onCheckedChange={(checked) => setUserPreference("emailNotifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get push notifications in your browser</p>
                  </div>
                  <Switch
                    checked={userPreferences.browserNotifications === true}
                    onCheckedChange={(checked) => setUserPreference("browserNotifications", checked)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button
                  onClick={() =>
                    handleNotificationSettings(
                      userPreferences.emailNotifications !== false,
                      userPreferences.browserNotifications === true,
                    )
                  }
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "features" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>Here's what you can do with TMDB Tracker:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Track Movies & TV Shows:</strong> Keep track of what you've watched and discover new content
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Get Recommendations:</strong> Discover new content based on your viewing history
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <strong>Episode Reminders:</strong> Never miss a new episode of your favorite shows
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "complete" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Welcome, {userPreferences.name || "there"}!</CardTitle>
              <CardDescription>Your account is now set up and ready to use.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={completeOnboarding} className="w-full">
                Start Using TMDB Tracker
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
