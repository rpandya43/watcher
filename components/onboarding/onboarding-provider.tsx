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

// Export the context so it can be accessed directly if needed
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
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setIsOnboarding(false)
          return
        }

        if (!session?.user) {
          console.log("No user session found")
          setIsOnboarding(false)
          return
        }

        const currentUserId = session.user.id
        setUserId(currentUserId)

        console.log("Checking onboarding for user:", currentUserId)

        // First, ensure the user has a profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUserId)
          .single()

        if (fetchError && fetchError.code === "PGRST116") {
          // Profile doesn't exist, create it
          console.log("Creating new profile for user:", currentUserId)
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: currentUserId,
              onboarding_completed: false,
              preferences: {},
              email_notifications: true,
              browser_notifications: false,
            })
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            setIsOnboarding(true) // Default to showing onboarding
            return
          }

          console.log("New profile created:", newProfile)
          setIsOnboarding(true)
          return
        }

        if (fetchError) {
          console.error("Error fetching profile:", fetchError)
          setIsOnboarding(true) // Default to showing onboarding
          return
        }

        console.log("Existing profile found:", existingProfile)

        // Check onboarding completion status
        const isCompleted = existingProfile.onboarding_completed === true

        console.log("Onboarding completed:", isCompleted)

        if (isCompleted) {
          setIsOnboarding(false)

          // Load and apply saved preferences
          if (existingProfile.preferences) {
            setUserPreferences(existingProfile.preferences)
            if (existingProfile.preferences.theme) {
              setTheme(existingProfile.preferences.theme)
            }
          }
        } else {
          setIsOnboarding(true)

          // Load any existing preferences
          if (existingProfile.preferences) {
            setUserPreferences(existingProfile.preferences)
            if (existingProfile.preferences.theme) {
              setTheme(existingProfile.preferences.theme)
            }
          }
        }
      } catch (error) {
        console.error("Error in checkOnboardingStatus:", error)
        setIsOnboarding(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboardingStatus()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session?.user) {
        checkOnboardingStatus()
      } else if (event === "SIGNED_OUT") {
        setIsOnboarding(false)
        setUserId(null)
        setUserPreferences({})
      }
    })

    return () => {
      subscription.unsubscribe()
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
    setUserPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))

    if (key === "theme") {
      setTheme(value)
    }
  }

  const savePreferences = async () => {
    try {
      if (!userId) {
        console.error("No user ID available for saving preferences")
        throw new Error("No user ID available")
      }

      console.log("Saving preferences and completing onboarding for user:", userId)
      console.log("Preferences to save:", userPreferences)

      const { data, error } = await supabase
        .from("profiles")
        .update({
          preferences: userPreferences,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()

      if (error) {
        console.error("Error saving preferences:", error)
        throw error
      }

      console.log("Preferences saved successfully:", data)

      // Verify the save worked
      const { data: verifyData, error: verifyError } = await supabase
        .from("profiles")
        .select("onboarding_completed, preferences")
        .eq("id", userId)
        .single()

      if (verifyError) {
        console.error("Error verifying save:", verifyError)
      } else {
        console.log("Verification - onboarding completed:", verifyData.onboarding_completed)
        console.log("Verification - preferences:", verifyData.preferences)
      }
    } catch (error) {
      console.error("Error in savePreferences:", error)
      throw error
    }
  }

  const completeOnboarding = async () => {
    try {
      console.log("Completing onboarding...")
      await savePreferences()
      setIsOnboarding(false)
      console.log("Onboarding completed successfully")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      // Don't set onboarding to false if there was an error
    }
  }

  const skipOnboarding = async () => {
    try {
      console.log("Skipping onboarding...")
      await savePreferences()
      setIsOnboarding(false)
      console.log("Onboarding skipped successfully")
    } catch (error) {
      console.error("Error skipping onboarding:", error)
      // Don't set onboarding to false if there was an error
    }
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
