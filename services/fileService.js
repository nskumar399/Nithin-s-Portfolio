const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('./logger');

class FileService {
  constructor() {
    this.uploadPath = config.UPLOAD_PATH;
    this.ensureUploadDirectory();
  }

  // Ensure upload directory exists
  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch (error) {
      try {
        await fs.mkdir(this.uploadPath, { recursive: true });
        logger.info('Upload directory created:', this.uploadPath);
      } catch (mkdirError) {
        logger.error('Failed to create upload directory:', mkdirError);
      }
    }
  }

  // Configure multer storage
  getMulterStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `${Date.now()}-${uniqueSuffix}${extension}`;
        cb(null, filename);
      }
    });
  }

  // File filter for allowed types
  getFileFilter() {
    return (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase().slice(1);
      
      if (config.ALLOWED_FILE_TYPES.includes(extension)) {
        cb(null, true);
      } else {
        cb(new Error(`File type .${extension} is not allowed. Allowed types: ${config.ALLOWED_FILE_TYPES.join(', ')}`), false);
      }
    };
  }

  // Create multer upload middleware
  createUploadMiddleware(fieldName = 'file', multiple = false) {
    const upload = multer({
      storage: this.getMulterStorage(),
      fileFilter: this.getFileFilter(),
      limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: multiple ? 10 : 1 // Limit number of files
      }
    });

    return multiple ? upload.array(fieldName, 10) : upload.single(fieldName);
  }

  // Process uploaded file and create file metadata
  async processUploadedFile(file, uploadedBy) {
    try {
      const fileMetadata = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: uploadedBy,
        uploadedAt: new Date()
      };

      logger.info('File processed successfully:', fileMetadata.filename);
      return fileMetadata;
    } catch (error) {
      logger.error('Failed to process uploaded file:', error);
      throw new Error('Failed to process uploaded file');
    }
  }

  // Process multiple uploaded files
  async processUploadedFiles(files, uploadedBy) {
    try {
      const filesMetadata = await Promise.all(
        files.map(file => this.processUploadedFile(file, uploadedBy))
      );

      logger.info(`${filesMetadata.length} files processed successfully`);
      return filesMetadata;
    } catch (error) {
      logger.error('Failed to process uploaded files:', error);
      throw new Error('Failed to process uploaded files');
    }
  }

  // Delete file from filesystem
  async deleteFile(filename) {
    try {
      const filePath = path.join(this.uploadPath, filename);
      await fs.unlink(filePath);
      logger.info('File deleted successfully:', filename);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('File not found for deletion:', filename);
        return true; // File already doesn't exist
      }
      logger.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Delete multiple files
  async deleteFiles(filenames) {
    try {
      const deletePromises = filenames.map(filename => this.deleteFile(filename));
      await Promise.allSettled(deletePromises);
      logger.info(`Deletion attempted for ${filenames.length} files`);
      return true;
    } catch (error) {
      logger.error('Failed to delete files:', error);
      throw new Error('Failed to delete files');
    }
  }

  // Get file info
  async getFileInfo(filename) {
    try {
      const filePath = path.join(this.uploadPath, filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          filename,
          exists: false
        };
      }
      throw error;
    }
  }

  // Check if file exists
  async fileExists(filename) {
    try {
      const filePath = path.join(this.uploadPath, filename);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get file path
  getFilePath(filename) {
    return path.join(this.uploadPath, filename);
  }

  // Generate secure download URL (in a real app, you might use signed URLs)
  generateDownloadUrl(filename, baseUrl) {
    return `${baseUrl}/api/files/download/${filename}`;
  }

  // Validate file extension
  isValidFileType(filename) {
    const extension = path.extname(filename).toLowerCase().slice(1);
    return config.ALLOWED_FILE_TYPES.includes(extension);
  }

  // Get file extension
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  // Calculate storage usage for a user or project
  async calculateStorageUsage(files) {
    let totalSize = 0;
    for (const file of files) {
      if (await this.fileExists(file.filename)) {
        totalSize += file.size;
      }
    }
    return totalSize;
  }

  // Clean up orphaned files (files not referenced in database)
  async cleanupOrphanedFiles(referencedFiles) {
    try {
      const allFiles = await fs.readdir(this.uploadPath);
      const referencedFilenames = new Set(referencedFiles.map(f => f.filename));
      
      let deletedCount = 0;
      for (const filename of allFiles) {
        if (filename !== '.gitkeep' && !referencedFilenames.has(filename)) {
          await this.deleteFile(filename);
          deletedCount++;
        }
      }

      logger.info(`Cleanup completed. Deleted ${deletedCount} orphaned files`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup orphaned files:', error);
      throw new Error('Failed to cleanup orphaned files');
    }
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.uploadPath);
      let totalSize = 0;
      let fileCount = 0;

      for (const filename of files) {
        if (filename !== '.gitkeep') {
          const stats = await fs.stat(path.join(this.uploadPath, filename));
          totalSize += stats.size;
          fileCount++;
        }
      }

      return {
        totalFiles: fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        uploadPath: this.uploadPath
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw new Error('Failed to get storage statistics');
    }
  }
}

module.exports = new FileService();