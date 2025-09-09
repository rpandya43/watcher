import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Use the admin client for server-side operations
    const supabaseAdmin = createAdminClient()

    // Check if profiles table exists
    const { error: checkError } = await supabaseAdmin.from("profiles").select("id").limit(1)

    // If the table doesn't exist or has a different structure, create it
    if (checkError && checkError.code === "PGRST116") {
      // Create profiles table
      await supabaseAdmin.rpc("create_profiles_table")
    } else {
      // Table exists, check if onboarding_completed column exists
      const { error: columnCheckError } = await supabaseAdmin.rpc("execute_sql", {
        sql_query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
        `,
      })

      // If column doesn't exist, add it
      if (columnCheckError || (columnCheckError === null && !columnCheckError)) {
        await supabaseAdmin.rpc("execute_sql", {
          sql_query: `
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb
          `,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up profiles table:", error)
    return NextResponse.json({ error: "Failed to set up profiles table" }, { status: 500 })
  }
}
