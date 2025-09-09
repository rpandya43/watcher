"use client"

import type React from "react"

import { useOnboarding } from "./onboarding-provider"
import { OnboardingWizard } from "./onboarding-wizard"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { isOnboarding } = useOnboarding()

  if (isOnboarding) {
    return <OnboardingWizard />
  }

  return <>{children}</>
}
