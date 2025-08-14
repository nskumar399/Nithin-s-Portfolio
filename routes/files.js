const express = require('express');
const fileController = require('../controllers/fileController');
const fileService = require('../services/fileService');
const { authenticateToken } = require('../middlewares/auth');
const { 
  uploadRateLimit, 
  validateFileUpload 
} = require('../middlewares/security');

const router = express.Router();

// Apply authentication to all file routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The file ID
 *         filename:
 *           type: string
 *           description: The generated filename
 *         originalName:
 *           type: string
 *           description: The original filename
 *         size:
 *           type: integer
 *           description: File size in bytes
 *         mimetype:
 *           type: string
 *           description: File MIME type
 *         uploadedBy:
 *           type: string
 *           description: User ID who uploaded the file
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 */

/**
 * @swagger
 * /api/files/projects/{projectId}/upload:
 *   post:
 *     summary: Upload file to project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CAD file to upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     file:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: No file uploaded or validation error
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 *       413:
 *         description: File too large
 *       429:
 *         description: Too many uploads
 */
router.post('/projects/:projectId/upload', 
  uploadRateLimit,
  fileService.createUploadMiddleware('file'),
  validateFileUpload,
  fileController.uploadFile
);

/**
 * @swagger
 * /api/files/projects/{projectId}/upload-multiple:
 *   post:
 *     summary: Upload multiple files to project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple CAD files to upload
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded or validation error
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 *       429:
 *         description: Too many uploads
 */
router.post('/projects/:projectId/upload-multiple',
  uploadRateLimit,
  fileService.createUploadMiddleware('files', true),
  validateFileUpload,
  fileController.uploadMultipleFiles
);

/**
 * @swagger
 * /api/files/projects/{projectId}/files:
 *   get:
 *     summary: List all files in project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of project files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FileUpload'
 *                     totalFiles:
 *                       type: integer
 *                     totalSize:
 *                       type: integer
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 */
router.get('/projects/:projectId/files', fileController.listProjectFiles);

/**
 * @swagger
 * /api/files/projects/{projectId}/files/{fileId}:
 *   get:
 *     summary: Get file information
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File information
 *       404:
 *         description: Project or file not found
 *       403:
 *         description: Access denied
 */
router.get('/projects/:projectId/files/:fileId', fileController.getFileInfo);

/**
 * @swagger
 * /api/files/projects/{projectId}/files/{fileId}/download:
 *   get:
 *     summary: Download file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Project or file not found
 *       403:
 *         description: Access denied
 */
router.get('/projects/:projectId/files/:fileId/download', fileController.downloadFile);

/**
 * @swagger
 * /api/files/projects/{projectId}/files/{fileId}:
 *   delete:
 *     summary: Delete file from project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: Project or file not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/projects/:projectId/files/:fileId', fileController.deleteFile);

/**
 * @swagger
 * /api/files/projects/{projectId}/versions:
 *   post:
 *     summary: Create new version with files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *               - files
 *             properties:
 *               version:
 *                 type: string
 *                 description: Version number (e.g., "1.1", "2.0")
 *               description:
 *                 type: string
 *                 description: Version description
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files for this version
 *     responses:
 *       201:
 *         description: Version created successfully
 *       400:
 *         description: Validation error or version exists
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/projects/:projectId/versions',
  uploadRateLimit,
  fileService.createUploadMiddleware('files', true),
  validateFileUpload,
  fileController.createVersion
);

/**
 * @swagger
 * /api/files/storage/stats:
 *   get:
 *     summary: Get storage statistics
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         totalFiles:
 *                           type: integer
 *                         totalSize:
 *                           type: integer
 *                         totalSizeMB:
 *                           type: string
 *                         filesByType:
 *                           type: object
 *                         projectsCount:
 *                           type: integer
 *                     system:
 *                       type: object
 */
router.get('/storage/stats', fileController.getStorageStats);

module.exports = router;