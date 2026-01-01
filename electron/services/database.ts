import Database from 'better-sqlite3'
import path from 'path'

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

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export class DatabaseService {
  private db: Database.Database

  constructor(userDataPath: string) {
    const dbPath = path.join(userDataPath, 'libcat.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initialize()
  }

  private initialize() {
    // Create movies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        title TEXT,
        year INTEGER,
        rating INTEGER CHECK(rating >= 0 AND rating <= 5),
        notes TEXT,
        watched INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0,
        thumbnail_path TEXT,
        file_size INTEGER,
        duration REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add new columns if they don't exist (for existing databases)
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN file_size INTEGER`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN duration REAL`) } catch (e) { /* exists */ }
    // TMDB columns
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_id INTEGER`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_poster_path TEXT`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_rating REAL`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_overview TEXT`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_director TEXT`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_cast TEXT`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_release_date TEXT`) } catch (e) { /* exists */ }
    try { this.db.exec(`ALTER TABLE movies ADD COLUMN tmdb_genres TEXT`) } catch (e) { /* exists */ }

    // Settings table
    this.db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)

    // Create tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#f4a261',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add created_at column to existing tags table if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE tags ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`)
    } catch (e) { /* column already exists */ }

    // Create movie_tags junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS movie_tags (
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, tag_id)
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_watched ON movies(watched);
      CREATE INDEX IF NOT EXISTS idx_movies_favorite ON movies(favorite);
      CREATE INDEX IF NOT EXISTS idx_movie_tags_movie ON movie_tags(movie_id);
      CREATE INDEX IF NOT EXISTS idx_movie_tags_tag ON movie_tags(tag_id);
    `)
  }

  // Movies CRUD
  getAllMovies(): Movie[] {
    return this.db.prepare('SELECT * FROM movies ORDER BY title ASC').all() as Movie[]
  }

  // Get all movies with their tags in a single query (avoids N+1 problem)
  getAllMoviesWithTags(): (Movie & { tags: Tag[] })[] {
    // Fetch all movies
    const movies = this.db.prepare('SELECT * FROM movies ORDER BY title ASC').all() as Movie[]
    
    if (movies.length === 0) {
      return []
    }

    // Fetch all movie-tag associations with tag data in a single query
    // Use IFNULL for created_at to handle databases where the column might not exist or be null
    let movieTags: { movie_id: number; id: number; name: string; color: string; created_at: string | null }[]
    try {
      movieTags = this.db.prepare(`
        SELECT mt.movie_id, t.id, t.name, t.color, t.created_at
        FROM movie_tags mt
        INNER JOIN tags t ON t.id = mt.tag_id
        ORDER BY t.name ASC
      `).all() as { movie_id: number; id: number; name: string; color: string; created_at: string | null }[]
    } catch (e: unknown) {
      // Fallback if created_at column doesn't exist
      if (e instanceof Error && e.message.includes('no such column')) {
        movieTags = this.db.prepare(`
          SELECT mt.movie_id, t.id, t.name, t.color, NULL as created_at
          FROM movie_tags mt
          INNER JOIN tags t ON t.id = mt.tag_id
          ORDER BY t.name ASC
        `).all() as { movie_id: number; id: number; name: string; color: string; created_at: null }[]
      } else {
        throw e
      }
    }

    // Group tags by movie_id for O(1) lookup
    const tagsByMovieId = new Map<number, Tag[]>()
    for (const row of movieTags) {
      const tag: Tag = { id: row.id, name: row.name, color: row.color, created_at: row.created_at || '' }
      const existing = tagsByMovieId.get(row.movie_id)
      if (existing) {
        existing.push(tag)
      } else {
        tagsByMovieId.set(row.movie_id, [tag])
      }
    }

    // Combine movies with their tags
    return movies.map(movie => ({
      ...movie,
      tags: tagsByMovieId.get(movie.id) || []
    }))
  }

  getMovieById(id: number): Movie | undefined {
    return this.db.prepare('SELECT * FROM movies WHERE id = ?').get(id) as Movie | undefined
  }

  getMovieByPath(filePath: string): Movie | undefined {
    return this.db.prepare('SELECT * FROM movies WHERE file_path = ?').get(filePath) as Movie | undefined
  }

  addMovie(data: { 
    file_path: string; 
    title?: string; 
    thumbnail_path?: string | null;
    file_size?: number | null;
    duration?: number | null;
  }): Movie {
    const stmt = this.db.prepare(`
      INSERT INTO movies (file_path, title, thumbnail_path, file_size, duration)
      VALUES (@file_path, @title, @thumbnail_path, @file_size, @duration)
    `)
    
    const result = stmt.run({
      file_path: data.file_path,
      title: data.title || path.basename(data.file_path, path.extname(data.file_path)),
      thumbnail_path: data.thumbnail_path || null,
      file_size: data.file_size || null,
      duration: data.duration || null,
    })

    return this.getMovieById(result.lastInsertRowid as number)!
  }

  updateMovie(id: number, data: Partial<Omit<Movie, 'id' | 'created_at'>>): Movie {
    // Whitelist of valid database columns (excluding id, created_at, updated_at)
    const validColumns = ['file_path', 'title', 'year', 'rating', 'notes', 'watched', 'favorite', 'thumbnail_path', 'file_size', 'duration', 'tmdb_id', 'tmdb_poster_path', 'tmdb_rating', 'tmdb_overview', 'tmdb_director', 'tmdb_cast', 'tmdb_release_date', 'tmdb_genres']
    
    // Filter and process only valid columns with defined values
    const processedData: any = { id }
    const fields: string[] = []
    
    for (const [key, value] of Object.entries(data)) {
      // Only process valid database columns
      if (!validColumns.includes(key)) {
        continue
      }
      
      // Skip undefined values
      if (value === undefined) {
        continue
      }
      
      // Convert boolean values to integers for SQLite
      if (typeof value === 'boolean') {
        processedData[key] = value ? 1 : 0
        fields.push(`${key} = @${key}`)
      } 
      // Handle null values
      else if (value === null) {
        processedData[key] = null
        fields.push(`${key} = @${key}`)
      }
      // Handle string values
      else if (typeof value === 'string') {
        processedData[key] = value
        fields.push(`${key} = @${key}`)
      }
      // Handle number values (but skip NaN and Infinity)
      else if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          // Skip invalid numbers
          continue
        }
        processedData[key] = value
        fields.push(`${key} = @${key}`)
      }
      // Skip any other types (objects, arrays, etc.)
    }

    if (fields.length > 0) {
      const stmt = this.db.prepare(`
        UPDATE movies 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `)
      stmt.run(processedData)
    }

    return this.getMovieById(id)!
  }

  deleteMovie(id: number): void {
    this.db.prepare('DELETE FROM movies WHERE id = ?').run(id)
  }

  getMoviesByFilter(filter: string): Movie[] {
    switch (filter) {
      case 'untagged':
        return this.db.prepare(`
          SELECT m.* FROM movies m
          LEFT JOIN movie_tags mt ON m.id = mt.movie_id
          WHERE mt.tag_id IS NULL
          ORDER BY m.title ASC
        `).all() as Movie[]
      
      case 'watched':
        return this.db.prepare('SELECT * FROM movies WHERE watched = 1 ORDER BY title ASC').all() as Movie[]
      
      case 'favorites':
        return this.db.prepare('SELECT * FROM movies WHERE favorite = 1 ORDER BY title ASC').all() as Movie[]
      
      default:
        return this.getAllMovies()
    }
  }

  searchMovies(query: string): Movie[] {
    const searchQuery = `%${query}%`
    return this.db.prepare(`
      SELECT * FROM movies 
      WHERE title LIKE ? OR notes LIKE ? OR file_path LIKE ?
      ORDER BY title ASC
    `).all(searchQuery, searchQuery, searchQuery) as Movie[]
  }

  // Tags CRUD
  getAllTags(): Tag[] {
    // Check if created_at column exists, if not order by id (newest first)
    try {
      // Try to order by created_at first
      const result = this.db.prepare('SELECT * FROM tags ORDER BY created_at DESC').all() as Tag[]
      return result
    } catch (e: any) {
      // If created_at doesn't exist, order by id DESC (newest first)
      if (e.message && e.message.includes('no such column: created_at')) {
        return this.db.prepare('SELECT * FROM tags ORDER BY id DESC').all() as Tag[]
      }
      // For any other error, just return tags without ordering
      return this.db.prepare('SELECT * FROM tags').all() as Tag[]
    }
  }

  getTagById(id: number): Tag | undefined {
    return this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined
  }

  createTag(name: string, color: string = '#f4a261'): Tag {
    const stmt = this.db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
    const result = stmt.run(name, color)
    return this.getTagById(result.lastInsertRowid as number)!
  }

  updateTag(id: number, name: string, color: string): Tag {
    this.db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(name, color, id)
    return this.getTagById(id)!
  }

  deleteTag(id: number): void {
    // First, remove the tag from all movies (explicit deletion for safety)
    this.db.prepare('DELETE FROM movie_tags WHERE tag_id = ?').run(id)
    // Then delete the tag itself
    this.db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  }

  // Movie-Tag associations
  addTagToMovie(movieId: number, tagId: number): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO movie_tags (movie_id, tag_id) VALUES (?, ?)
    `).run(movieId, tagId)
  }

  removeTagFromMovie(movieId: number, tagId: number): void {
    this.db.prepare('DELETE FROM movie_tags WHERE movie_id = ? AND tag_id = ?').run(movieId, tagId)
  }

  getTagsForMovie(movieId: number): Tag[] {
    return this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE mt.movie_id = ?
      ORDER BY t.name ASC
    `).all(movieId) as Tag[]
  }

  getMoviesByTag(tagId: number): Movie[] {
    return this.db.prepare(`
      SELECT m.* FROM movies m
      INNER JOIN movie_tags mt ON m.id = mt.movie_id
      WHERE mt.tag_id = ?
      ORDER BY m.title ASC
    `).all(tagId) as Movie[]
  }

  // Settings
  getSetting(key: string): string | null {
    const result = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return result?.value ?? null
  }

  setSetting(key: string, value: string): void {
    this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
  }

  deleteSetting(key: string): void {
    this.db.prepare('DELETE FROM settings WHERE key = ?').run(key)
  }

  // TMDB
  unlinkTmdb(movieId: number): Movie {
    this.db.prepare(`UPDATE movies SET tmdb_id = NULL, tmdb_poster_path = NULL, tmdb_rating = NULL, tmdb_overview = NULL, tmdb_director = NULL, tmdb_cast = NULL, tmdb_release_date = NULL, tmdb_genres = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(movieId)
    return this.getMovieById(movieId)!
  }
}

