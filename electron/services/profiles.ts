import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

export interface Profile {
  id: string
  name: string
  passwordHash: string | null // null means no password
  createdAt: string
}

interface ProfilesData {
  profiles: Profile[]
  version: number
}

export class ProfileService {
  private profilesPath: string
  private baseDir: string
  private data: ProfilesData

  constructor(userDataPath: string) {
    this.baseDir = userDataPath
    this.profilesPath = path.join(userDataPath, 'profiles.json')
    this.data = this.loadProfiles()
  }

  private loadProfiles(): ProfilesData {
    try {
      if (fs.existsSync(this.profilesPath)) {
        const content = fs.readFileSync(this.profilesPath, 'utf-8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
    return { profiles: [], version: 1 }
  }

  private saveProfiles(): void {
    fs.writeFileSync(this.profilesPath, JSON.stringify(this.data, null, 2))
  }

  private hashPassword(password: string): string {
    // Use PBKDF2 for password hashing (built-in, no external deps)
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }

  private verifyPasswordHash(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  }

  private generateId(): string {
    return crypto.randomBytes(8).toString('hex')
  }

  private sanitizeName(name: string): string {
    // Remove characters that are invalid for folder names
    return name.replace(/[<>:"/\\|?*]/g, '_').trim()
  }

  getProfiles(): Profile[] {
    return this.data.profiles.map(p => ({
      ...p,
      passwordHash: p.passwordHash ? 'protected' : null // Don't expose actual hash
    }))
  }

  getProfile(id: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === id)
  }

  getProfilePath(id: string): string {
    const profile = this.getProfile(id)
    if (!profile) {
      throw new Error(`Profile not found: ${id}`)
    }
    return path.join(this.baseDir, 'profiles', profile.id)
  }

  createProfile(name: string, password?: string): Profile {
    const sanitizedName = this.sanitizeName(name)
    
    if (!sanitizedName) {
      throw new Error('Profile name cannot be empty')
    }

    // Check for duplicate names
    if (this.data.profiles.some(p => p.name.toLowerCase() === sanitizedName.toLowerCase())) {
      throw new Error('A profile with this name already exists')
    }

    const profile: Profile = {
      id: this.generateId(),
      name: sanitizedName,
      passwordHash: password ? this.hashPassword(password) : null,
      createdAt: new Date().toISOString(),
    }

    // Create profile directory
    const profileDir = path.join(this.baseDir, 'profiles', profile.id)
    fs.mkdirSync(profileDir, { recursive: true })
    fs.mkdirSync(path.join(profileDir, 'thumbnails'), { recursive: true })

    this.data.profiles.push(profile)
    this.saveProfiles()

    return {
      ...profile,
      passwordHash: profile.passwordHash ? 'protected' : null
    }
  }

  deleteProfile(id: string): void {
    const index = this.data.profiles.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error('Profile not found')
    }

    // Remove profile directory
    const profileDir = path.join(this.baseDir, 'profiles', id)
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true })
    }

    this.data.profiles.splice(index, 1)
    this.saveProfiles()
  }

  renameProfile(id: string, newName: string): Profile {
    const profile = this.data.profiles.find(p => p.id === id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const sanitizedName = this.sanitizeName(newName)
    if (!sanitizedName) {
      throw new Error('Profile name cannot be empty')
    }

    // Check for duplicate names (excluding current profile)
    if (this.data.profiles.some(p => p.id !== id && p.name.toLowerCase() === sanitizedName.toLowerCase())) {
      throw new Error('A profile with this name already exists')
    }

    profile.name = sanitizedName
    this.saveProfiles()

    return {
      ...profile,
      passwordHash: profile.passwordHash ? 'protected' : null
    }
  }

  verifyPassword(id: string, password: string): boolean {
    const profile = this.data.profiles.find(p => p.id === id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    if (!profile.passwordHash) {
      // No password required
      return true
    }

    return this.verifyPasswordHash(password, profile.passwordHash)
  }

  hasPassword(id: string): boolean {
    const profile = this.data.profiles.find(p => p.id === id)
    return profile?.passwordHash !== null
  }

  // Migrate existing data to a default profile
  migrateExistingData(): Profile | null {
    const oldDbPath = path.join(this.baseDir, 'libcat.db')
    const oldThumbDir = path.join(this.baseDir, 'thumbnails')

    // Check if there's existing data to migrate
    if (!fs.existsSync(oldDbPath)) {
      return null
    }

    // Create default profile
    const profile: Profile = {
      id: this.generateId(),
      name: 'Default',
      passwordHash: null,
      createdAt: new Date().toISOString(),
    }

    const profileDir = path.join(this.baseDir, 'profiles', profile.id)
    fs.mkdirSync(profileDir, { recursive: true })

    // Move database
    fs.renameSync(oldDbPath, path.join(profileDir, 'libcat.db'))

    // Move thumbnails if they exist
    if (fs.existsSync(oldThumbDir)) {
      fs.renameSync(oldThumbDir, path.join(profileDir, 'thumbnails'))
    } else {
      fs.mkdirSync(path.join(profileDir, 'thumbnails'), { recursive: true })
    }

    // Also move WAL files if they exist
    const walPath = path.join(this.baseDir, 'libcat.db-wal')
    const shmPath = path.join(this.baseDir, 'libcat.db-shm')
    if (fs.existsSync(walPath)) {
      fs.renameSync(walPath, path.join(profileDir, 'libcat.db-wal'))
    }
    if (fs.existsSync(shmPath)) {
      fs.renameSync(shmPath, path.join(profileDir, 'libcat.db-shm'))
    }

    this.data.profiles.push(profile)
    this.saveProfiles()

    console.log('Migrated existing data to Default profile')

    return {
      ...profile,
      passwordHash: null
    }
  }
}


