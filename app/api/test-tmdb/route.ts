import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 500 })
  }

  try {
    // Test the API key with a simple request
    const url = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`

    console.log("Testing TMDB API key...")
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB API key test failed:", errorData)
      return NextResponse.json({
        success: false,
        error: `API key test failed: ${errorData.status_message || response.statusText}`,
        status: response.status,
      })
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: "API key is valid",
      images: data.images
        ? {
            base_url: data.images.base_url,
            secure_base_url: data.images.secure_base_url,
            backdrop_sizes: data.images.backdrop_sizes,
            poster_sizes: data.images.poster_sizes,
          }
        : null,
    })
  } catch (error) {
    console.error("Error testing TMDB API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error testing API key",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
