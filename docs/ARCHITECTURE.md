# Nano Banana - System Architecture

## Overview

Nano Banana is a web application that enables users to generate and edit images using AI models through the Nano Banana API. The system follows a three-tier architecture with a React frontend, Express backend, and external AI service integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Create Mode  │  │  Edit Mode   │  │   Components │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │               │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Hooks (useSession, useGeneration, etc.)  │       │
│  └──────────────────────────────────────────────────┘       │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────┼────────────────────────────────────┐
│                         │    Backend (Express)                │
│  ┌─────────────────────────────────────────────────┐         │
│  │        API Routes (Session, Generate, Edit)     │         │
│  └─────────────────────────────────────────────────┘         │
│                         │                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ SessionService   │  │ NanoBananaService│ │  Upload    │ │
│  └──────────────────┘  └──────────────────┘  │  Handler   │ │
│                                               └────────────┘ │
│  ┌──────────────────────────────────────────────────┐       │
│  │     SQLite Database (Sessions, History)          │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────┬──────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Nano Banana  │  │   Supabase   │  │ localStorage │
  │   API        │  │   Storage    │  │  (Session)   │
  └──────────────┘  └──────────────┘  └──────────────┘
```

## Core Components

### Frontend Layer

#### Pages
- **CreateMode** - Text-to-image generation interface
- **EditMode** - Image editing interface

#### Core Hooks
- **useSession** - Session lifecycle management and restoration
- **useGeneration** - Generation task state and API calls
- **useImageEdit** - File upload and edit task management
- **useModeSwitch** - Mode switching with backend sync

#### Components
- **ModeSelector** - Navigation between Create/Edit modes
- **SessionHistory** - Recent prompts and quick retry
- **FileUpload** - File upload with drag-and-drop
- **ImageGallery** - Session image browser
- **EditInstructions** - Edit prompt input with validation
- **UploadedImagePreview** - Upload progress visualization
- **EditedImagePreview** - Result display with download

### Backend Layer

#### API Routes
```
POST   /api/session                 Create new session
GET    /api/session                 Get session with full history
POST   /api/session/preferences      Update user preferences

POST   /api/generate                 Create generation task
GET    /api/generate/status          Poll generation status
GET    /api/generate/options         Get available options

POST   /api/edit                     Upload and create edit task
GET    /api/edit/status              Poll edit status
GET    /api/edit/options             Get available options
```

#### Services
- **SessionService** - Session CRUD, preferences, history tracking
- **NanoBananaService** - Nano Banana API integration
- **SupabaseStorageService** - Image storage management

#### Data Models
- **UserSession** - Session metadata
- **UserPreferences** - User settings and mode tracking
- **GenerationRequest** - Generation task record
- **EditRequest** - Edit task record

### Database Schema

#### user_sessions
```sql
session_id          TEXT PRIMARY KEY
created_at          TEXT
last_accessed_at    TEXT
```

#### user_preferences
```sql
session_id          TEXT PRIMARY KEY
preferred_size      TEXT
preferred_style     TEXT
preferred_aspect_ratio TEXT
last_active_mode    TEXT
```

#### generation_requests
```sql
id                  TEXT PRIMARY KEY
session_id          TEXT FOREIGN KEY
prompt              TEXT
size                TEXT
style               TEXT
aspect_ratio        TEXT
status              TEXT (pending|completed|failed)
error_message       TEXT
created_at          TEXT
```

#### edit_requests
```sql
id                  TEXT PRIMARY KEY
session_id          TEXT FOREIGN KEY
edit_prompt         TEXT
style               TEXT
status              TEXT (completed|failed)
error_message       TEXT
created_at          TEXT
```

## Data Flow

### User Story 1: Text-to-Image Generation

```
1. User enters prompt in CreateMode
2. Frontend calls POST /api/generate
3. Backend validates request, saves GenerationRequest
4. Backend calls Nano Banana API
5. Returns taskId to frontend
6. Frontend polls GET /api/generate/status
7. When complete, backend returns image URLs
8. Frontend displays images with download option
9. Backend saves session history
```

### User Story 2: Image Editing

```
1. User selects images in EditMode
2. Frontend uploads via POST /api/edit with FormData
3. Backend validates files, uploads to Supabase
4. Backend creates EditRequest record
5. Backend calls Nano Banana Edit API with public image URLs
6. Returns taskId to frontend
7. Frontend polls GET /api/edit/status
8. When complete, backend returns edited URLs
9. Frontend displays results with download option
```

### User Story 3: Mode Switching & Persistence

```
1. User switches modes via ModeSelector
2. useModeSwitch calls updatePreferences
3. Backend saves last_active_mode to user_preferences
4. On page reload, useSession restores session
5. Frontend reads lastActiveMode from session
6. UI automatically switches to last mode
7. SessionHistory shows prompts from both modes
```

## Integration Points

### Nano Banana API
- **Endpoint**: https://api.kie.ai/api/v1/jobs/createTask
- **Authentication**: API key in header
- **Tasks**:
  - Text-to-image generation (model: google/nano-banana-text)
  - Image editing (model: google/nano-banana-edit)

### Supabase Storage
- **Purpose**: Store user-uploaded images
- **Bucket**: "nanobanana images bucket"
- **Public URLs**: Used for Nano Banana API to access images

### localStorage
- **Storage**: Session ID persistence
- **Scope**: Client-side only
- **Data**: `sessionId`

## State Management Strategy

### Session State
- Managed by `useSession` hook
- Restored from localStorage on app load
- Synced with backend on every GET /api/session
- Includes: preferences, history, active mode

### UI State
- Component-level state via React hooks
- Mode state in `useModeSwitch`
- Generation/edit state in respective hooks
- No global state management (kept simple)

### Data Persistence
- **Session ID**: localStorage
- **User Preferences**: Backend database
- **History**: Backend database
- **Images**: Supabase Storage
- **Active Mode**: Backend (user_preferences.last_active_mode)

## Error Handling Strategy

### Error Categories
1. **Validation Errors** (400) - User input validation
2. **Authentication Errors** (401) - API key issues
3. **Not Found Errors** (404) - Session/resource missing
4. **Rate Limit Errors** (429) - API rate limiting
5. **Server Errors** (500) - Internal server issues
6. **Timeout Errors** (504) - Request timeout

### Error Flow
```
API Request → Error Response → errorMessages utility
    ↓
Categorize error type
    ↓
Return user-friendly message
    ↓
Frontend displays to user
    ↓
User sees actionable feedback
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Routes lazy-loaded
- **Image Lazy Loading**: Large galleries use lazy load
- **Memoization**: Components use React.memo where needed
- **Request Debouncing**: Form inputs debounced

### Backend Optimization
- **Database Indexes**: Queries optimized for sessionId, createdAt
- **Async Processing**: Generation/edit tasks processed asynchronously
- **Image Storage**: Offloaded to Supabase for scalability
- **Polling Strategy**: 2.5s interval, max 2 min timeout

### Network Optimization
- **Minimal Payload**: JSON APIs return only needed data
- **Request Caching**: Session data cached, refresh on demand
- **Compression**: gzip compression enabled
- **Timeouts**:
  - Generation requests: 30s
  - Edit requests: 45s
  - Other requests: 15s

## Security Considerations

### Authentication
- Session ID required for all API requests
- Session validated server-side
- API key stored securely in environment variables
- No sensitive data in frontend code

### File Upload Security
- MIME type validation (JPEG/PNG only)
- File size limit (10MB per file)
- Filename sanitized before storage
- Uploaded to Supabase (not local disk)

### CORS
- Configured for frontend origin only
- Prevents cross-origin attacks
- Session header validation on all requests

### SQL Injection Prevention
- Parameterized queries throughout
- SQLite prepared statements used
- No dynamic SQL concatenation

## Deployment Architecture

### Development Environment
- Frontend: Vite dev server (localhost:5173)
- Backend: Express dev server (localhost:3001)
- Database: SQLite (local file)
- Storage: Supabase

### Production Environment
- Frontend: Static hosting (Vercel, Netlify, S3)
- Backend: Node.js server (AWS, Heroku, DigitalOcean)
- Database: PostgreSQL (Supabase, AWS RDS)
- Storage: Supabase Storage or S3
- CDN: CloudFront or similar

## Scaling Strategy

### Horizontal Scaling
- **Frontend**: Served from CDN, stateless
- **Backend**: Multiple instances behind load balancer
- **Database**: Migrate to PostgreSQL, add read replicas
- **Storage**: Use S3 or similar for unlimited storage

### Vertical Scaling
- **Database**: Optimize queries, add indexes
- **API**: Cache responses, implement rate limiting
- **Frontend**: Optimize bundle size, lazy load routes

### Database Scaling
- Migrate from SQLite to PostgreSQL
- Add indexes on frequently queried columns
- Implement connection pooling
- Archive old sessions periodically

## Future Enhancements

### Planned Features
- User accounts and authentication
- Image favorites/bookmarking
- Batch processing for multiple images
- Advanced editing options
- API quotas and usage tracking
- Mobile app (React Native)

### Architectural Changes
- User service for authentication
- Payment processing service
- Analytics and monitoring
- Message queue (Bull, RabbitMQ) for async tasks
- Redis caching layer

## Glossary

- **Session**: Unique user instance, stores preferences and history
- **Task**: Generation or edit job submitted to Nano Banana API
- **Polling**: Regular status checks to retrieve async results
- **Variant**: Generated or edited image result
- **Mode**: Active feature (generation or editing)
- **Preference**: User setting (size, style, aspect ratio)

## References

- [Nano Banana API Documentation](https://www.nanobanana.com)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Supabase Documentation](https://supabase.io)
- [SQLite Documentation](https://sqlite.org)
