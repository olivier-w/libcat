import { create } from 'zustand'
import type { Movie, Tag, FilterType, ScanProgress, ViewMode } from '../types'

export interface Profile {
  id: string
  name: string
  passwordHash: string | null
  createdAt: string
}

interface LibraryState {
  // Profile state
  activeProfile: Profile | null
  
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
  
  // Profile actions
  setActiveProfile: (profile: Profile | null) => void
  lockProfile: () => Promise<void>
  
  // Actions
  setMovies: (movies: Movie[]) => void
  setTags: (tags: Tag[]) => void
  setFilteredMovies: (movies: Movie[]) => void
  setSelectedMovie: (movie: Movie | null) => void
  setSelectedMovies: (movies: Movie[]) => void
  toggleMovieSelection: (movie: Movie, index: number, shiftKey: boolean, ctrlKey: boolean, displayedMovies?: Movie[]) => void
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
  removeMoviesFromState: (ids: number[]) => void
  addMoviesToState: (movies: Movie[]) => void
  addTagToState: (tag: Tag) => void
  updateTagInState: (id: number, data: Partial<Tag>) => void
  removeTagFromState: (id: number) => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Initial state
  activeProfile: null,
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
  
  // Profile actions
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  
  lockProfile: async () => {
    try {
      await window.api.lockProfile()
      // Clear all data when locking
      set({
        activeProfile: null,
        movies: [],
        tags: [],
        filteredMovies: [],
        selectedMovie: null,
        selectedMovies: [],
        lastSelectedIndex: null,
        activeFilter: 'all',
        searchQuery: '',
      })
    } catch (error) {
      console.error('Failed to lock profile:', error)
    }
  },
  
  // Setters
  setMovies: (movies) => set({ movies }),
  setTags: (tags) => set({ tags }),
  setFilteredMovies: (movies) => set({ filteredMovies: movies }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie, selectedMovies: movie ? [movie] : [], lastSelectedIndex: null }),
  setSelectedMovies: (movies) => set({ selectedMovies: movies, selectedMovie: movies.length === 1 ? movies[0] : null }),
  
  toggleMovieSelection: (movie, index, shiftKey, ctrlKey, displayedMovies) => {
    const { selectedMovies, lastSelectedIndex, filteredMovies } = get()
    // Use the displayed movies array if provided (for custom sorting like in ListView)
    const moviesArray = displayedMovies ?? filteredMovies
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeMovies = moviesArray.slice(start, end + 1)
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
      const { selectedMovie, selectedMovies } = get()
      const movies = await window.api.getMovies()
      // Load tags for each movie
      const moviesWithTags = await Promise.all(
        movies.map(async (movie: Movie) => ({
          ...movie,
          tags: await window.api.getTagsForMovie(movie.id),
        }))
      )
      
      // Update selectedMovie and selectedMovies to point to the updated movie objects
      const updatedSelectedMovie = selectedMovie
        ? moviesWithTags.find(m => m.id === selectedMovie.id) || null
        : null
      
      const updatedSelectedMovies = selectedMovies
        .map(movie => moviesWithTags.find(m => m.id === movie.id))
        .filter((m): m is Movie => m !== undefined)
      
      set({ 
        movies: moviesWithTags,
        selectedMovie: updatedSelectedMovie,
        selectedMovies: updatedSelectedMovies,
      })
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
    const { movies, activeFilter, searchQuery, selectedMovies, selectedMovie, tags } = get()
    let filtered = [...movies]
    
    // Apply search filter with multi-tag support
    if (searchQuery) {
      const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t)
      
      // Separate terms into tag matches and text search terms
      const matchedTagIds: number[] = []
      const textTerms: string[] = []
      
      for (const term of queryTerms) {
        const matchingTag = tags.find(t => t.name.toLowerCase() === term)
        if (matchingTag) {
          matchedTagIds.push(matchingTag.id)
        } else {
          textTerms.push(term)
        }
      }
      
      // Filter by ALL matched tags (AND logic)
      if (matchedTagIds.length > 0) {
        filtered = filtered.filter(movie =>
          matchedTagIds.every(tagId => movie.tags?.some(t => t.id === tagId))
        )
      }
      
      // Filter by text terms in title/notes/path
      if (textTerms.length > 0) {
        filtered = filtered.filter(movie =>
          textTerms.every(term =>
            movie.title?.toLowerCase().includes(term) ||
            movie.notes?.toLowerCase().includes(term) ||
            movie.file_path.toLowerCase().includes(term)
          )
        )
      }
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
    
    // Sort by date added (newest first) - must match Gallery display order
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })
    
    // Clean up invalid selections (movies that no longer exist or don't match filter)
    const movieIds = new Set(movies.map(m => m.id))
    const filteredIds = new Set(filtered.map(m => m.id))
    
    const validSelectedMovies = selectedMovies.filter(m => 
      movieIds.has(m.id) && filteredIds.has(m.id)
    )
    const validSelectedMovie = selectedMovie && movieIds.has(selectedMovie.id) && filteredIds.has(selectedMovie.id)
      ? selectedMovie
      : null
    
    set({ 
      filteredMovies: filtered,
      selectedMovies: validSelectedMovies,
      selectedMovie: validSelectedMovie,
      lastSelectedIndex: validSelectedMovies.length === 0 ? null : get().lastSelectedIndex,
    })
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
    set((state) => {
      const newMovies = state.movies.filter((movie) => movie.id !== id)
      const newSelectedMovies = state.selectedMovies.filter((movie) => movie.id !== id)
      const newSelectedMovie = state.selectedMovie?.id === id ? null : state.selectedMovie
      
      return {
        movies: newMovies,
        selectedMovies: newSelectedMovies,
        selectedMovie: newSelectedMovie,
        lastSelectedIndex: newSelectedMovies.length === 0 ? null : state.lastSelectedIndex,
      }
    })
    get().applyFilter()
  },
  
  removeMoviesFromState: (ids: number[]) => {
    set((state) => {
      const idSet = new Set(ids)
      const newMovies = state.movies.filter((movie) => !idSet.has(movie.id))
      const newSelectedMovies = state.selectedMovies.filter((movie) => !idSet.has(movie.id))
      const newSelectedMovie = state.selectedMovie && !idSet.has(state.selectedMovie.id) 
        ? state.selectedMovie 
        : null
      
      return {
        movies: newMovies,
        selectedMovies: newSelectedMovies,
        selectedMovie: newSelectedMovie,
        lastSelectedIndex: newSelectedMovies.length === 0 ? null : state.lastSelectedIndex,
      }
    })
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
      tags: [...state.tags, tag].sort((a, b) => {
        // Sort by creation date (newest first), fallback to id if no created_at
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return (b.id || 0) - (a.id || 0)
      }),
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

