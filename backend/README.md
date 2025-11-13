# Nano Banana Backend

Backend API for the Nano Banana image generation and editing application. Built with Express.js, TypeScript, and SQLite.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Initialize database
npm run db:init

# Start development server
npm run dev
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Session Management

#### POST /api/session
Create a new session.

**Response:**
```json
{
  "sessionId": "uuid",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### GET /api/session
Get full session data including history and preferences.

**Headers:**
- `X-Session-ID`: Session ID (required)

**Response:**
```json
{
  "sessionId": "uuid",
  "recentPrompts": ["prompt1", "prompt2"],
  "recentEditPrompts": ["edit1", "edit2"],
  "preferredSize": "1024x768",
  "preferredStyle": "default",
  "preferredAspectRatio": "16:9",
  "lastActiveMode": "generation",
  "generationHistory": [...],
  "editHistory": [...],
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### POST /api/session/preferences
Update user preferences.

**Headers:**
- `X-Session-ID`: Session ID (required)

**Body:**
```json
{
  "preferred_size": "1024x768",
  "preferred_style": "default",
  "preferred_aspect_ratio": "16:9",
  "last_active_mode": "generation"
}
```

### Image Generation

#### POST /api/generate
Create an image generation task.

**Headers:**
- `X-Session-ID`: Session ID (required)

**Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x768",
  "style": "default",
  "aspectRatio": "16:9"
}
```

**Response:**
```json
{
  "requestId": "uuid",
  "status": "pending",
  "taskId": "task-uuid",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### GET /api/generate/status
Poll generation task status.

**Query Parameters:**
- `taskId`: Task ID from generation response

**Response (pending):**
```json
{
  "requestId": "uuid",
  "status": "pending",
  "taskState": "processing",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

**Response (completed):**
```json
{
  "requestId": "uuid",
  "status": "completed",
  "variants": [
    {
      "id": "image-1",
      "url": "https://...",
      "width": 1024,
      "height": 768,
      "format": "png"
    }
  ],
  "createdAt": "2025-11-13T12:00:00Z"
}
```

### Image Editing

#### POST /api/edit
Upload images and create an edit task.

**Headers:**
- `X-Session-ID`: Session ID (required)
- `Content-Type`: multipart/form-data

**Form Data:**
- `images`: File array (1-10 JPEG/PNG, max 10MB each)
- `editPrompt`: Edit instructions (1-1000 chars)
- `style`: Optional style selector
- `aspectRatio`: Optional aspect ratio

**Response:**
```json
{
  "requestId": "uuid",
  "status": "pending",
  "taskId": "task-uuid",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### GET /api/edit/status
Poll edit task status.

**Query Parameters:**
- `taskId`: Task ID from edit response

**Response (completed):**
```json
{
  "requestId": "uuid",
  "status": "completed",
  "variants": [
    {
      "id": "image-1",
      "url": "https://...",
      "width": 1024,
      "height": 768,
      "format": "png"
    }
  ],
  "createdAt": "2025-11-13T12:00:00Z"
}
```

### Options

#### GET /api/generate/options
Get available generation options.

**Response:**
```json
{
  "sizes": ["512x512", "768x512", "1024x768"],
  "styles": ["default", "modern", "classic"],
  "aspectRatios": ["16:9", "1:1", "9:16"]
}
```

#### GET /api/edit/options
Get available edit options.

**Response:**
```json
{
  "styles": ["default", "modern", "classic"],
  "aspectRatios": ["16:9", "1:1", "9:16"]
}
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Nano Banana API
NANO_BANANA_API_KEY=your_key_here

# Database
DATABASE_URL=./data/nanobanana.db

# Frontend
FRONTEND_URL=http://localhost:5173

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_service_key
SUPABASE_BUCKET_NAME=images

# Logging
LOG_LEVEL=info
```

## Project Structure

```
src/
├── api/              # API endpoints
│   ├── generateRoute.ts
│   ├── editRoute.ts
│   └── preferencesRoute.ts
├── services/         # Business logic
│   ├── sessionService.ts
│   ├── nanoBananaService.ts
│   └── supabaseStorage.ts
├── models/           # Data models and repositories
│   ├── generationRequest.ts
│   ├── editRequest.ts
│   ├── generationRepository.ts
│   └── editRepository.ts
├── middleware/       # Express middleware
│   ├── cors.ts
│   └── errorHandler.ts
├── utils/            # Utilities
│   ├── db.ts
│   ├── uploadHandler.ts
│   ├── fileValidator.ts
│   └── apiKey.ts
├── types/            # TypeScript definitions
│   └── models.ts
└── index.ts          # Server entry point
```

## Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
npm run db:init      # Initialize database
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run contract tests
npm run test:contract
```

## Error Handling

All API errors follow this format:

```json
{
  "error": "Error code",
  "details": "Human-readable error message"
}
```

### Common Status Codes

- **400 Bad Request**: Invalid request parameters or missing required fields
- **401 Unauthorized**: Missing or invalid API key
- **404 Not Found**: Resource not found (session, task)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **504 Gateway Timeout**: API request timeout

## Performance Considerations

- Image uploads use Supabase Storage for scalability
- Generation and edit requests are processed asynchronously
- Results are polled via status endpoints
- Database queries are indexed for performance
- Session cleanup occurs after 24 hours of inactivity

## Deployment

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for production deployment instructions.

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

MIT License - see LICENSE file for details
