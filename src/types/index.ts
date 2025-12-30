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
}

export type ViewMode = 'grid' | 'list'

export interface Tag {
  id: number
  name: string
  color: string
}

export type FilterType = 'all' | 'untagged' | 'watched' | 'favorites' | number // number = tag id

export interface ScanProgress {
  current: number
  total: number
  file: string
}

