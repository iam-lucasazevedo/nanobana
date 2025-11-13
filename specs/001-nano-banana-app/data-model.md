# Phase 1: Data Model

**Date**: 2025-11-13
**Status**: Complete

## Entity Definitions

### GenerationRequest

Represents a text-to-image generation request using the Nano Banana text-only model.

**Fields**:
- `id: string (UUID)` - Unique identifier for this request
- `prompt: string` - User's text description (required)
- `size: string` - Image dimensions, e.g., "1024x768" (required, default: "1024x768")
- `style: string` - Creative style/preset, e.g., "modern", "minimalist" (required, default: "default")
- `aspectRatio: string` - Aspect ratio, e.g., "16:9", "1:1" (optional, default: "16:9")
- `createdAt: ISO8601` - Timestamp when request was created
- `status: "pending" | "completed" | "failed"` - Current state
- `errorMessage?: string` - Error details if status is "failed"
- `imageReferences: string[]` - Array of image URLs/IDs returned by API

**Validation Rules**:
- `prompt`: Required, non-empty, max 1000 characters (per FR-001)
- `size`: Must be one of predefined values (e.g., "512x512", "768x768", "1024x768", "1024x1024")
- `style`: Must be one of predefined values (e.g., "default", "modern", "minimalist", "artistic")
- `aspectRatio`: Must be one of supported values (e.g., "1:1", "4:3", "16:9", "9:16")

**Relationships**:
- Associated with one `UserSettings` (user's session)
- Generated images available through `imageReferences`

**State Transitions**:
```
initial → pending → completed (success) OR failed (error)
```

---

### EditRequest

Represents an image editing request using the Nano Banana edit model.

**Fields**:
- `id: string (UUID)` - Unique identifier for this request
- `uploadedImageIds: string[]` - Array of image IDs/paths uploaded by user (1-10 required)
- `editPrompt: string` - User's edit instructions (required)
- `style: string` - Creative style/preset (required, default: "default")
- `aspectRatio?: string` - Optional aspect ratio override (optional)
- `createdAt: ISO8601` - Timestamp when request was created
- `status: "pending" | "completed" | "failed"` - Current state
- `errorMessage?: string` - Error details if status is "failed"
- `variantReferences: string[]` - Array of edited image URLs/IDs returned by API

**Validation Rules**:
- `uploadedImageIds`: Required, must contain 1-10 items (per FR-005, FR-012)
- `editPrompt`: Required, non-empty, max 1000 characters (per FR-006)
- `style`: Must be one of predefined values (matching GenerationRequest options)
- Image formats supported: JPEG, PNG (validated on upload)
- Max file size per image: 10 MB (implicit constraint for web upload)

**Relationships**:
- Associated with one `UserSettings` (user's session)
- Edited images available through `variantReferences`

**State Transitions**:
```
initial → pending → completed (success) OR failed (error)
```

---

### GeneratedImage

Represents a single output image from either generation or editing.

**Fields**:
- `id: string (UUID)` - Unique identifier for this image
- `url: string` - Download URL or data URI for the image
- `width: number` - Image width in pixels
- `height: number` - Image height in pixels
- `format: "jpeg" | "png"` - Image file format
- `createdAt: ISO8601` - Timestamp when image was generated
- `associatedRequestId: string (UUID)` - FK to GenerationRequest or EditRequest
- `requestType: "generation" | "edit"` - Which request type produced this
- `metadata: object` - Additional data (e.g., original file size, processing time)

**Validation Rules**:
- `url`: Required, valid URL or base64 data URI
- `width`, `height`: Required, positive integers
- `format`: Must be "jpeg" or "png"
- `associatedRequestId`: Required, must reference valid request

**Relationships**:
- Belongs to one GenerationRequest or EditRequest
- Stored in browser (session storage or IndexedDB) or temporary server cache
- Not persisted to database (spec: "generated images stay in browser")

---

### UserSettings

Persists user's recent activity and preferences within a session.

**Fields**:
- `sessionId: string (UUID)` - Unique session identifier
- `recentPrompts: string[]` - Last 5 used prompts (for quick reuse, per FR-009)
- `recentEditPrompts: string[]` - Last 5 used edit prompts
- `preferredSize: string` - User's last selected size (e.g., "1024x768")
- `preferredStyle: string` - User's last selected style
- `preferredAspectRatio: string` - User's last selected aspect ratio
- `generationHistory: GenerationRequest[]` - Recent generation requests (last 10)
- `editHistory: EditRequest[]` - Recent edit requests (last 10)
- `lastActiveMode: "generation" | "edit"` - Track which mode user was in (per FR-010)
- `createdAt: ISO8601` - Session start time
- `lastAccessedAt: ISO8601` - Last interaction timestamp

**Validation Rules**:
- `sessionId`: Generated on app load, stored in browser localStorage
- `recentPrompts`, `recentEditPrompts`: Max 5 items each
- `generationHistory`, `editHistory`: Max 10 items each (oldest removed on overflow)
- All timestamp fields must be valid ISO8601

**Relationships**:
- One-to-many with GenerationRequest (per session)
- One-to-many with EditRequest (per session)
- Stored in SQLite (local backend) and browser session storage
- Session expires after 24 hours of inactivity (default)

**State Transitions**:
```
created (on app load) → active (user interacting) → idle (no activity > threshold)
```

---

## Data Flow Diagram

```
User (Browser)
    ↓
React Frontend (state in hooks + browser storage)
    ↓
Express Backend API (SQLite for UserSettings)
    ↓
Nano Banana API (kie.ai)
    ↓
Generated Images
    ↓
Browser Display & Download
```

## Storage Strategy

### Browser Storage
- **localStorage**: SessionId, UserSettings structure (JSON serialized)
- **IndexedDB or file system API**: Generated image previews (temporary, per session)

### Server Storage (SQLite)
- `user_sessions` table: `sessionId`, `createdAt`, `lastAccessedAt`
- `generation_requests` table: `id`, `sessionId`, `prompt`, `size`, `style`, `status`, `createdAt`
- `edit_requests` table: `id`, `sessionId`, `editPrompt`, `status`, `createdAt`
- `user_preferences` table: `sessionId`, `preferredSize`, `preferredStyle`, etc.

**Image Storage**: NOT persisted (spec requirement). Images served directly from API responses to browser.

---

## Database Schema (SQLite)

```sql
CREATE TABLE user_sessions (
  session_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_accessed_at TEXT NOT NULL
);

CREATE TABLE generation_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  size TEXT DEFAULT '1024x768',
  style TEXT DEFAULT 'default',
  aspect_ratio TEXT DEFAULT '16:9',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

CREATE TABLE edit_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  edit_prompt TEXT NOT NULL,
  style TEXT DEFAULT 'default',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

CREATE TABLE user_preferences (
  session_id TEXT PRIMARY KEY,
  preferred_size TEXT DEFAULT '1024x768',
  preferred_style TEXT DEFAULT 'default',
  preferred_aspect_ratio TEXT DEFAULT '16:9',
  last_active_mode TEXT DEFAULT 'generation',
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);
```

---

## Notes

- All models use UUID for primary keys (secure, distributed-friendly)
- Timestamps use ISO8601 format for consistency
- Session-based approach aligns with spec assumption of single-user/small-team usage
- No user authentication needed; sessionId is sufficient for data isolation
- GeneratedImage not persisted to ensure compliance with spec ("images stay in browser")
