"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { useOnboarding } from "./onboarding-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Check, Bell, Zap } from "lucide-react"

export function OnboardingWizard() {
  const { currentStep, nextStep, prevStep, skipOnboarding, completeOnboarding, setUserPreference, userPreferences } =
    useOnboarding()
  const { setTheme } = useTheme()
  const [displayName, setDisplayName] = useState("")

  const handleThemeSelect = (theme: string) => {
    setUserPreference("theme", theme)
    setTheme(theme)
  }

  const handleNameSubmit = () => {
    if (displayName.trim()) {
      setUserPreference("displayName", displayName.trim())
    }
    nextStep()
  }

  const handleNotificationToggle = (type: string, enabled: boolean) => {
    setUserPreference(`${type}_notifications`, enabled)
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Welcome to Watch Tracker!</CardTitle>
                <CardDescription>Let's get you set up to track your favorite movies and TV shows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={nextStep} className="w-full">
                  Get Started
                </Button>
                <Button onClick={skipOnboarding} variant="outline" className="w-full bg-transparent">
                  Skip Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "theme":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Choose Your Theme</CardTitle>
              <CardDescription>Select the appearance that works best for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={userPreferences.theme === "light" ? "default" : "outline"}
                  className="h-20 flex-col"
                  onClick={() => handleThemeSelect("light")}
                >
                  <Sun className="w-6 h-6 mb-2" />
                  Light
                </Button>
                <Button
                  variant={userPreferences.theme === "dark" ? "default" : "outline"}
                  className="h-20 flex-col"
                  onClick={() => handleThemeSelect("dark")}
                >
                  <Moon className="w-6 h-6 mb-2" />
                  Dark
                </Button>
                <Button
                  variant={userPreferences.theme === "system" ? "default" : "outline"}
                  className="h-20 flex-col"
                  onClick={() => handleThemeSelect("system")}
                >
                  <Monitor className="w-6 h-6 mb-2" />
                  System
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Continue</Button>
            </CardFooter>
          </Card>
        )

      case "name":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>What should we call you?</CardTitle>
              <CardDescription>This will be used to personalize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={handleNameSubmit}>Continue</Button>
            </CardFooter>
          </Card>
        )

      case "notifications":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you'd like to be notified about new episodes and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new episodes via email</p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={userPreferences.email_notifications !== false}
                  onCheckedChange={(checked) => handleNotificationToggle("email", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5" />
                  <div>
                    <Label htmlFor="browser-notifications">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get instant notifications in your browser</p>
                  </div>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={userPreferences.browser_notifications === true}
                  onCheckedChange={(checked) => handleNotificationToggle("browser", checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Continue</Button>
            </CardFooter>
          </Card>
        )

      case "features":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Explore Features</CardTitle>
              <CardDescription>Here's what you can do with Watch Tracker:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Track Movies & TV Shows</p>
                    <p className="text-sm text-muted-foreground">Keep track of what you've watched and want to watch</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Get Episode Notifications</p>
                    <p className="text-sm text-muted-foreground">Never miss a new episode of your favorite shows</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Discover New Content</p>
                    <p className="text-sm text-muted-foreground">
                      Get personalized recommendations based on your taste
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">View Statistics</p>
                    <p className="text-sm text-muted-foreground">See your watching habits and statistics</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Finish Setup</Button>
            </CardFooter>
          </Card>
        )

      case "complete":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>Welcome to Watch Tracker. Let's start exploring!</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <Check className="w-16 h-16 mx-auto text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your preferences have been saved. You can always change them later in your settings.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={completeOnboarding} className="w-full">
                Start Using Watch Tracker
              </Button>
            </CardFooter>
          </Card>
        )

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Setup Complete!</CardTitle>
                <CardDescription>You're all set to start tracking your movies and TV shows.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={completeOnboarding} className="w-full">
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {renderStep()}
        {/* <div className="mt-4 flex justify-center space-x-2">
          {["welcome", "theme", "name", "notifications", "features", "complete"].map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full ${
                ["welcome", "theme", "name", "notifications", "features", "complete"].indexOf(currentStep) >= index
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div> */}
      </div>
    </div>
  )
}
