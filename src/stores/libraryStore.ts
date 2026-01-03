import { create } from 'zustand'
import type { Movie, Tag, FilterType, ScanProgress, ViewMode, SortColumn, SortDirection } from '../types'

// Simple debounce utility
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

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
  selectedIds: Set<number>  // O(1) lookup for selection state
  lastSelectedIndex: number | null
  activeFilter: FilterType
  searchQuery: string
  isScanning: boolean
  scanProgress: ScanProgress | null
  viewMode: ViewMode
  sortColumn: SortColumn
  sortDirection: SortDirection
  
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
  setSortColumn: (column: SortColumn) => void
  setSortDirection: (direction: SortDirection) => void
  
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
  selectedIds: new Set(),
  lastSelectedIndex: null,
  activeFilter: 'all',
  searchQuery: '',
  isScanning: false,
  scanProgress: null,
  viewMode: 'grid',
  sortColumn: 'created_at',
  sortDirection: 'desc',
  
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
        selectedIds: new Set(),
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
  setSelectedMovie: (movie) => set({ 
    selectedMovie: movie, 
    selectedMovies: movie ? [movie] : [], 
    selectedIds: movie ? new Set([movie.id]) : new Set(),
    lastSelectedIndex: null 
  }),
  setSelectedMovies: (movies) => set({ 
    selectedMovies: movies, 
    selectedIds: new Set(movies.map(m => m.id)),
    selectedMovie: movies.length === 1 ? movies[0] : null,
    lastSelectedIndex: movies.length > 0 ? 0 : null
  }),
  
  toggleMovieSelection: (movie, index, shiftKey, ctrlKey, displayedMovies) => {
    const { selectedIds, lastSelectedIndex, filteredMovies } = get()
    // Use the displayed movies array if provided (for custom sorting like in ListView)
    const moviesArray = displayedMovies ?? filteredMovies
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeMovies = moviesArray.slice(start, end + 1)
      set({ 
        selectedMovies: rangeMovies, 
        selectedIds: new Set(rangeMovies.map(m => m.id)),
        selectedMovie: rangeMovies.length === 1 ? rangeMovies[0] : null 
      })
    } else if (ctrlKey) {
      // Ctrl+click: toggle individual selection - use Set for O(1) lookup
      const isSelected = selectedIds.has(movie.id)
      const newIds = new Set(selectedIds)
      let newSelection: Movie[]
      
      if (isSelected) {
        newIds.delete(movie.id)
        newSelection = get().selectedMovies.filter(m => m.id !== movie.id)
      } else {
        newIds.add(movie.id)
        newSelection = [...get().selectedMovies, movie]
      }
      
      set({ 
        selectedMovies: newSelection,
        selectedIds: newIds,
        selectedMovie: newSelection.length === 1 ? newSelection[0] : null,
        lastSelectedIndex: index 
      })
    } else {
      // Normal click: single selection
      set({ 
        selectedMovies: [movie],
        selectedIds: new Set([movie.id]),
        selectedMovie: movie, 
        lastSelectedIndex: index 
      })
    }
  },
  
  clearSelection: () => set({ selectedMovies: [], selectedIds: new Set(), selectedMovie: null, lastSelectedIndex: null }),
  
  setActiveFilter: (filter) => {
    set({ activeFilter: filter })
    get().clearSelection()
    get().applyFilter()
  },
  setSearchQuery: (() => {
    // Create debounced filter once per store instance
    let debouncedApplyFilter: (() => void) | null = null
    
    return (query: string) => {
      // Update query immediately for responsive UI
      set({ searchQuery: query })
      
      // Debounce the filter application (200ms delay)
      if (!debouncedApplyFilter) {
        debouncedApplyFilter = debounce(() => get().applyFilter(), 200)
      }
      debouncedApplyFilter()
    }
  })(),
  setIsScanning: (isScanning) => set({ isScanning }),
  setScanProgress: (progress) => set({ scanProgress: progress }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortColumn: (column) => set({ sortColumn: column }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  
  // Data operations
  loadMovies: async () => {
    try {
      // Use batch method to get all movies with tags in a single query
      const moviesWithTags = await window.api.getMoviesWithTags()
      
      // Get current selection state (use whatever is current at completion time)
      const { selectedIds: currentSelectedIds } = get()
      
      // Get fresh movie references for selected movies
      const updatedSelectedMovies = moviesWithTags.filter((m: Movie) => currentSelectedIds.has(m.id))
      const updatedSelectedIds = new Set(updatedSelectedMovies.map((m: Movie) => m.id))
      // Always derive selectedMovie from selectedMovies to ensure they stay in sync
      const updatedSelectedMovie = updatedSelectedMovies.length === 1 ? updatedSelectedMovies[0] : null
      
      set({ 
        movies: moviesWithTags,
        selectedMovie: updatedSelectedMovie,
        selectedMovies: updatedSelectedMovies,
        selectedIds: updatedSelectedIds,
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
      const tagTerms: string[] = []
      const textTerms: string[] = []
      
      for (const term of queryTerms) {
        // First, check if term matches a tag in the store's tags list
        let isTagMatch = tags.some(t => t.name.toLowerCase().includes(term))
        
        // Fallback: If not found in store's tags, check if any movie has a matching tag
        if (!isTagMatch) {
          isTagMatch = filtered.some(movie => 
            movie.tags?.some(t => t.name.toLowerCase().includes(term))
          )
        }
        
        if (isTagMatch) {
          tagTerms.push(term)
        } else {
          textTerms.push(term)
        }
      }
      
      // Filter by ALL matched tag terms (AND logic) - search movie.tags directly by name
      if (tagTerms.length > 0) {
        filtered = filtered.filter(movie =>
          tagTerms.every(term => 
            movie.tags?.some(t => t.name.toLowerCase().includes(term))
          )
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
    
    // Clean up invalid selections (movies that no longer exist or don't match filter)
    const movieIds = new Set(movies.map(m => m.id))
    const filteredIds = new Set(filtered.map(m => m.id))
    
    const validSelectedMovies = selectedMovies.filter(m => 
      movieIds.has(m.id) && filteredIds.has(m.id)
    )
    const validSelectedIds = new Set(validSelectedMovies.map(m => m.id))
    const validSelectedMovie = selectedMovie && movieIds.has(selectedMovie.id) && filteredIds.has(selectedMovie.id)
      ? selectedMovie
      : null
    
    set({ 
      filteredMovies: filtered,
      selectedMovies: validSelectedMovies,
      selectedIds: validSelectedIds,
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
      const newSelectedIds = new Set(state.selectedIds)
      newSelectedIds.delete(id)
      const newSelectedMovie = state.selectedMovie?.id === id ? null : state.selectedMovie
      
      return {
        movies: newMovies,
        selectedMovies: newSelectedMovies,
        selectedIds: newSelectedIds,
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
      const newSelectedIds = new Set([...state.selectedIds].filter(id => !idSet.has(id)))
      const newSelectedMovie = state.selectedMovie && !idSet.has(state.selectedMovie.id) 
        ? state.selectedMovie 
        : null
      
      return {
        movies: newMovies,
        selectedMovies: newSelectedMovies,
        selectedIds: newSelectedIds,
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

