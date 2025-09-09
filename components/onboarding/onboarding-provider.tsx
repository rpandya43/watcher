"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface UserPreferences {
  name?: string
  favoriteGenres?: string[]
  preferredLanguage?: string
}

interface OnboardingContextType {
  isOnboardingComplete: boolean
  userPreferences: UserPreferences
  updatePreferences: (preferences: UserPreferences) => Promise<void>
  completeOnboarding: () => Promise<void>
  loading: boolean
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }

      // Check if profile exists
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userData.user.id,
          onboarding_completed: false,
          preferences: {},
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

  const updatePreferences = async (preferences: UserPreferences) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.user.id)

      if (error) throw error

      setUserPreferences(preferences)
    } catch (error) {
      console.error("Error updating preferences:", error)
      throw error
    }
  }

  const completeOnboarding = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.user.id)

      if (error) throw error

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
        updatePreferences,
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
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
