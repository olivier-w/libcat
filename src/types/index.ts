export interface Movie {
  id: number
  file_path: string
  title: string | null
  year: number | null
  rating: number | null
  notes: string | null
  watched: boolean
  favorite: boolean
  thumbnail_path: string | null
  file_size: number | null
  duration: number | null
  created_at: string
  updated_at: string
  tags?: Tag[]
  // TMDB fields
  tmdb_id: number | null
  tmdb_poster_path: string | null
  tmdb_rating: number | null
  tmdb_overview: string | null
  tmdb_director: string | null
  tmdb_cast: string | null
  tmdb_release_date: string | null
  tmdb_genres: string | null
}

export interface TMDBCastMember {
  name: string
  character: string
}

export interface TMDBSearchResult {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  popularity: number
}

export type ViewMode = 'grid' | 'list'

export type SortColumn = 'title' | 'created_at' | 'file_size' | 'duration'
export type SortDirection = 'asc' | 'desc'

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export type FilterType = 'all' | 'untagged' | 'watched' | 'unwatched' | 'favorites' | number // number = tag id

export interface ScanProgress {
  current: number
  total: number
  file: string
}
