import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    // Get all users who have opted in for email notifications
    const { data: users, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, preferences")
      .not("preferences", "is", null)

    if (usersError) throw usersError

    // Filter users who have opted in for email notifications
    const optedInUsers =
      users?.filter((user) => {
        const preferences = user.preferences || {}
        return preferences.emailNotifications === true && preferences.episodeReminders === true
      }) || []

    if (optedInUsers.length === 0) {
      return NextResponse.json({ message: "No users have opted in for email notifications" })
    }

    // For each user, get their tracked shows with upcoming episodes
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    let emailsSent = 0

    for (const user of optedInUsers) {
      // Get tracked shows with episodes airing tomorrow
      const { data: shows, error: showsError } = await supabaseAdmin
        .from("tracked_shows")
        .select("*")
        .eq("user_id", user.id)
        .not("next_episode_date", "is", null)

      if (showsError) continue

      const tomorrowShows =
        shows?.filter((show) => {
          const episodeDate = show.next_episode_date?.split("T")[0]
          return episodeDate === tomorrowStr
        }) || []

      if (tomorrowShows.length > 0) {
        // Send email notification
        await sendEmailReminder(user.email, tomorrowShows)
        emailsSent++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email reminders processed. ${emailsSent} emails sent.`,
    })
  } catch (error) {
    console.error("Error processing email reminders:", error)
    return NextResponse.json({ error: "Failed to process email reminders" }, { status: 500 })
  }
}

async function sendEmailReminder(email: string, shows: any[]) {
  // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
  // For this example, we'll just log the email that would be sent

  console.log(`Sending email reminder to ${email} for shows:`, shows.map((s) => s.show_name).join(", "))

  // Example of how you might send an email with a service like SendGrid
  /*
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: 'notifications@watchtracker.com', name: 'WatchTracker' },
      subject: 'Your shows are airing tomorrow!',
      content: [
        {
          type: 'text/html',
          value: generateEmailTemplate(shows)
        }
      ]
    })
  })
  
  return response.ok
  */

  // For this example, we'll just return true
  return true
}

function generateEmailTemplate(shows: any[]) {
  // In a real application, you would use a proper HTML template
  // This is a simplified example
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .show { margin-bottom: 15px; padding: 10px; background-color: white; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .show-title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 Your Shows Are Airing Tomorrow! 🎬</h1>
        </div>
        <div class="content">
          <p>Get ready for some great entertainment! The following shows you're tracking have new episodes airing tomorrow:</p>
          
          ${shows
            .map(
              (show) => `
            <div class="show">
              <div class="show-title">${show.show_name}</div>
              <p>Don't miss the new episode airing on ${new Date(show.next_episode_date).toLocaleDateString()}!</p>
              <a href="https://watchtracker.com/dashboard/tv-shows/${show.tmdb_id}" class="button">View Show Details</a>
            </div>
          `,
            )
            .join("")}
          
          <p>Happy watching!</p>
          
          <div class="footer">
            <p>You're receiving this email because you've opted in for episode reminders on WatchTracker.</p>
            <p>To update your notification preferences, <a href="https://watchtracker.com/dashboard/settings">visit your settings</a>.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
