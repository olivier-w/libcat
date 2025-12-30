import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

export interface VideoMetadata {
  thumbnailPath: string
  duration: number | null
}

interface QueueItem {
  videoPath: string
  thumbnailPath: string
  resolve: (result: VideoMetadata) => void
  reject: (error: Error) => void
}

export class ThumbnailService {
  private thumbnailDir: string
  private queue: QueueItem[] = []
  private processing = false

  constructor(userDataPath: string) {
    this.thumbnailDir = path.join(userDataPath, 'thumbnails')
    
    // Ensure thumbnail directory exists
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true })
    }
  }

  async getVideoDuration(videoPath: string): Promise<number | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err || !metadata.format.duration) {
          resolve(null)
        } else {
          resolve(metadata.format.duration)
        }
      })
    })
  }

  async generateThumbnail(videoPath: string, force = false): Promise<VideoMetadata> {
    const hash = crypto.createHash('md5').update(videoPath).digest('hex')
    const thumbnailPath = path.join(this.thumbnailDir, `${hash}.jpg`)

    // Get duration first
    const duration = await this.getVideoDuration(videoPath)

    // Return existing thumbnail unless force regenerate
    if (!force && fs.existsSync(thumbnailPath)) {
      return { thumbnailPath, duration }
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ 
        videoPath,
        thumbnailPath,
        resolve: (result) => resolve({ ...result, duration }), 
        reject 
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const item = this.queue.shift()!

    try {
      await this.extractFrame(item.videoPath, item.thumbnailPath)
      item.resolve({ thumbnailPath: item.thumbnailPath, duration: null })
    } catch (error) {
      item.reject(error as Error)
    } finally {
      this.processing = false
      this.processQueue()
    }
  }

  private extractFrame(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, get video duration
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          // If ffprobe fails, try to capture at 1 second
          this.captureFrame(videoPath, outputPath, '00:00:01', resolve, reject)
          return
        }

        const duration = metadata.format.duration || 10
        // Capture at 10% of the video
        const seekTime = Math.floor(duration * 0.1)
        const timestamp = this.formatTimestamp(seekTime)

        this.captureFrame(videoPath, outputPath, timestamp, resolve, reject)
      })
    })
  }

  private captureFrame(
    videoPath: string,
    outputPath: string,
    timestamp: string,
    resolve: () => void,
    reject: (error: Error) => void
  ) {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .size('400x?')  // 400px width, maintain aspect ratio
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  async copyCustomThumbnail(sourcePath: string): Promise<string> {
    const hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex')
    const ext = path.extname(sourcePath)
    const thumbnailPath = path.join(this.thumbnailDir, `custom_${hash}${ext}`)

    await fs.promises.copyFile(sourcePath, thumbnailPath)
    return thumbnailPath
  }
}

