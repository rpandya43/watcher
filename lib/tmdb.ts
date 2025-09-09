const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
  vote_count: number
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  genre_ids: number[]
  adult: boolean
  origin_country: string[]
  original_language: string
  original_name: string
  popularity: number
  vote_count: number
}

export interface TMDBSearchResult {
  page: number
  results: (TMDBMovie | TMDBTVShow)[]
  total_pages: number
  total_results: number
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[]
}

// Use our API route instead of direct TMDB calls
export const tmdbApi = {
  async searchMulti(query: string, page = 1): Promise<TMDBSearchResult> {
    const response = await fetch(`/api/tmdb?endpoint=search/multi&query=${encodeURIComponent(query)}&page=${page}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getMovieDetails(id: number): Promise<TMDBMovie> {
    const response = await fetch(`/api/tmdb?endpoint=movie/${id}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getTVShowDetails(id: number): Promise<TMDBTVShow> {
    const response = await fetch(`/api/tmdb?endpoint=tv/${id}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getTrending(
    mediaType: "all" | "movie" | "tv" = "all",
    timeWindow: "day" | "week" = "week",
  ): Promise<TMDBSearchResult> {
    const response = await fetch(`/api/tmdb?endpoint=trending/${mediaType}/${timeWindow}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getPopularMovies(page = 1): Promise<TMDBSearchResult> {
    const response = await fetch(`/api/tmdb?endpoint=movie/popular&page=${page}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getPopularTVShows(page = 1): Promise<TMDBSearchResult> {
    const response = await fetch(`/api/tmdb?endpoint=tv/popular&page=${page}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getUpcomingMovies(page = 1): Promise<TMDBSearchResult> {
    const response = await fetch(`/api/tmdb?endpoint=movie/upcoming&page=${page}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getMovieGenres(): Promise<TMDBGenresResponse> {
    const response = await fetch(`/api/tmdb?endpoint=genre/movie/list`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async getTVGenres(): Promise<TMDBGenresResponse> {
    const response = await fetch(`/api/tmdb?endpoint=genre/tv/list`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async discoverMovies(params: Record<string, string | number> = {}): Promise<TMDBSearchResult> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString())
    })

    const response = await fetch(`/api/tmdb?endpoint=discover/movie&${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },

  async discoverTVShows(params: Record<string, string | number> = {}): Promise<TMDBSearchResult> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString())
    })

    const response = await fetch(`/api/tmdb?endpoint=discover/tv&${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  },
}

export default tmdbApi
