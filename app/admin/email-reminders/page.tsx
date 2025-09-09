"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Calendar, Mail, RefreshCw } from "lucide-react"

export default function EmailRemindersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const triggerEmailReminders = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/email-reminders")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger email reminders")
      }

      setResult(data)
      toast({
        title: "Success",
        description: data.message || "Email reminders triggered successfully",
      })
    } catch (error: any) {
      console.error("Error triggering email reminders:", error)
      setResult({ success: false, error: error.message })
      toast({
        title: "Error",
        description: error.message || "Failed to trigger email reminders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Reminders</h1>
        <p className="text-muted-foreground">Manage and trigger email reminders for upcoming episodes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Episode Reminders</CardTitle>
          <CardDescription>
            Manually trigger email reminders for users who have opted in to receive notifications about upcoming
            episodes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Episode Reminders</h3>
              <p className="text-sm text-muted-foreground">
                This will send email notifications to users who have opted in for episode reminders and have shows with
                episodes airing tomorrow.
              </p>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message || result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={triggerEmailReminders} disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Reminders
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Reminder Schedule</CardTitle>
          <CardDescription>Configure when email reminders are sent</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In a production environment, you would set up a scheduled job (e.g., using Vercel Cron) to automatically
            trigger the email reminders daily. This would ensure users receive timely notifications about their upcoming
            shows.
          </p>
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Example Cron Configuration</h4>
            <code className="text-sm">0 8 * * * curl https://your-app.com/api/email-reminders</code>
            <p className="text-xs text-muted-foreground mt-2">This would run daily at 8:00 AM.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
