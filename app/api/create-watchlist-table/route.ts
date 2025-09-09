import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Create a direct Supabase client for this API route
    const supabaseAdmin = createAdminClient()

    // Create the watchlist table if it doesn't exist
    const { error } = await supabaseAdmin.from("watchlist").select("id", { count: "exact", head: true })

    if (error && error.code === "42P01") {
      // Table doesn't exist error code
      // Execute raw SQL to create the table
      const { error: createError } = await supabaseAdmin.rpc("create_watchlist_table", {})

      if (createError) {
        // If RPC function doesn't exist, try direct SQL
        console.error("Error creating table via RPC:", createError)

        // Try to create the table directly with SQL
        const { error: sqlError } = await supabaseAdmin.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS watchlist (
              id SERIAL PRIMARY KEY,
              user_id UUID NOT NULL,
              tmdb_id INTEGER NOT NULL,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              poster_path TEXT,
              added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, tmdb_id, type)
            )
          `,
        })

        if (sqlError) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Could not create watchlist table. Please contact your administrator to set up the database table.",
              error: sqlError,
            },
            { status: 500 },
          )
        }
      }
    }

    return NextResponse.json({ success: true, message: "Watchlist table exists or was created successfully" })
  } catch (error) {
    console.error("Error creating watchlist table:", error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}
