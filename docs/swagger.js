const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config/config');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CAD Design Backend API',
    version: '1.0.0',
    description: 'AI-powered mechanical/CAD design software backend API with comprehensive features for project management, file handling, and real-time collaboration.',
    contact: {
      name: 'Nithin Satya Kumar',
      email: 'bnskumar399@gmail.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'Authentication required'
                }
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'Insufficient permissions'
                }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'Resource not found'
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'Validation failed'
                },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'Internal server error'
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'System',
      description: 'System health and information endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication and account management'
    },
    {
      name: 'Projects',
      description: 'CAD project management and collaboration'
    },
    {
      name: 'Files',
      description: 'File upload, download, and version management'
    },
    {
      name: 'AI',
      description: 'AI-powered design assistance and optimization'
    }
  ]
};

// Options for the swagger docs
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Custom CSS for Swagger UI
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { 
      background-color: #0073e6; 
    }
    .swagger-ui .topbar .download-url-wrapper { 
      display: none; 
    }
    .swagger-ui .info .title { 
      color: #0073e6; 
    }
    .swagger-ui .scheme-container { 
      background: #f8f9fa; 
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 10px;
      margin: 10px 0;
    }
  `,
  customSiteTitle: "CAD Design API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelExpandDepth: 2,
    defaultModelsExpandDepth: 2,
    displayOperationId: false,
    tryItOutEnabled: true
  }
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};