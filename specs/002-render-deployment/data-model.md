# Phase 1 Design: Data Model

**Date**: 2025-11-13
**Feature**: 002-render-deployment
**Status**: Complete

## Overview

This document defines the data entities and their relationships for the Render deployment feature. The schema is migrated from SQLite to PostgreSQL without changing the data model structure - only the implementation details and storage format change.

---

## Entity Reference

### Session

Represents a user session for tracking image generation and editing history.

**Fields**:
- `session_id` (UUID, Primary Key): Unique identifier for the session
- `created_at` (TIMESTAMP): Session creation timestamp
- `updated_at` (TIMESTAMP): Last session activity timestamp
- `preferences` (JSON): User preferences (size, style, aspect ratio) stored as JSON object

**Relationships**:
- One-to-many: Has many `GenerationRequest` records
- One-to-many: Has many `EditRequest` records

**Constraints**:
- `session_id` must be unique
- `created_at` must be a valid timestamp
- `preferences` must be valid JSON or NULL

**State Transitions**:
- Created: When user opens the application
- Active: When user generates or edits images
- Stale: After 30 days of inactivity (cleanup task)

---

### GenerationRequest

Represents a single image generation request using Nano Banana's text-to-image model.

**Fields**:
- `id` (SERIAL, Primary Key): Unique request identifier
- `session_id` (UUID, Foreign Key): Reference to parent session
- `status` (VARCHAR): Request status (pending, success, failed)
- `prompt` (TEXT): User's generation prompt
- `style` (VARCHAR): Visual style selected (abstract, photorealistic, sketch, etc.)
- `size` (VARCHAR): Image dimensions (512x512, 768x768, 1024x1024)
- `aspect_ratio` (VARCHAR): Aspect ratio (1:1, 4:3, 16:9, etc.)
- `image_url` (TEXT): URL to generated image on Supabase
- `error_message` (TEXT): Error details if status is 'failed'
- `created_at` (TIMESTAMP): Request creation time
- `updated_at` (TIMESTAMP): Last status update time

**Relationships**:
- Many-to-one: Belongs to `Session`

**Constraints**:
- `session_id` must reference valid Session
- `status` must be one of: 'pending', 'success', 'failed'
- `prompt` length: minimum 1 character, maximum 500 characters
- `image_url` must be valid URL or NULL (NULL if status != 'success')
- `created_at` must be valid timestamp

**Validation Rules**:
- Status can only transition: pending → success OR pending → failed
- Image URL must be set only when status is 'success'
- Error message should be set only when status is 'failed'

---

### EditRequest

Represents a single image editing request using Nano Banana's image-to-image model.

**Fields**:
- `id` (SERIAL, Primary Key): Unique request identifier
- `session_id` (UUID, Foreign Key): Reference to parent session
- `status` (VARCHAR): Request status (pending, success, failed)
- `source_image_url` (TEXT): URL to original image in Supabase
- `prompt` (TEXT): User's editing prompt/instructions
- `style` (VARCHAR): Visual style for edits
- `output_count` (INTEGER): Number of edit variants to generate (1-10)
- `output_images` (JSON): Array of URLs to edited images on Supabase
- `error_message` (TEXT): Error details if status is 'failed'
- `created_at` (TIMESTAMP): Request creation time
- `updated_at` (TIMESTAMP): Last status update time

**Relationships**:
- Many-to-one: Belongs to `Session`

**Constraints**:
- `session_id` must reference valid Session
- `status` must be one of: 'pending', 'success', 'failed'
- `source_image_url` must be valid URL and reference file in Supabase
- `prompt` length: minimum 1 character, maximum 500 characters
- `output_count` must be between 1 and 10
- `output_images` must be valid JSON array of URLs or NULL
- `created_at` must be valid timestamp

**Validation Rules**:
- Status can only transition: pending → success OR pending → failed
- Output images array must match output_count only when status is 'success'
- Source image must exist in Supabase bucket before edit request processed

---

## Storage Changes: SQLite → PostgreSQL

### Connection Model

**SQLite (Current)**:
```typescript
sqlite3.Database -> Single process-local connection
```

**PostgreSQL (New)**:
```typescript
pg.Pool -> Connection pooling (2-10 connections)
                ↓
          Multiple worker processes share pool
                ↓
          Better concurrency under load
```

### Type System Changes

| SQLite Type | PostgreSQL Type | Impact |
|-------------|-----------------|--------|
| INTEGER PRIMARY KEY AUTOINCREMENT | SERIAL | Auto-increment stays same; BIGSERIAL for large scale |
| TEXT | VARCHAR(n) or TEXT | No change; PostgreSQL handles both |
| BLOB | BYTEA | Not used in current schema |
| JSON (SQLite 3.9+) | JSON or JSONB | Use JSONB for better performance |
| TIMESTAMP | TIMESTAMP WITH TIME ZONE | Explicit timezone handling recommended |

### Schema Definition Location

- **Current**: `backend/src/models/schema.sql` (SQLite syntax)
- **After Migration**: `backend/src/models/schema.sql` (PostgreSQL syntax)
- **Migration Script**: `backend/src/models/migrations/001_sqlite_to_pg.sql` (one-time operation)

---

## Configuration Schema

The application configuration is now defined in environment variables (no database storage).

**Configuration Entity** (stored as environment variables):

```typescript
interface Config {
  // Server
  port: number;                    // Default: 3001
  nodeEnv: 'development' | 'testing' | 'production';

  // Database
  databaseUrl: string;             // Connection string: postgresql://...
  databasePoolMin: number;         // Default: 2
  databasePoolMax: number;         // Default: 10

  // Frontend CORS
  frontendUrl: string;             // Default: http://localhost:5173

  // Supabase Storage
  supabaseUrl: string;             // Required
  supabaseAnonKey: string;         // Required (public key)
  supabaseBucketName: string;      // Default: nanobanana-images

  // Nano Banana API
  nanoBananaApiKey: string;        // Required (API key)

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';  // Default: info
}
```

**Configuration Sources**:
1. Environment variables (highest priority)
2. Default values defined in `backend/src/utils/config.ts`
3. Runtime validation on startup

---

## File Storage Schema

**Storage Location**: Supabase bucket `nanobanana-images`

**File Organization**:
```
nanobanana-images/
├── sessions/
│   ├── {session_id}/
│   │   ├── generated/{request_id}_{number}.png
│   │   └── uploads/{uploaded_filename}
│   └── {session_id}/
│       └── ...
└── temp/  (for cleanup jobs)
    └── {file_id}.png
```

**File Metadata**:
- File name structure: `{request_id}_{variant_number}.png`
- Public accessibility: Yes (no authentication needed for retrieval)
- Retention: 90 days (with future cleanup task)
- Size limit: 10MB per upload

---

## Data Integrity & Validation

### Referential Integrity

- All `GenerationRequest.session_id` must reference valid `Session` record
- All `EditRequest.session_id` must reference valid `Session` record
- Foreign key constraints enabled on PostgreSQL (PRAGMA setting in SQLite)

### Temporal Data

- All timestamps in UTC timezone
- `updated_at` automatically set to current timestamp on record modification
- Cleanup of old records: Sessions older than 90 days can be archived/deleted

### State Consistency

**Generation Request States**:
```
pending → success (with image_url)
       ↓
       → failed (with error_message)
```

**Edit Request States**:
```
pending → success (with output_images array)
       ↓
       → failed (with error_message)
```

---

## Constraints Summary

| Constraint | Type | Impact |
|-----------|------|--------|
| Foreign Keys | CONSTRAINT | Referential integrity; prevent orphaned records |
| NOT NULL | CHECK | Required fields must always have values |
| UNIQUE | CONSTRAINT | session_id uniqueness across all sessions |
| CHECK status | CHECK | Only valid status values allowed |
| CHECK output_count | CHECK | Edit requests limited to 1-10 output images |

---

## Future Considerations

These are out of scope for this feature but documented for Phase 2+:

1. **Indexing**: Add indexes on `session_id` and `created_at` for query performance
2. **Partitioning**: Partition large tables by date if they grow beyond 100M rows
3. **Archival**: Implement cold storage for sessions older than 1 year
4. **Replication**: Enable read replicas for high-traffic deployments
5. **Backup**: Automated daily backups (Render PostgreSQL add-on provides this)

---

## Migration Steps

1. **Export SQLite data**: `sqlite3 nanobanana.db .dump > dump.sql`
2. **Create PostgreSQL schema**: Apply migrated `schema.sql` to new database
3. **Import data**: Use migration script `001_sqlite_to_pg.sql`
4. **Verify**: Row counts and integrity checks
5. **Update application**: Change `db.ts` to use `pg` package
6. **Test**: Run full integration test suite
7. **Deploy**: Push to Render with updated `DATABASE_URL`

