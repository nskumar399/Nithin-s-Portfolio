const Project = require('../models/Project');
const fileService = require('../services/fileService');
const logger = require('../services/logger');
const { asyncHandler } = require('../middlewares/errorHandler');
const path = require('path');

class FileController {
  // Upload file to project
  uploadFile = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      // Clean up uploaded file if project not found
      await fileService.deleteFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId, 'editor')) {
      // Clean up uploaded file if no permission
      await fileService.deleteFile(req.file.filename);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to upload files to this project'
      });
    }

    try {
      // Process the uploaded file
      const fileMetadata = await fileService.processUploadedFile(req.file, userId);

      // Add file to project
      project.files.push(fileMetadata);
      await project.save();

      logger.info(`File uploaded to project ${project.name}: ${fileMetadata.originalName}`);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: { file: fileMetadata }
      });
    } catch (error) {
      // Clean up file if processing failed
      await fileService.deleteFile(req.file.filename);
      throw error;
    }
  });

  // Upload multiple files to project
  uploadMultipleFiles = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      // Clean up uploaded files if project not found
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId, 'editor')) {
      // Clean up uploaded files if no permission
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to upload files to this project'
      });
    }

    try {
      // Process all uploaded files
      const filesMetadata = await fileService.processUploadedFiles(req.files, userId);

      // Add files to project
      project.files.push(...filesMetadata);
      await project.save();

      logger.info(`${filesMetadata.length} files uploaded to project ${project.name}`);

      res.status(201).json({
        success: true,
        message: `${filesMetadata.length} files uploaded successfully`,
        data: { files: filesMetadata }
      });
    } catch (error) {
      // Clean up files if processing failed
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      throw error;
    }
  });

  // Download file
  downloadFile = asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;
    const userId = req.user._id;

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find file in project
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    const fileExists = await fileService.fileExists(file.filename);
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    project.analytics.downloads += 1;
    await project.save();

    const filePath = fileService.getFilePath(file.filename);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);
    
    logger.info(`File downloaded: ${file.originalName} from project ${project.name}`);
    
    // Send file
    res.sendFile(path.resolve(filePath));
  });

  // Get file info
  getFileInfo = asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;
    const userId = req.user._id;

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find file in project
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file system info
    const fileSystemInfo = await fileService.getFileInfo(file.filename);

    const fileInfo = {
      id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      exists: fileSystemInfo.exists,
      ...(fileSystemInfo.exists && {
        actualSize: fileSystemInfo.size,
        lastModified: fileSystemInfo.modified
      })
    };

    res.json({
      success: true,
      data: { file: fileInfo }
    });
  });

  // Delete file from project
  deleteFile = asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;
    const userId = req.user._id;

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId, 'editor')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete files from this project'
      });
    }

    // Find file in project
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user is file owner or project owner or admin
    const isOwner = project.owner.equals(userId);
    const isFileUploader = file.uploadedBy.equals(userId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isFileUploader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete files you uploaded'
      });
    }

    // Remove file from project
    project.files.pull(fileId);
    await project.save();

    // Delete file from filesystem
    await fileService.deleteFile(file.filename);

    logger.info(`File deleted: ${file.originalName} from project ${project.name}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  });

  // List files in project
  listProjectFiles = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    }).populate('files.uploadedBy', 'username firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const files = project.files.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      fileType: fileService.getFileExtension(file.originalName)
    }));

    res.json({
      success: true,
      data: {
        files,
        totalFiles: files.length,
        totalSize: project.totalFileSize
      }
    });
  });

  // Create new version with files
  createVersion = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { version, description } = req.body;
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided for version'
      });
    }

    // Find project and check permissions
    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      // Clean up uploaded files
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hasAccess(userId, 'editor')) {
      // Clean up uploaded files
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create versions'
      });
    }

    // Check if version already exists
    const existingVersion = project.versions.find(v => v.version === version);
    if (existingVersion) {
      // Clean up uploaded files
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      return res.status(400).json({
        success: false,
        message: 'Version already exists'
      });
    }

    try {
      // Process uploaded files
      const filesMetadata = await fileService.processUploadedFiles(req.files, userId);

      // Mark all existing versions as not current
      project.versions.forEach(v => {
        v.isCurrent = false;
      });

      // Create new version
      const newVersion = {
        version,
        description,
        files: filesMetadata,
        createdBy: userId,
        isCurrent: true
      };

      project.versions.push(newVersion);
      project.currentVersion = version;
      
      await project.save();

      logger.info(`New version ${version} created for project ${project.name}`);

      res.status(201).json({
        success: true,
        message: 'Version created successfully',
        data: { version: newVersion }
      });
    } catch (error) {
      // Clean up files if processing failed
      const filenames = req.files.map(file => file.filename);
      await fileService.deleteFiles(filenames);
      throw error;
    }
  });

  // Get storage statistics for user
  getStorageStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get all projects owned or collaborated by user
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ],
      isDeleted: false
    });

    let totalFiles = 0;
    let totalSize = 0;
    let filesByType = {};

    projects.forEach(project => {
      project.files.forEach(file => {
        totalFiles++;
        totalSize += file.size;
        
        const extension = fileService.getFileExtension(file.originalName);
        filesByType[extension] = (filesByType[extension] || 0) + 1;
      });
    });

    const systemStats = await fileService.getStorageStats();

    res.json({
      success: true,
      data: {
        user: {
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          filesByType,
          projectsCount: projects.length
        },
        system: systemStats
      }
    });
  });
}

module.exports = new FileController();