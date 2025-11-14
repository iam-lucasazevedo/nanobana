# Quick Start: Backend Render Deployment

**Audience**: Backend developers implementing the Render deployment feature
**Purpose**: Rapid onboarding to implementation tasks
**Date**: 2025-11-13

---

## Feature Overview

Migrate the Nano Banana Express backend from local SQLite database and filesystem storage to a production-ready Render-compatible application using PostgreSQL and Supabase cloud storage.

**Critical Issues Solved**:
1. ✅ SQLite database doesn't persist on cloud (data lost on restart)
2. ✅ Local file uploads disappear on container restart
3. ✅ Hardcoded paths and localhost CORS origin block cloud deployment
4. ✅ Environment configuration doesn't support Render's setup

---

## Setup Instructions

### 1. Prerequisites

**What you need before starting**:
- Node.js 18+
- PostgreSQL client tools (or use cloud console)
- Render account with staging environment
- Supabase project with API credentials

**Files you'll modify**:
- `backend/src/utils/db.ts` - Database initialization (SQLite → PostgreSQL)
- `backend/src/utils/config.ts` - Create new config module
- `backend/src/middleware/cors.ts` - Update CORS configuration
- `backend/src/services/supabaseStorage.ts` - Enhance file storage
- `backend/package.json` - Update dependencies
- `backend/.env.example` - Document all environment variables
- `render.yaml` - Update deployment configuration

### 2. Environment Setup

Create `.env.local` for local development:

```bash
# Copy template
cp backend/.env.example backend/.env.local

# Update with your values
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/nanobanana_dev
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NANO_BANANA_API_KEY=your_api_key_here
LOG_LEVEL=debug
```

### 3. Database Migration

**Steps**:

1. **Export SQLite data**:
   ```bash
   cd backend
   sqlite3 ../data/nanobanana.db .dump > dump.sql
   ```

2. **Create PostgreSQL database** (local or Render):
   ```bash
   createdb nanobanana_dev  # Local PostgreSQL
   ```

3. **Apply schema** (from `backend/src/models/schema.sql`):
   - Updated to PostgreSQL syntax
   - Run: `psql nanobanana_dev < backend/src/models/schema.sql`

4. **Import data** (use migration script):
   - Execute `backend/src/models/migrations/001_sqlite_to_pg.sql`
   - Verify row counts match original SQLite

5. **Verify connection**:
   ```bash
   psql postgresql://user:password@localhost:5432/nanobanana_dev -c "SELECT count(*) FROM sessions;"
   ```

### 4. Code Implementation

**Phase 1 - Configuration System**:
1. Create `backend/src/utils/config.ts` with typed environment variables
2. Validate all required env vars on startup (fail fast if missing)
3. Export configuration object for use throughout app

**Phase 2 - Database Module**:
1. Update `backend/src/utils/db.ts` to use `pg` package instead of `sqlite3`
2. Implement connection pooling (min 2, max 10 for Render)
3. Keep schema initialization on startup (check if tables exist)
4. Add retry logic with exponential backoff for connection errors

**Phase 3 - CORS & Middleware**:
1. Update `backend/src/middleware/cors.ts` to use `FRONTEND_URL` environment variable
2. Add support for localhost (development) and production URLs

**Phase 4 - File Storage**:
1. Update `backend/src/services/supabaseStorage.ts` to handle file operations
2. Ensure public bucket access for image retrieval
3. Replace local path responses with Supabase public URLs

**Phase 5 - Logging**:
1. Create `backend/src/utils/logger.ts` with structured logging
2. Replace `console.log()` calls with logger utility
3. Support log level configuration (debug, info, warn, error)

### 5. Dependency Updates

**Remove**:
```json
"sqlite3": "^5.1.6"
```

**Add**:
```json
"pg": "^8.11.0"
```

**Run**:
```bash
cd backend
npm install
```

### 6. Testing Locally

```bash
# Start local PostgreSQL (if not running)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service in Services

# Set development environment
export NODE_ENV=development
export DATABASE_URL=postgresql://user:password@localhost:5432/nanobanana_dev

# Run tests
npm test

# Start development server
npm run dev

# Test endpoints
curl -X POST http://localhost:3001/api/session
curl http://localhost:3001/health
```

### 7. Build & Deployment Preparation

**Local build test**:
```bash
cd backend
npm run build
npm start
```

**Render deployment**:
1. Commit changes: `git add . && git commit -m "chore: prepare for Render deployment"`
2. Push to main: `git push origin 002-render-deployment`
3. Create PR for review
4. In Render dashboard:
   - Create new PostgreSQL database
   - Create new web service linked to GitHub repository
   - Set environment variables (see `.env.example`)
   - Deploy: Render will run `npm ci && npm run build` and `npm start`

### 8. Verification Checklist

Before marking complete:
- [ ] PostgreSQL database successfully initialized with schema
- [ ] Application starts with `npm start` in production mode
- [ ] Health check endpoint returns 200: `curl https://[render-url]/health`
- [ ] API endpoints respond without CORS errors
- [ ] File uploads stored in Supabase (not local filesystem)
- [ ] Configuration loads from environment variables
- [ ] All tests pass: `npm test`
- [ ] No hardcoded local paths in code
- [ ] Logs appear in Render dashboard
- [ ] Version bumped to 0.2.0 in package.json

---

## Key Files Reference

| File | Change | Reason |
|------|--------|--------|
| `backend/src/utils/db.ts` | Replace sqlite3 with pg | PostgreSQL persistence |
| `backend/src/utils/config.ts` | Create new | Type-safe env variables |
| `backend/src/middleware/cors.ts` | Use FRONTEND_URL env | Multi-domain support |
| `backend/src/services/supabaseStorage.ts` | Enhance | Cloud file storage |
| `backend/package.json` | Add pg, remove sqlite3 | Dependencies |
| `backend/.env.example` | Document all vars | Configuration reference |
| `render.yaml` | Update build/start commands | Deployment config |

---

## Common Issues & Solutions

### "ECONNREFUSED - PostgreSQL not running"
**Solution**: Start PostgreSQL service locally or ensure Render database is provisioned

### "Missing environment variable: DATABASE_URL"
**Solution**: Ensure all required variables are set in `.env.local` or Render dashboard

### "CORS error: Origin not allowed"
**Solution**: Verify FRONTEND_URL matches frontend domain in both development and production

### "File upload fails but doesn't error clearly"
**Solution**: Check Supabase credentials and bucket permissions; ensure bucket is public

### "Build fails with TypeScript errors"
**Solution**: Run `npm run type-check` locally; fix all type errors before deploying

---

## Next Steps

1. ✅ **Read**: `/speckit/002-render-deployment/spec.md` for full requirements
2. ✅ **Review**: `data-model.md` for schema structure
3. ✅ **Implement**: Follow Phase 1-5 code changes above
4. ✅ **Test**: Verify all checklist items pass locally
5. ✅ **Deploy**: Push to Render staging environment
6. ✅ **Verify**: Test production endpoints

**Questions?** Check the research findings in `research.md` for detailed design decisions.

