"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type OnboardingStep = "welcome" | "theme" | "name" | "notifications" | "features" | "complete"

interface UserPreferences {
  theme?: string
  name?: string
  emailNotifications?: boolean
  browserNotifications?: boolean
}

interface OnboardingContextType {
  isOnboarding: boolean
  currentStep: OnboardingStep
  userPreferences: UserPreferences
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setUserPreference: (key: string, value: any) => void
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)

  const steps: OnboardingStep[] = ["welcome", "theme", "name", "notifications", "features", "complete"]

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single()

        if (!profile?.onboarding_completed) {
          setIsOnboarding(true)
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const setUserPreference = (key: string, value: any) => {
    setUserPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const completeOnboarding = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Update profile with onboarding completion and preferences
        await supabase
          .from("profiles")
          .update({
            onboarding_completed: true,
            display_name: userPreferences.name,
            email_notifications: userPreferences.emailNotifications ?? true,
            browser_notifications: userPreferences.browserNotifications ?? false,
          })
          .eq("id", session.user.id)

        setIsOnboarding(false)
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const skipOnboarding = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", session.user.id)
        setIsOnboarding(false)
      }
    } catch (error) {
      console.error("Error skipping onboarding:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        userPreferences,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        setUserPreference,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}
