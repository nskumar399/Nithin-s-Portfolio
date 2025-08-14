const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters long'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  category: {
    type: String,
    enum: ['mechanical', 'architectural', 'electrical', 'civil', 'other'],
    default: 'mechanical'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  files: [fileSchema],
  versions: [{
    version: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Version description cannot exceed 500 characters']
    },
    files: [fileSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  }],
  currentVersion: {
    type: String,
    default: '1.0'
  },
  metadata: {
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['mm', 'cm', 'in', 'ft', 'm'],
        default: 'mm'
      }
    },
    material: {
      type: String,
      maxlength: [100, 'Material name cannot exceed 100 characters']
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'kg'
      }
    },
    tolerances: {
      general: String,
      specific: [{
        dimension: String,
        tolerance: String
      }]
    }
  },
  aiInsights: [{
    type: {
      type: String,
      enum: ['suggestion', 'optimization', 'validation', 'analysis'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    isImplemented: {
      type: Boolean,
      default: false
    },
    implementedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    implementedAt: Date,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: [{
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: String,
      enum: ['view', 'comment', 'edit'],
      default: 'view'
    }
  }],
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    }
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowForks: {
      type: Boolean,
      default: true
    },
    notifyOnChanges: {
      type: Boolean,
      default: true
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });
projectSchema.index({ category: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ 'collaborators.user': 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for total file size
projectSchema.virtual('totalFileSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Virtual for collaborator count
projectSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators.length;
});

// Method to check if user has access to project
projectSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  // Owner has full access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }

  // Check if user is a collaborator
  const collaboration = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );

  if (!collaboration) {
    return this.visibility === 'public';
  }

  // Define role hierarchy
  const roleHierarchy = { viewer: 0, editor: 1, admin: 2 };
  return roleHierarchy[collaboration.role] >= roleHierarchy[requiredRole];
};

// Method to add collaborator
projectSchema.methods.addCollaborator = function(userId, role, addedBy) {
  const existingCollaboration = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );

  if (existingCollaboration) {
    existingCollaboration.role = role;
    return this.save();
  }

  this.collaborators.push({
    user: userId,
    role,
    addedBy
  });

  return this.save();
};

// Method to remove collaborator
projectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find projects accessible by user
projectSchema.statics.findAccessibleProjects = function(userId, options = {}) {
  const query = {
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
      { visibility: 'public' }
    ],
    isDeleted: false
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.status) {
    query.status = options.status;
  }

  if (options.search) {
    query.$text = { $search: options.search };
  }

  return this.find(query)
    .populate('owner', 'username firstName lastName avatar')
    .populate('collaborators.user', 'username firstName lastName avatar')
    .sort(options.sort || { createdAt: -1 });
};

module.exports = mongoose.model('Project', projectSchema);