import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient()
    const body = await request.json()
    const { table, addColumn } = body

    if (table === "tracked_shows") {
      if (addColumn === "next_episode_date") {
        // Execute raw SQL to add the column if it doesn't exist
        await supabaseAdmin.rpc("add_column_if_not_exists", {
          table_name: "tracked_shows",
          column_name: "next_episode_date",
          column_type: "TEXT",
        })
      } else {
        // Create the tracked_shows table with TEXT type for next_episode_date
        await supabaseAdmin.rpc("execute_sql", {
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
      }
    } else if (table === "watchlist") {
      // Create the watchlist table
      await supabaseAdmin.rpc("execute_sql", {
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
    } else if (table === "watched_content") {
      // Create the watched_content table
      await supabaseAdmin.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS watched_content (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            tmdb_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, tmdb_id, type)
          )
        `,
      })
    } else if (table === "admin_users") {
      // Create the admin_users table
      await supabaseAdmin.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating table:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
