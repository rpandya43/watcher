"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnboarding } from "./onboarding-provider"
import { toast } from "@/hooks/use-toast"

const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
]

const TV_GENRES = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "News",
  "Reality",
  "Sci-Fi & Fantasy",
  "Soap",
  "Talk",
  "War & Politics",
  "Western",
]

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [loading, setLoading] = useState(false)

  const { setUserPreferences, completeOnboarding } = useOnboarding()

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const handleComplete = async () => {
    try {
      setLoading(true)

      const preferences = {
        name,
        favoriteGenres: selectedGenres,
        emailNotifications,
        browserNotifications,
      }

      setUserPreferences(preferences)
      await completeOnboarding()

      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully.",
      })
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to TMDB Tracker!</CardTitle>
          <CardDescription>Let's set up your account to get personalized recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button onClick={() => setStep(2)} disabled={!name.trim()} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">What genres do you enjoy?</h3>
                <p className="text-sm text-muted-foreground mb-4">Select your favorite movie and TV genres:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[...MOVIE_GENRES, ...TV_GENRES].map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={genre}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => handleGenreToggle(genre)}
                      />
                      <Label htmlFor={genre} className="text-sm">
                        {genre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={emailNotifications}
                      onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                    />
                    <Label htmlFor="email">Email notifications for new episodes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="browser"
                      checked={browserNotifications}
                      onCheckedChange={(checked) => setBrowserNotifications(checked as boolean)}
                    />
                    <Label htmlFor="browser">Browser notifications</Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading} className="flex-1">
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
