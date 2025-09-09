const TMDB_API_KEY = process.env.TMDB_API_KEY

export async function searchTMDB(query: string, type: "movie" | "tv" = "movie", genre?: string, page = 1) {
  try {
    const params = new URLSearchParams({
      endpoint: "search",
      type,
      query: encodeURIComponent(query),
      page: page.toString(),
    })

    if (genre) {
      params.append("genre", genre)
    }

    const response = await fetch(`/api/tmdb?${params.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB search error:", errorData)
      throw new Error(`TMDB search failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in searchTMDB:", error)
    return { results: [] }
  }
}

export async function getTrending(
  timeWindow: "day" | "week" = "week",
  mediaType: "all" | "movie" | "tv" = "all",
  page = 1,
) {
  try {
    const params = new URLSearchParams({
      endpoint: "trending",
      type: mediaType,
      timeWindow,
      page: page.toString(),
    })

    const response = await fetch(`/api/tmdb?${params.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB trending error:", errorData)
      throw new Error(`TMDB trending failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching trending content:", error)
    return { results: [] }
  }
}

export async function getDetails(id: string, type: "movie" | "tv") {
  try {
    const response = await fetch(`/api/tmdb?endpoint=details&type=${type}&id=${id}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB details error:", errorData)
      throw new Error(`TMDB details failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in getDetails:", error)
    return null
  }
}

export async function getUpcomingEpisodes(showId: string) {
  try {
    const response = await fetch(`/api/tmdb?endpoint=upcoming&id=${showId}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB upcoming episodes error:", errorData)
      throw new Error(`TMDB upcoming episodes failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in getUpcomingEpisodes:", error)
    return { episodes: [] }
  }
}

export async function getRecommendations(id: string, type: "movie" | "tv", page = 1) {
  try {
    const response = await fetch(`/api/tmdb?endpoint=recommendations&type=${type}&id=${id}&page=${page}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB recommendations error:", errorData)
      throw new Error(`TMDB recommendations failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in getRecommendations:", error)
    return { results: [] }
  }
}

export async function getUpcoming(page = 1) {
  try {
    const response = await fetch(`/api/tmdb?endpoint=upcoming_movies&page=${page}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB upcoming movies error:", errorData)
      throw new Error(`TMDB upcoming movies failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in getUpcoming:", error)
    return { results: [] }
  }
}

export async function getGenres(type: "movie" | "tv" = "movie") {
  try {
    const response = await fetch(`/api/tmdb?endpoint=genres&type=${type}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB genres error:", errorData)
      throw new Error(`TMDB genres failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in getGenres:", error)
    return { genres: [] }
  }
}

export async function discoverByGenre(type: "movie" | "tv" = "movie", genreId: string, page = 1) {
  try {
    const response = await fetch(`/api/tmdb?endpoint=discover&type=${type}&genre=${genreId}&page=${page}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB discover error:", errorData)
      throw new Error(`TMDB discover failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in discoverByGenre:", error)
    return { results: [] }
  }
}

// New function to discover content by actor
export async function discoverByActor(type: "movie" | "tv" = "movie", actorId: string, page = 1) {
  try {
    const response = await fetch(`/api/tmdb?endpoint=discover&type=${type}&with_cast=${actorId}&page=${page}`)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("TMDB discover by actor error:", errorData)
      throw new Error(`TMDB discover by actor failed: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in discoverByActor:", error)
    return { results: [] }
  }
}
