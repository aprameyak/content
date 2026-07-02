import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from './logger';

export interface StorageService {
  uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  appendChunk(key: string, chunk: Buffer): Promise<void>;
  getPublicUrl(key: string): string;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
  getFileSize(key: string): Promise<number>;
}

class LocalStorageService implements StorageService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
  }

  private fullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async uploadFile(key: string, buffer: Buffer, _mimeType: string): Promise<void> {
    const filePath = this.fullPath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);
    logger.debug('File uploaded', { key, size: buffer.length });
  }

  async appendChunk(key: string, chunk: Buffer): Promise<void> {
    const filePath = this.fullPath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.appendFile(filePath, chunk);
  }

  getPublicUrl(key: string): string {
    return `${config.CDN_BASE_URL}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = this.fullPath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.debug('File deleted', { key });
    }
  }

  async fileExists(key: string): Promise<boolean> {
    return fs.existsSync(this.fullPath(key));
  }

  async getFileSize(key: string): Promise<number> {
    const stat = await fs.promises.stat(this.fullPath(key));
    return stat.size;
  }
}

let storageInstance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!storageInstance) {
    if (config.STORAGE_TYPE === 'local') {
      storageInstance = new LocalStorageService(config.LOCAL_STORAGE_PATH);
    } else {
      // S3 would be initialized here
      throw new Error('S3 storage not yet implemented — set STORAGE_TYPE=local');
    }
  }
  return storageInstance;
}

export function generateVideoKey(userId: string, date: string): string {
  return `videos/${userId}/${date}-${Date.now()}.mp4`;
}

export function generateThumbnailKey(videoKey: string): string {
  return videoKey.replace('.mp4', '-thumb.jpg');
}

export function generateAvatarKey(userId: string): string {
  return `avatars/${userId}-${Date.now()}.jpg`;
}
