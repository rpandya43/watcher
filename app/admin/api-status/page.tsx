"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function ApiStatus() {
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<{
    success: boolean
    message?: string
    error?: string
    images?: any
  } | null>(null)

  const checkApiStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-tmdb")
      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      console.error("Error checking API status:", error)
      setApiStatus({
        success: false,
        error: "Failed to check API status",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Status</h1>
        <p className="text-muted-foreground">Check the status of external APIs used by the application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TMDB API Status</CardTitle>
          <CardDescription>The Movie Database API is used to fetch movie and TV show data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : apiStatus ? (
            apiStatus.success ? (
              <Alert className="bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-600 dark:text-green-400">API Key is Valid</AlertTitle>
                <AlertDescription>
                  {apiStatus.message}
                  {apiStatus.images && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Image Base URL:</p>
                      <code className="block rounded bg-muted p-2 text-xs mt-1">
                        {apiStatus.images.secure_base_url}
                      </code>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Error</AlertTitle>
                <AlertDescription>
                  {apiStatus.error}
                  <div className="mt-2">
                    <p className="text-sm">Please check your TMDB API key in the environment variables.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to check API status</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkApiStatus} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </>
            )}
          </Button>
          <Button asChild>
            <Link href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
              TMDB API Settings
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Fix API Key Issues</CardTitle>
          <CardDescription>Follow these steps if your TMDB API key is not working</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">1. Check your API key</h3>
            <p className="text-sm text-muted-foreground">
              Make sure your TMDB API key is correctly set in the environment variables. The key should be set as{" "}
              <code>TMDB_API_KEY</code>.
            </p>
          </div>
          <div>
            <h3 className="font-medium">2. Verify your TMDB account</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your TMDB account is verified and in good standing. API keys may be disabled if your account has
              issues.
            </p>
          </div>
          <div>
            <h3 className="font-medium">3. Generate a new API key</h3>
            <p className="text-sm text-muted-foreground">
              If your key is not working, try generating a new API key from the TMDB website.
            </p>
          </div>
          <div>
            <h3 className="font-medium">4. Check API usage limits</h3>
            <p className="text-sm text-muted-foreground">
              TMDB has rate limits for API requests. Make sure you haven't exceeded your daily or hourly limits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
