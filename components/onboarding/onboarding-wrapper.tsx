"use client"

import type React from "react"

import { useOnboarding } from "./onboarding-provider"
import { OnboardingWizard } from "./onboarding-wizard"

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { isOnboardingComplete, loading } = useOnboarding()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isOnboardingComplete) {
    return <OnboardingWizard />
  }

  return <>{children}</>
}
