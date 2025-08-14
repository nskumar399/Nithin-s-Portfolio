const Project = require('../models/Project');
const User = require('../models/User');
const aiService = require('../services/aiService');
const fileService = require('../services/fileService');
const logger = require('../services/logger');
const { asyncHandler } = require('../middlewares/errorHandler');

class ProjectController {
  // Get all projects accessible by user
  getProjects = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      visibility,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user._id;
    const options = {
      category,
      status,
      search,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    // Build query based on visibility and user access
    let query = {
      isDeleted: false,
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    };

    // Include public projects if not filtering by specific visibility
    if (!visibility || visibility === 'public') {
      query.$or.push({ visibility: 'public' });
    }

    // Apply filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility && visibility !== 'all') query.visibility = visibility;
    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .populate('owner', 'username firstName lastName profile.avatar')
      .populate('collaborators.user', 'username firstName lastName profile.avatar')
      .sort(options.sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProjects: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  });

  // Get single project
  getProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('owner', 'username firstName lastName profile.avatar')
      .populate('collaborators.user', 'username firstName lastName profile.avatar')
      .populate('comments.author', 'username firstName lastName profile.avatar')
      .populate('comments.replies.author', 'username firstName lastName profile.avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access permissions
    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count if not owner
    if (!project.owner._id.equals(userId)) {
      project.analytics.views += 1;
      await project.save();
    }

    res.json({
      success: true,
      data: { project }
    });
  });

  // Create new project
  createProject = asyncHandler(async (req, res) => {
    const {
      name,
      description,
      category = 'mechanical',
      visibility = 'private',
      tags = [],
      metadata = {}
    } = req.body;

    const project = new Project({
      name,
      description,
      category,
      visibility,
      tags,
      metadata,
      owner: req.user._id
    });

    await project.save();
    await project.populate('owner', 'username firstName lastName profile.avatar');

    logger.info(`New project created: ${project.name} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  });

  // Update project
  updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has edit permissions
    if (!project.hasAccess(userId, 'editor')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to edit this project'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'category', 'visibility', 'tags', 'metadata', 'settings'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(project, updates);
    await project.save();
    await project.populate('owner', 'username firstName lastName profile.avatar');
    await project.populate('collaborators.user', 'username firstName lastName profile.avatar');

    logger.info(`Project updated: ${project.name} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  });

  // Delete project (soft delete)
  deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner or admin can delete
    if (!project.owner.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete this project'
      });
    }

    // Soft delete
    project.isDeleted = true;
    project.deletedAt = new Date();
    project.deletedBy = userId;
    await project.save();

    logger.info(`Project deleted: ${project.name} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  });

  // Add collaborator to project
  addCollaborator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, role = 'viewer' } = req.body;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has admin permissions on project
    if (!project.hasAccess(userId, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to add collaborators'
      });
    }

    // Find user to add
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't add owner as collaborator
    if (project.owner.equals(userToAdd._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add project owner as collaborator'
      });
    }

    await project.addCollaborator(userToAdd._id, role, userId);
    await project.populate('collaborators.user', 'username firstName lastName profile.avatar');

    logger.info(`Collaborator added to ${project.name}: ${username} as ${role}`);

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: {
        collaborator: {
          user: userToAdd,
          role,
          addedAt: new Date()
        }
      }
    });
  });

  // Remove collaborator from project
  removeCollaborator = asyncHandler(async (req, res) => {
    const { id, collaboratorId } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has admin permissions on project
    if (!project.hasAccess(userId, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove collaborators'
      });
    }

    await project.removeCollaborator(collaboratorId);

    logger.info(`Collaborator removed from ${project.name}`);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  });

  // Get AI suggestions for project
  getAISuggestions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable'
      });
    }

    try {
      const suggestions = await aiService.generateDesignSuggestions(
        project.description,
        project.category
      );

      // Save suggestions to project
      project.aiInsights.push(...suggestions);
      await project.save();

      logger.info(`AI suggestions generated for project: ${project.name}`);

      res.json({
        success: true,
        message: 'AI suggestions generated successfully',
        data: { suggestions }
      });
    } catch (error) {
      logger.error('Failed to generate AI suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI suggestions'
      });
    }
  });

  // Get project optimization analysis
  getOptimizationAnalysis = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    if (!aiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable'
      });
    }

    try {
      const optimizations = await aiService.analyzeDesignOptimization(project);

      // Save optimizations to project
      project.aiInsights.push(...optimizations);
      await project.save();

      logger.info(`Optimization analysis completed for project: ${project.name}`);

      res.json({
        success: true,
        message: 'Optimization analysis completed successfully',
        data: { optimizations }
      });
    } catch (error) {
      logger.error('Failed to analyze optimization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze optimization'
      });
    }
  });

  // Add comment to project
  addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    if (!project.settings.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Comments are disabled for this project'
      });
    }

    const comment = {
      author: userId,
      content
    };

    project.comments.push(comment);
    await project.save();
    await project.populate('comments.author', 'username firstName lastName profile.avatar');

    const newComment = project.comments[project.comments.length - 1];

    logger.info(`Comment added to project ${project.name} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  });

  // Like/unlike project
  toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    const likeIndex = project.likes.indexOf(userId);
    let action;

    if (likeIndex > -1) {
      // Unlike
      project.likes.splice(likeIndex, 1);
      action = 'unliked';
    } else {
      // Like
      project.likes.push(userId);
      action = 'liked';
    }

    await project.save();

    res.json({
      success: true,
      message: `Project ${action} successfully`,
      data: {
        liked: action === 'liked',
        likesCount: project.likes.length
      }
    });
  });

  // Get project statistics
  getProjectStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const stats = await Project.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'collaborators.user': userId }
          ],
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalDownloads: { $sum: '$analytics.downloads' },
          totalFiles: { $sum: { $size: '$files' } },
          categories: { $push: '$category' },
          statuses: { $push: '$status' }
        }
      }
    ]);

    const result = stats[0] || {
      totalProjects: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalFiles: 0,
      categories: [],
      statuses: []
    };

    // Count by category
    const categoryCount = {};
    result.categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Count by status
    const statusCount = {};
    result.statuses.forEach(status => {
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalProjects: result.totalProjects,
        totalViews: result.totalViews,
        totalDownloads: result.totalDownloads,
        totalFiles: result.totalFiles,
        categoryBreakdown: categoryCount,
        statusBreakdown: statusCount
      }
    });
  });
}

module.exports = new ProjectController();