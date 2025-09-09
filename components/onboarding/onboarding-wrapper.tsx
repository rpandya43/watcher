"use client"

import type React from "react"
import { useContext } from "react"
import { OnboardingContext } from "./onboarding-provider"
import { OnboardingWizard } from "./onboarding-wizard"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const context = useContext(OnboardingContext)

  // If no context, just render children (this prevents the error)
  if (!context) {
    return <>{children}</>
  }

  const { isOnboarding } = context

  console.log("OnboardingWrapper - isOnboarding:", isOnboarding)

  if (isOnboarding) {
    return <OnboardingWizard />
  }

  return <>{children}</>
}
