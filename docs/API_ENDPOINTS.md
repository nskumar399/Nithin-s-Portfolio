# API Endpoint Documentation

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "24h"
    }
  }
}
```

### POST /api/auth/login
Authenticate user and get access tokens.

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123!"
}
```

### GET /api/auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

## Project Endpoints

### GET /api/projects
Get all accessible projects with pagination and filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `category` - Filter by category
- `status` - Filter by status
- `search` - Search projects
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc)

### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "My CAD Project",
  "description": "Project description",
  "category": "mechanical",
  "visibility": "private",
  "tags": ["automotive", "engine"]
}
```

### GET /api/projects/{id}
Get specific project details.

### PUT /api/projects/{id}
Update project (requires editor access).

### DELETE /api/projects/{id}
Delete project (requires ownership).

### POST /api/projects/{id}/collaborators
Add collaborator to project.

**Request Body:**
```json
{
  "username": "collaborator_username",
  "role": "editor"
}
```

### POST /api/projects/{id}/ai/suggestions
Get AI design suggestions for project.

### POST /api/projects/{id}/ai/optimization
Get AI optimization analysis for project.

## File Endpoints

### POST /api/files/projects/{projectId}/upload
Upload file to project.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - CAD file to upload

**Supported file types:** .dwg, .dxf, .step, .stp, .iges, .igs, .stl, .obj

### GET /api/files/projects/{projectId}/files
List all files in project.

### GET /api/files/projects/{projectId}/files/{fileId}/download
Download specific file.

### DELETE /api/files/projects/{projectId}/files/{fileId}
Delete file from project.

### POST /api/files/projects/{projectId}/versions
Create new project version with files.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `version` - Version number (e.g., "1.1")
- `description` - Version description
- `files` - Array of files for this version

## System Endpoints

### GET /health
System health check.

### GET /api/docs
Interactive API documentation (Swagger UI).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field validation error"
    }
  ]
}
```

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Authentication Required
- `403` - Forbidden / Insufficient Permissions
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Authentication: 5 requests per 15 minutes per IP
- File Upload: 10 requests per hour per IP

## WebSocket Events

The server supports real-time collaboration via WebSocket:

### Client Events (sent to server):
- `join-project` - Join project room
- `leave-project` - Leave project room
- `project-update` - Broadcast project changes
- `cursor-position` - Share cursor position
- `typing-start/stop` - Typing indicators

### Server Events (sent to client):
- `connected` - Connection established
- `user-joined-project` - User joined project
- `user-left-project` - User left project
- `project-updated` - Project was updated
- `file-upload-progress` - File upload progress
- `new-design-comment` - New comment added
- `user-status-changed` - User online/offline status