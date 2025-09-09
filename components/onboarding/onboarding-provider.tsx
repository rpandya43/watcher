"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"

type OnboardingStep = "welcome" | "theme" | "name" | "notifications" | "features" | "complete"

interface OnboardingContextType {
  isOnboarding: boolean
  currentStep: OnboardingStep
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setUserPreference: (key: string, value: any) => void
  userPreferences: Record<string, any>
}

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { setTheme } = useTheme()

  useEffect(() => {
    let mounted = true

    const checkOnboardingStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          setIsOnboarding(false)
          setIsLoading(false)
          return
        }

        setUserId(session.user.id)

        // Simple check - just look for onboarding_completed
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, preferences")
          .eq("id", session.user.id)
          .single()

        if (!mounted) return

        if (!profile) {
          // No profile exists, show onboarding
          setIsOnboarding(true)
        } else if (profile.onboarding_completed === true) {
          // Onboarding completed
          setIsOnboarding(false)
          if (profile.preferences) {
            setUserPreferences(profile.preferences)
            if (profile.preferences.theme) {
              setTheme(profile.preferences.theme)
            }
          }
        } else {
          // Show onboarding
          setIsOnboarding(true)
          if (profile.preferences) {
            setUserPreferences(profile.preferences)
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error)
        if (mounted) {
          setIsOnboarding(false)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkOnboardingStatus()

    return () => {
      mounted = false
    }
  }, [setTheme])

  const nextStep = () => {
    switch (currentStep) {
      case "welcome":
        setCurrentStep("theme")
        break
      case "theme":
        setCurrentStep("name")
        break
      case "name":
        setCurrentStep("notifications")
        break
      case "notifications":
        setCurrentStep("features")
        break
      case "features":
        setCurrentStep("complete")
        break
      case "complete":
        completeOnboarding()
        break
    }
  }

  const prevStep = () => {
    switch (currentStep) {
      case "theme":
        setCurrentStep("welcome")
        break
      case "name":
        setCurrentStep("theme")
        break
      case "notifications":
        setCurrentStep("name")
        break
      case "features":
        setCurrentStep("notifications")
        break
      case "complete":
        setCurrentStep("features")
        break
    }
  }

  const setUserPreference = (key: string, value: any) => {
    setUserPreferences((prev) => ({ ...prev, [key]: value }))
    if (key === "theme") {
      setTheme(value)
    }
  }

  const completeOnboarding = async () => {
    if (!userId) return

    try {
      await supabase.from("profiles").upsert({
        id: userId,
        preferences: userPreferences,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })

      setIsOnboarding(false)
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const skipOnboarding = async () => {
    await completeOnboarding()
  }

  if (isLoading) {
    return <>{children}</>
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        setUserPreference,
        userPreferences,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}
