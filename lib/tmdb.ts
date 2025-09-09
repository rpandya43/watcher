const BASE_URL = "/api/tmdb"

export interface TMDBResponse<T> {
  results: T[]
  total_pages: number
  total_results: number
  page: number
}

export interface Movie {
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

export interface TVShow {
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

export interface TrendingItem extends Partial<Movie>, Partial<TVShow> {
  media_type: "movie" | "tv"
}

async function fetchFromAPI(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error)
    throw error
  }
}

export async function getTrending(
  timeWindow: "day" | "week" = "week",
  mediaType: "all" | "movie" | "tv" = "all",
  page = 1,
): Promise<TMDBResponse<TrendingItem>> {
  return fetchFromAPI(`/trending/${mediaType}/${timeWindow}?page=${page}`)
}

export async function getUpcoming(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchFromAPI(`/movie/upcoming?page=${page}`)
}

export async function searchMovies(query: string, page = 1): Promise<TMDBResponse<Movie>> {
  return fetchFromAPI(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`)
}

export async function searchTVShows(query: string, page = 1): Promise<TMDBResponse<TVShow>> {
  return fetchFromAPI(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`)
}

export async function getMovieDetails(id: number): Promise<Movie & { genres: { id: number; name: string }[] }> {
  return fetchFromAPI(`/movie/${id}`)
}

export async function getTVShowDetails(id: number): Promise<TVShow & { genres: { id: number; name: string }[] }> {
  return fetchFromAPI(`/tv/${id}`)
}

export async function getPopularMovies(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchFromAPI(`/movie/popular?page=${page}`)
}

export async function getPopularTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
  return fetchFromAPI(`/tv/popular?page=${page}`)
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchFromAPI(`/movie/top_rated?page=${page}`)
}

export async function getTopRatedTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
  return fetchFromAPI(`/tv/top_rated?page=${page}`)
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBResponse<Movie>> {
  return fetchFromAPI(`/movie/now_playing?page=${page}`)
}

export async function getAiringTodayTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
  return fetchFromAPI(`/tv/airing_today?page=${page}`)
}

export async function getOnTheAirTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
  return fetchFromAPI(`/tv/on_the_air?page=${page}`)
}
