"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface UserPreferences {
  name?: string
  favoriteGenres?: string[]
  preferredLanguage?: string
  emailNotifications?: boolean
  browserNotifications?: boolean
}

interface OnboardingContextType {
  isOnboardingComplete: boolean
  userPreferences: UserPreferences
  setUserPreferences: (preferences: UserPreferences) => void
  completeOnboarding: () => Promise<void>
  loading: boolean
}

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Check if profile exists
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code === "PGRST116") {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            onboarding_completed: false,
            preferences: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Error creating profile:", insertError)
          }

          setIsOnboardingComplete(false)
          setUserPreferences({})
        } else if (profile) {
          setIsOnboardingComplete(profile.onboarding_completed || false)
          setUserPreferences(profile.preferences || {})
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  const completeOnboarding = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          preferences: userPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error completing onboarding:", error)
        throw error
      }

      setIsOnboardingComplete(true)
    } catch (error) {
      console.error("Error completing onboarding:", error)
      throw error
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        userPreferences,
        setUserPreferences,
        completeOnboarding,
        loading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
