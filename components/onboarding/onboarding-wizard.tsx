"use client"

import { useState } from "react"
import { useOnboarding } from "./onboarding-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Moon, Sun, Bell, BellOff, Film, Tv, Star } from "lucide-react"

export function OnboardingWizard() {
  const { currentStep, nextStep, prevStep, skipOnboarding, completeOnboarding, setUserPreference, userPreferences } =
    useOnboarding()

  const [name, setName] = useState(userPreferences.name || "")
  const [theme, setTheme] = useState(userPreferences.theme || "system")
  const [emailNotifications, setEmailNotifications] = useState(userPreferences.emailNotifications ?? true)
  const [browserNotifications, setBrowserNotifications] = useState(userPreferences.browserNotifications ?? false)

  const steps = ["welcome", "theme", "name", "notifications", "features", "complete"]
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    // Save current step data
    switch (currentStep) {
      case "theme":
        setUserPreference("theme", theme)
        break
      case "name":
        setUserPreference("name", name)
        break
      case "notifications":
        setUserPreference("emailNotifications", emailNotifications)
        setUserPreference("browserNotifications", browserNotifications)
        break
    }
    nextStep()
  }

  const handleSkip = () => {
    skipOnboarding()
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Film className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to TMDB Tracker!</CardTitle>
              <CardDescription>
                Let's set up your account to get the best movie and TV show tracking experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleNext} className="w-full">
                Get Started
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="w-full">
                Skip Setup
              </Button>
            </CardContent>
          </Card>
        )

      case "theme":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Choose Your Theme</CardTitle>
              <CardDescription>Select how you'd like the app to look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="light" id="light" />
                  <Sun className="h-5 w-5" />
                  <Label htmlFor="light" className="flex-1">
                    Light Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="dark" id="dark" />
                  <Moon className="h-5 w-5" />
                  <Label htmlFor="dark" className="flex-1">
                    Dark Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="system" id="system" />
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-yellow-400 to-blue-600" />
                  </div>
                  <Label htmlFor="system" className="flex-1">
                    System Default
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "name":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>What should we call you?</CardTitle>
              <CardDescription>This will personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!name.trim()}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "notifications":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Stay updated on your favorite shows and movies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new episodes</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3">
                  <BellOff className="h-5 w-5" />
                  <div>
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Real-time notifications in your browser</p>
                  </div>
                </div>
                <Switch checked={browserNotifications} onCheckedChange={setBrowserNotifications} />
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "features":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Explore Features</CardTitle>
              <CardDescription>Here's what you can do with TMDB Tracker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Film className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Track Movies & TV Shows</p>
                    <p className="text-sm text-muted-foreground">Keep track of what you've watched</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Create Watchlists</p>
                    <p className="text-sm text-muted-foreground">Save content to watch later</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Tv className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Get Recommendations</p>
                    <p className="text-sm text-muted-foreground">Discover new content based on your taste</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Finish Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "complete":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>Welcome to TMDB Tracker, {name}! Start exploring movies and TV shows.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={completeOnboarding} className="w-full">
                Start Using TMDB Tracker
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
        {renderStep()}
      </div>
    </div>
  )
}
