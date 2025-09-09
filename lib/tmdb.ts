const TMDB_API_KEY = process.env.TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  origin_country: string[]
  original_language: string
  original_name: string
  popularity: number
}

export interface TMDBResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

async function fetchFromTMDB(endpoint: string): Promise<any> {
  const url = `${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

export async function getTrending(
  timeWindow: "day" | "week" = "week",
  mediaType: "all" | "movie" | "tv" = "all",
  page = 1,
): Promise<TMDBResponse<TMDBMovie | TMDBTVShow>> {
  return fetchFromTMDB(`/trending/${mediaType}/${timeWindow}?page=${page}`)
}

export async function getUpcoming(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchFromTMDB(`/movie/upcoming?page=${page}`)
}

export async function searchMulti(query: string, page = 1): Promise<TMDBResponse<TMDBMovie | TMDBTVShow>> {
  return fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`)
}

export async function getMovieDetails(id: number): Promise<TMDBMovie & { genres: { id: number; name: string }[] }> {
  return fetchFromTMDB(`/movie/${id}`)
}

export async function getTVShowDetails(id: number): Promise<TMDBTVShow & { genres: { id: number; name: string }[] }> {
  return fetchFromTMDB(`/tv/${id}`)
}

export async function getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchFromTMDB(`/movie/popular?page=${page}`)
}

export async function getPopularTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchFromTMDB(`/tv/popular?page=${page}`)
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchFromTMDB(`/movie/top_rated?page=${page}`)
}

export async function getTopRatedTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchFromTMDB(`/tv/top_rated?page=${page}`)
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchFromTMDB(`/movie/now_playing?page=${page}`)
}

export async function getAiringTodayTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchFromTMDB(`/tv/airing_today?page=${page}`)
}

export async function getOnTheAirTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchFromTMDB(`/tv/on_the_air?page=${page}`)
}

export async function getMovieRecommendations(id: number, page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchFromTMDB(`/movie/${id}/recommendations?page=${page}`)
}

export async function getTVShowRecommendations(id: number, page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchFromTMDB(`/tv/${id}/recommendations?page=${page}`)
}

export async function discoverMovies(params: {
  page?: number
  sort_by?: string
  with_genres?: string
  year?: number
  "vote_average.gte"?: number
}): Promise<TMDBResponse<TMDBMovie>> {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString())
    }
  })

  return fetchFromTMDB(`/discover/movie?${queryParams.toString()}`)
}

export async function discoverTVShows(params: {
  page?: number
  sort_by?: string
  with_genres?: string
  first_air_date_year?: number
  "vote_average.gte"?: number
}): Promise<TMDBResponse<TMDBTVShow>> {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString())
    }
  })

  return fetchFromTMDB(`/discover/tv?${queryParams.toString()}`)
}
