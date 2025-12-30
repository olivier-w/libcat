import { create } from 'zustand'
import type { Movie, Tag, FilterType, ScanProgress, ViewMode } from '../types'

interface LibraryState {
  // Data
  movies: Movie[]
  tags: Tag[]
  filteredMovies: Movie[]
  
  // Selection & UI state
  selectedMovie: Movie | null
  selectedMovies: Movie[]
  lastSelectedIndex: number | null
  activeFilter: FilterType
  searchQuery: string
  isScanning: boolean
  scanProgress: ScanProgress | null
  viewMode: ViewMode
  
  // Actions
  setMovies: (movies: Movie[]) => void
  setTags: (tags: Tag[]) => void
  setFilteredMovies: (movies: Movie[]) => void
  setSelectedMovie: (movie: Movie | null) => void
  setSelectedMovies: (movies: Movie[]) => void
  toggleMovieSelection: (movie: Movie, index: number, shiftKey: boolean, ctrlKey: boolean) => void
  clearSelection: () => void
  setActiveFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  setIsScanning: (isScanning: boolean) => void
  setScanProgress: (progress: ScanProgress | null) => void
  setViewMode: (mode: ViewMode) => void
  
  // Data operations
  loadMovies: () => Promise<void>
  loadTags: () => Promise<void>
  applyFilter: () => Promise<void>
  updateMovieInState: (id: number, data: Partial<Movie>) => void
  removeMovieFromState: (id: number) => void
  addMoviesToState: (movies: Movie[]) => void
  addTagToState: (tag: Tag) => void
  updateTagInState: (id: number, data: Partial<Tag>) => void
  removeTagFromState: (id: number) => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Initial state
  movies: [],
  tags: [],
  filteredMovies: [],
  selectedMovie: null,
  selectedMovies: [],
  lastSelectedIndex: null,
  activeFilter: 'all',
  searchQuery: '',
  isScanning: false,
  scanProgress: null,
  viewMode: 'grid',
  
  // Setters
  setMovies: (movies) => set({ movies }),
  setTags: (tags) => set({ tags }),
  setFilteredMovies: (movies) => set({ filteredMovies: movies }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie, selectedMovies: movie ? [movie] : [], lastSelectedIndex: null }),
  setSelectedMovies: (movies) => set({ selectedMovies: movies, selectedMovie: movies.length === 1 ? movies[0] : null }),
  
  toggleMovieSelection: (movie, index, shiftKey, ctrlKey) => {
    const { selectedMovies, lastSelectedIndex, filteredMovies } = get()
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeMovies = filteredMovies.slice(start, end + 1)
      set({ 
        selectedMovies: rangeMovies, 
        selectedMovie: rangeMovies.length === 1 ? rangeMovies[0] : null 
      })
    } else if (ctrlKey) {
      // Ctrl+click: toggle individual selection
      const isSelected = selectedMovies.some(m => m.id === movie.id)
      const newSelection = isSelected
        ? selectedMovies.filter(m => m.id !== movie.id)
        : [...selectedMovies, movie]
      set({ 
        selectedMovies: newSelection, 
        selectedMovie: newSelection.length === 1 ? newSelection[0] : null,
        lastSelectedIndex: index 
      })
    } else {
      // Normal click: single selection
      set({ 
        selectedMovies: [movie], 
        selectedMovie: movie, 
        lastSelectedIndex: index 
      })
    }
  },
  
  clearSelection: () => set({ selectedMovies: [], selectedMovie: null, lastSelectedIndex: null }),
  
  setActiveFilter: (filter) => {
    set({ activeFilter: filter })
    get().applyFilter()
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query })
    get().applyFilter()
  },
  setIsScanning: (isScanning) => set({ isScanning }),
  setScanProgress: (progress) => set({ scanProgress: progress }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Data operations
  loadMovies: async () => {
    try {
      const movies = await window.api.getMovies()
      // Load tags for each movie
      const moviesWithTags = await Promise.all(
        movies.map(async (movie: Movie) => ({
          ...movie,
          tags: await window.api.getTagsForMovie(movie.id),
        }))
      )
      set({ movies: moviesWithTags })
      get().applyFilter()
    } catch (error) {
      console.error('Failed to load movies:', error)
    }
  },
  
  loadTags: async () => {
    try {
      const tags = await window.api.getTags()
      set({ tags })
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  },
  
  applyFilter: async () => {
    const { movies, activeFilter, searchQuery } = get()
    let filtered = [...movies]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (movie) =>
          movie.title?.toLowerCase().includes(query) ||
          movie.notes?.toLowerCase().includes(query) ||
          movie.file_path.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (activeFilter === 'untagged') {
      filtered = filtered.filter((movie) => !movie.tags || movie.tags.length === 0)
    } else if (activeFilter === 'watched') {
      filtered = filtered.filter((movie) => movie.watched)
    } else if (activeFilter === 'favorites') {
      filtered = filtered.filter((movie) => movie.favorite)
    } else if (typeof activeFilter === 'number') {
      filtered = filtered.filter((movie) =>
        movie.tags?.some((tag) => tag.id === activeFilter)
      )
    }
    
    set({ filteredMovies: filtered })
  },
  
  updateMovieInState: (id, data) => {
    set((state) => ({
      movies: state.movies.map((movie) =>
        movie.id === id ? { ...movie, ...data } : movie
      ),
      selectedMovie:
        state.selectedMovie?.id === id
          ? { ...state.selectedMovie, ...data }
          : state.selectedMovie,
    }))
    get().applyFilter()
  },
  
  removeMovieFromState: (id) => {
    set((state) => ({
      movies: state.movies.filter((movie) => movie.id !== id),
      selectedMovie: state.selectedMovie?.id === id ? null : state.selectedMovie,
    }))
    get().applyFilter()
  },
  
  addMoviesToState: (newMovies) => {
    set((state) => ({
      movies: [...state.movies, ...newMovies],
    }))
    get().applyFilter()
  },
  
  addTagToState: (tag) => {
    set((state) => ({
      tags: [...state.tags, tag].sort((a, b) => a.name.localeCompare(b.name)),
    }))
  },
  
  updateTagInState: (id, data) => {
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...data } : tag
      ),
    }))
  },
  
  removeTagFromState: (id) => {
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      activeFilter: state.activeFilter === id ? 'all' : state.activeFilter,
    }))
    get().applyFilter()
  },
}))

