const express = require('express');
const projectController = require('../controllers/projectController');
const { 
  authenticateToken, 
  requireOwnershipOrAdmin 
} = require('../middlewares/auth');
const { 
  validateProject, 
  validateComment 
} = require('../middlewares/security');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - owner
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the project
 *         name:
 *           type: string
 *           description: The project name
 *         description:
 *           type: string
 *           description: The project description
 *         category:
 *           type: string
 *           enum: [mechanical, architectural, electrical, civil, other]
 *           description: The project category
 *         visibility:
 *           type: string
 *           enum: [private, shared, public]
 *           description: The project visibility
 *         status:
 *           type: string
 *           enum: [draft, active, completed, archived]
 *           description: The project status
 *         owner:
 *           type: string
 *           description: The project owner's user ID
 *         collaborators:
 *           type: array
 *           items:
 *             type: object
 *         files:
 *           type: array
 *           items:
 *             type: object
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

// Apply authentication to all project routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all accessible projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of projects per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search projects
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Authentication required
 */
router.get('/', projectController.getProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               visibility:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/', validateProject, projectController.createProject);

/**
 * @swagger
 * /api/projects/stats:
 *   get:
 *     summary: Get user's project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics
 *       401:
 *         description: Authentication required
 */
router.get('/stats', projectController.getProjectStats);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Authentication required
 */
router.get('/:id', projectController.getProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               visibility:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Authentication required
 */
router.put('/:id', validateProject, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Only project owner can delete
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/collaborators:
 *   post:
 *     summary: Add collaborator to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *     responses:
 *       200:
 *         description: Collaborator added successfully
 *       404:
 *         description: Project or user not found
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Authentication required
 */
router.post('/:id/collaborators', projectController.addCollaborator);

/**
 * @swagger
 * /api/projects/{id}/collaborators/{collaboratorId}:
 *   delete:
 *     summary: Remove collaborator from project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Collaborator user ID
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Authentication required
 */
router.delete('/:id/collaborators/:collaboratorId', projectController.removeCollaborator);

/**
 * @swagger
 * /api/projects/{id}/ai/suggestions:
 *   post:
 *     summary: Get AI design suggestions
 *     tags: [Projects, AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: AI suggestions generated successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *       503:
 *         description: AI service unavailable
 *       401:
 *         description: Authentication required
 */
router.post('/:id/ai/suggestions', projectController.getAISuggestions);

/**
 * @swagger
 * /api/projects/{id}/ai/optimization:
 *   post:
 *     summary: Get AI optimization analysis
 *     tags: [Projects, AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Optimization analysis completed successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *       503:
 *         description: AI service unavailable
 *       401:
 *         description: Authentication required
 */
router.post('/:id/ai/optimization', projectController.getOptimizationAnalysis);

/**
 * @swagger
 * /api/projects/{id}/comments:
 *   post:
 *     summary: Add comment to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied or comments disabled
 *       401:
 *         description: Authentication required
 */
router.post('/:id/comments', validateComment, projectController.addComment);

/**
 * @swagger
 * /api/projects/{id}/like:
 *   post:
 *     summary: Like or unlike project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project liked/unliked successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Authentication required
 */
router.post('/:id/like', projectController.toggleLike);

module.exports = router;