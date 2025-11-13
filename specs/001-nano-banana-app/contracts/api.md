# API Contracts

**Date**: 2025-11-13
**Status**: Complete
**Format**: OpenAPI 3.0 (YAML equivalent, specified here as Markdown for readability)

## Backend API Overview

The backend exposes RESTful HTTP endpoints for the frontend to:
1. Generate images from text prompts (FR-001)
2. Edit images with AI-generated variants (FR-005)
3. Retrieve session history and settings (FR-009)
4. Manage session data

All responses are JSON. Authentication is handled via session ID (from localStorage).

---

## Endpoints

### POST /api/generate

**Purpose**: Generate images from a text prompt (text-to-image)

**Request Body**:
```json
{
  "prompt": "string (required, 1-1000 chars)",
  "size": "string (optional, default: '1024x768')",
  "style": "string (optional, default: 'default')",
  "aspectRatio": "string (optional, default: '16:9')"
}
```

**Allowed Values**:
- `size`: "512x512", "768x768", "1024x768", "1024x1024"
- `style`: "default", "modern", "minimalist", "artistic", "photorealistic"
- `aspectRatio`: "1:1", "4:3", "16:9", "9:16"

**Response (200 OK)**:
```json
{
  "requestId": "uuid",
  "status": "completed",
  "images": [
    {
      "id": "uuid",
      "url": "data:image/png;base64,..." | "https://...",
      "width": 1024,
      "height": 768,
      "format": "png" | "jpeg"
    }
  ],
  "createdAt": "2025-11-13T12:00:00Z"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "string",
  "details": "string"
}
```
Example: `error: "Invalid prompt"`, `details: "Prompt exceeds 1000 characters"`

**Response (500 Server Error)**:
```json
{
  "error": "Generation failed",
  "details": "Nano Banana API error: [original error]"
}
```

**Implementation Notes**:
- Backend proxies request to kie.ai Nano Banana text-only endpoint
- API key retrieved from `process.env.NANO_BANANA_API_KEY`
- Timeout: 30 seconds (generous for image generation)
- Returns base64-encoded image data or public download URLs
- Frontend displays previews immediately (FR-003)

---

### POST /api/edit

**Purpose**: Edit uploaded images with AI-generated variants (image editing)

**Request Body** (multipart/form-data):
```
files: File[] (1-10 images, JPEG/PNG, max 10MB each)
editPrompt: string (1-1000 chars)
style: string (optional, default: 'default')
aspectRatio: string (optional, default: '16:9')
```

**Response (200 OK)**:
```json
{
  "requestId": "uuid",
  "status": "completed",
  "variants": [
    {
      "id": "uuid",
      "url": "data:image/png;base64,...",
      "width": 1024,
      "height": 768,
      "format": "png" | "jpeg"
    }
  ],
  "createdAt": "2025-11-13T12:00:00Z"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Invalid request",
  "details": "string (e.g., 'Too many files: 12 exceeds limit of 10')"
}
```

**Response (500 Server Error)**:
```json
{
  "error": "Edit failed",
  "details": "Nano Banana API error: [original error]"
}
```

**Implementation Notes**:
- Backend proxies request to kie.ai Nano Banana edit endpoint
- Validates file count (1-10 per FR-012)
- Validates file type (JPEG/PNG) and size (<10MB)
- Returns edited image variants (FR-008)
- Images not persisted to server (per spec)
- Timeout: 45 seconds (image editing may take longer)

---

### GET /api/session

**Purpose**: Retrieve current session data (settings and history)

**Query Parameters**: None (uses sessionId from header or cookie)

**Response (200 OK)**:
```json
{
  "sessionId": "uuid",
  "recentPrompts": ["prompt1", "prompt2", ...],
  "recentEditPrompts": ["edit1", "edit2", ...],
  "preferredSize": "1024x768",
  "preferredStyle": "default",
  "preferredAspectRatio": "16:9",
  "lastActiveMode": "generation" | "edit",
  "generationHistory": [
    {
      "id": "uuid",
      "prompt": "string",
      "size": "string",
      "createdAt": "ISO8601"
    }
  ],
  "editHistory": [
    {
      "id": "uuid",
      "editPrompt": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Invalid or missing session"
}
```

**Implementation Notes**:
- Session ID passed via `X-Session-ID` header or `sessionId` cookie
- Returns user's settings and history for quick iteration (FR-009)
- History limited to last 10 requests per type
- No image data returned here (images handled separately)

---

### POST /api/session

**Purpose**: Create or update session (happens on app load)

**Request Body**:
```json
{
  "sessionId": "uuid (optional, generated if missing)"
}
```

**Response (201 Created)** or **(200 OK)**:
```json
{
  "sessionId": "uuid",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

**Implementation Notes**:
- Creates new session if sessionId not provided
- Returns sessionId for client to store in localStorage
- Initializes default preferences

---

### POST /api/session/preferences

**Purpose**: Update user preferences (size, style, etc.)

**Request Body**:
```json
{
  "preferredSize": "string",
  "preferredStyle": "string",
  "preferredAspectRatio": "string",
  "lastActiveMode": "generation" | "edit"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "updated": {
    "preferredSize": "1024x768",
    "preferredStyle": "modern",
    "preferredAspectRatio": "16:9",
    "lastActiveMode": "generation"
  }
}
```

**Implementation Notes**:
- Updates UserSettings preferences
- Called whenever user changes settings
- Enables reuse of preferences across modes (FR-010)

---

## Error Handling

All error responses include:
```json
{
  "error": "short error code or title",
  "details": "human-readable explanation"
}
```

**Common Errors**:
- `"Invalid request"` (400): Malformed input, validation failure
- `"Missing API key"` (500): Environment variable not configured
- `"API rate limited"` (429): Nano Banana API rate limit exceeded
- `"Timeout"` (504): Generation took too long
- `"Generation failed"` (500): Nano Banana API returned error
- `"File too large"` (413): Upload exceeds size limit
- `"Too many files"` (413): Upload count exceeds limit

---

## Headers

All requests must include:
- `Content-Type: application/json` (except multipart/form-data for `/api/edit`)
- `X-Session-ID: <uuid>` or `Cookie: sessionId=<uuid>` (except POST /api/session to create)

All responses include:
- `Content-Type: application/json` or `application/octet-stream`
- Standard HTTP status codes

---

## Contract Tests

Each endpoint requires integration tests:
1. Happy path: valid input → expected output
2. Invalid input: missing/malformed fields → 400 error
3. External API error: Nano Banana API fails → 500 error with details
4. File upload: edge cases (too many files, large file, unsupported format)
5. Session: create, retrieve, update workflow

Tests use Jest/Supertest with mocked or real Nano Banana API calls.

---

## Frontend → Backend Integration

The frontend calls these endpoints using:
- Native `fetch()` API wrapped in a simple client service
- All responses parsed as JSON
- Errors displayed to user via clear error messages (FR-013)
- Progress feedback shown during requests (FR-014)

Example usage in React:
```typescript
const apiClient = {
  async generate(request: GenerateRequest) {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }
};
```

---

## Nano Banana API (Backend Proxy)

The backend proxies to:
- Text-only: `https://api.kie.ai/nano-banana` (or equivalent kie.ai endpoint)
- Edit: `https://api.kie.ai/nano-banana-edit` (or equivalent)

Backend handles:
- API key injection (from environment, never exposed to frontend)
- Request transformation (if needed)
- Response normalization to consistent format
- Error handling and logging
- Timeout management
