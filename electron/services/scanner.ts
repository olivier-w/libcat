import fs from 'fs'
import path from 'path'

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.m4v', '.flv']

export interface VideoFile {
  path: string
  name: string
  size: number
}

export class FileScanner {
  async scanFolder(folderPath: string): Promise<VideoFile[]> {
    const videoFiles: VideoFile[] = []
    await this.scanDirectory(folderPath, videoFiles)
    return videoFiles
  }

  private async scanDirectory(dirPath: string, results: VideoFile[]): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, results)
        } else if (entry.isFile() && this.isVideoFile(entry.name)) {
          const stats = await fs.promises.stat(fullPath)
          results.push({
            path: fullPath,
            name: path.basename(entry.name, path.extname(entry.name)),
            size: stats.size,
          })
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
    }
  }

  isVideoFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase()
    return VIDEO_EXTENSIONS.includes(ext)
  }

  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.promises.stat(filePath)
    } catch {
      return null
    }
  }
}

