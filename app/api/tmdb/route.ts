import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory cache with expiration
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 15 // 15 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get("endpoint")
  const type = searchParams.get("type")
  const id = searchParams.get("id")
  const query = searchParams.get("query")
  const timeWindow = searchParams.get("timeWindow") || "week"
  const page = searchParams.get("page") || "1"
  const genre = searchParams.get("genre")
  const season = searchParams.get("season")

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error("TMDB API key is missing")
    return NextResponse.json({ error: "API key not found" }, { status: 500 })
  }

  // Create a cache key based on the request parameters
  const cacheKey = `${endpoint}-${type}-${id}-${query}-${timeWindow}-${page}-${genre}-${season}`

  // Check if we have a valid cached response
  const now = Date.now()
  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey)!
    if (now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData.data)
    }
    // Cache expired, remove it
    cache.delete(cacheKey)
  }

  let url = ""
  // TMDB API v3 uses a different authorization method than v4
  // For v3, we should use the api_key query parameter instead of Authorization header
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  }

  try {
    switch (endpoint) {
      case "search":
        if (!query || !type) {
          return NextResponse.json({ error: "Missing query or type parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`
        if (genre) {
          url += `&with_genres=${genre}`
        }
        break

      case "trending":
        url = `https://api.themoviedb.org/3/trending/${type || "all"}/${timeWindow}?api_key=${apiKey}&language=en-US&page=${page}`
        break

      case "details":
        if (!id || !type) {
          return NextResponse.json({ error: "Missing id or type parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,credits,similar,recommendations`
        break

      case "upcoming":
        if (!id) {
          return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/tv/${id}/season/1?api_key=${apiKey}&language=en-US`
        break

      case "recommendations":
        if (!id || !type) {
          return NextResponse.json({ error: "Missing id or type parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${apiKey}&language=en-US&page=${page}`
        break

      case "upcoming_movies":
        url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=en-US&page=${page}`
        break

      case "genres":
        if (!type) {
          return NextResponse.json({ error: "Missing type parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/genre/${type}/list?api_key=${apiKey}&language=en-US`
        break

      case "discover":
        if (!type) {
          return NextResponse.json({ error: "Missing type parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/discover/${type}?api_key=${apiKey}&include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`
        if (genre) {
          url += `&with_genres=${genre}`
        }
        // Add support for discovering by actor
        const withCast = searchParams.get("with_cast")
        if (withCast) {
          url += `&with_cast=${withCast}`
        }
        break

      case "season":
        if (!id || !season) {
          return NextResponse.json({ error: "Missing id or season parameter" }, { status: 400 })
        }
        url = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${apiKey}&language=en-US`
        break

      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }

    console.log(`Fetching TMDB API: ${url.replace(apiKey, "API_KEY_HIDDEN")}`)
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`TMDB API error (${response.status}): ${errorText}`)

      // Special handling for rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        // Get the retry-after header if available
        const retryAfter = response.headers.get("retry-after")
        return NextResponse.json(
          {
            error: `TMDB API rate limit exceeded`,
            details: `Too Many Requests. Please try again later.${retryAfter ? ` Retry after ${retryAfter} seconds.` : ""}`,
            retryAfter: retryAfter ? Number.parseInt(retryAfter) : 30,
          },
          { status: 429 },
        )
      }

      return NextResponse.json(
        {
          error: `TMDB API returned ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Cache the response
    cache.set(cacheKey, { data, timestamp: now })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching data from TMDB:", error)
    return NextResponse.json({ error: "Failed to fetch data from TMDB", details: String(error) }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
