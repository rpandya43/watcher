import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Create a direct Supabase client for this API route
    const supabaseAdmin = createAdminClient()

    // Check if the table exists
    const { error: checkError } = await supabaseAdmin.from("tracked_shows").select("id", { count: "exact", head: true })

    // If table doesn't exist, create it
    if (checkError && checkError.code === "42P01") {
      // Create the tracked_shows table with SQL
      const { error: createError } = await supabaseAdmin.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS tracked_shows (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            tmdb_id INTEGER NOT NULL,
            show_name TEXT NOT NULL,
            poster_path TEXT,
            next_episode_date TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, tmdb_id)
          )
        `,
      })

      if (createError) {
        console.error("Error creating table via RPC:", createError)
        return NextResponse.json(
          {
            success: false,
            message:
              "Could not create tracked_shows table. Please contact your administrator to set up the database table.",
            error: createError,
          },
          { status: 500 },
        )
      }
    } else {
      // Table exists, check if next_episode_date column exists
      const { error: columnCheckError } = await supabaseAdmin.from("tracked_shows").select("next_episode_date").limit(1)

      // If column doesn't exist, add it
      if (columnCheckError && columnCheckError.message.includes("next_episode_date")) {
        await supabaseAdmin.rpc("add_column_if_not_exists", {
          table_name: "tracked_shows",
          column_name: "next_episode_date",
          column_type: "TEXT",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating tracked_shows table:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
