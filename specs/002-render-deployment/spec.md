# Feature Specification: Backend Render Deployment Configuration

**Feature Branch**: `002-render-deployment`
**Created**: 2025-11-13
**Status**: Draft
**Input**: User description: "Configure application for Render deployment by fixing local machine dependencies, implementing environment-aware configuration, and ensuring containerization compatibility. Update database strategy to use PostgreSQL with cloud storage, implement proper logging, and prepare CI/CD integration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy Backend to Production Without Local Machine Dependencies (Priority: P1)

DevOps engineer needs to deploy the Nano Banana backend service to Render cloud platform without being blocked by local machine configurations, hardcoded paths, or environment-specific settings that prevent the application from running in a containerized cloud environment.

**Why this priority**: This is the primary blocker preventing the application from going live. Without removing local dependencies, the application cannot function on any cloud platform. This must be resolved first as it's the foundation for production deployment.

**Independent Test**: Can be fully tested by deploying the backend to a Render staging environment and verifying the service starts successfully, responds to health checks, and maintains database connectivity without manual filesystem configuration.

**Acceptance Scenarios**:

1. **Given** the backend code has local machine-specific paths (e.g., `./data/nanobanana.db`), **When** the application is deployed to Render, **Then** the application starts without file system errors and data persists using a cloud-compatible strategy
2. **Given** environment variables are not properly documented, **When** the backend runs in Render, **Then** all required environment variables are set and the application functions correctly
3. **Given** the application uses hardcoded development settings, **When** running in production mode, **Then** all settings adapt to the Render environment (port, logging, CORS origins)

---

### User Story 2 - Configure Supabase Credentials for Render Environment (Priority: P1)

DevOps engineer needs to ensure the application correctly uses Supabase PostgreSQL database and file storage through environment variables so that Render can inject credentials securely without hardcoding.

**Why this priority**: Application currently uses hardcoded or local Supabase configuration. On Render, all credentials must come from environment variables. This is critical for security and deployment flexibility.

**Independent Test**: Can be fully tested by configuring environment variables and verifying the application connects to Supabase database, retrieves session data, and accesses files in the Supabase bucket without errors.

**Acceptance Scenarios**:

1. **Given** Supabase credentials are provided as environment variables, **When** the application starts on Render, **Then** it successfully connects to the Supabase PostgreSQL database
2. **Given** the application is running with Supabase, **When** a session is created and data queried, **Then** data persists and is retrievable after application restart
3. **Given** a file is uploaded to Supabase, **When** the application attempts to retrieve it, **Then** the file is accessible via the configured Supabase bucket

---

### User Story 3 - Implement Proper Environment Configuration System (Priority: P1)

Backend developer needs a centralized environment configuration system that correctly loads different settings for development, testing, and production without code changes or environment-specific file modifications.

**Why this priority**: The current `.env` approach with hardcoded defaults doesn't support Render's environment variable injection. Production requires properly namespaced, validated configuration that handles missing variables gracefully.

**Independent Test**: Can be fully tested by running the application with different NODE_ENV values and verifying correct configuration is loaded for development (port 3001, local database), testing (in-memory database), and production (Render PostgreSQL, proper CORS origins).

**Acceptance Scenarios**:

1. **Given** NODE_ENV is set to 'production', **When** the application starts, **Then** it loads Render-specific settings and fails fast if critical environment variables are missing
2. **Given** different port and database configuration values, **When** the application runs in different environments, **Then** it uses the correct configuration for each environment without code changes
3. **Given** optional environment variables (e.g., LOG_LEVEL), **When** they're missing, **Then** the application uses sensible defaults instead of crashing

---

### User Story 4 - Remove Local Filesystem Upload References (Priority: P1)

Backend developer needs to ensure all file upload operations use Supabase storage exclusively and remove any references to local filesystem paths (`./data/uploads`) so uploaded files persist across container restarts on Render.

**Why this priority**: Local filesystem storage on Render is ephemeral. References to `./data/uploads` in code or responses could cause confusion and data loss. All file operations must use Supabase exclusively.

**Independent Test**: Can be fully tested by uploading an image through the API and verifying it's stored in Supabase storage only (not local filesystem), is accessible via the Supabase public URL, and works after an application restart.

**Acceptance Scenarios**:

1. **Given** a user uploads an image to edit, **When** the file is received by the API, **Then** it's stored only in Supabase storage, not the local filesystem
2. **Given** the application responds with image URLs, **When** the response is examined, **Then** all URLs point to Supabase CDN (not local paths)
3. **Given** the application restarts after an upload, **When** the frontend requests the uploaded image, **Then** the image is successfully retrieved from Supabase storage

---

### User Story 5 - Implement Production-Grade Logging (Priority: P2)

DevOps engineer needs a logging system that captures all application events, errors, and performance metrics in a format suitable for Render's log streaming service and enables debugging production issues without direct file access.

**Why this priority**: Local console logging isn't sufficient for production. Render captures stdout/stderr, but the application needs structured, categorized logging to help diagnose issues in production.

**Independent Test**: Can be fully tested by running the application in production mode and verifying structured logs appear in Render's log view with proper timestamp, severity level, and contextual information for key events (startup, errors, API requests).

**Acceptance Scenarios**:

1. **Given** the application starts in production mode, **When** it initializes components, **Then** startup events are logged with timestamps and severity levels
2. **Given** an API request fails, **When** the error occurs, **Then** the complete error context is logged for debugging without sensitive data exposure
3. **Given** the application processes the health check endpoint, **When** LOG_LEVEL is set to 'debug', **Then** detailed request information is logged; when set to 'info', **Then** minimal logging occurs

---

### User Story 6 - Prepare Build and Deployment Process (Priority: P2)

DevOps engineer needs build scripts and configuration that compile the TypeScript backend, optimize dependencies, and prepare the application for containerized execution on Render without requiring local build tools beyond npm.

**Why this priority**: Render's build process must succeed with only the commands specified in `render.yaml`. The build must use `npm ci` for reproducible installs and properly compile TypeScript to executable JavaScript.

**Independent Test**: Can be fully tested by simulating Render's build environment: installing dependencies with `npm ci`, running the build command, and verifying the `dist/` directory contains properly compiled JavaScript that runs without errors.

**Acceptance Scenarios**:

1. **Given** the backend source code in TypeScript, **When** the Render build command executes `npm ci && npm run build`, **Then** a production-ready `dist/` directory is created
2. **Given** the application is built, **When** `node dist/index.js` is executed, **Then** the application starts and listens on the port specified by the PORT environment variable
3. **Given** TypeScript type errors exist, **When** the build runs, **Then** the build fails with clear error messages indicating which files have type issues

---

### User Story 7 - Configure CORS and Security for Cloud Deployment (Priority: P2)

Backend developer needs to update CORS configuration, security headers, and external service integration settings to work correctly when the backend and frontend are deployed to different cloud providers (backend on Render, frontend on Vercel).

**Why this priority**: Current CORS origin is hardcoded to localhost. When deployed to separate platforms, the backend won't accept requests from the frontend URL, breaking the entire application.

**Independent Test**: Can be fully tested by deploying the backend to Render, deploying the frontend to Vercel, and verifying the frontend successfully makes API requests to the backend without CORS errors.

**Acceptance Scenarios**:

1. **Given** the FRONTEND_URL environment variable is set to the Vercel deployment URL, **When** the frontend makes requests to the backend API, **Then** CORS validation passes and requests succeed
2. **Given** a development environment, **When** FRONTEND_URL is set to `http://localhost:5173`, **Then** local development works without CORS issues
3. **Given** the backend is deployed to production, **When** an unknown origin attempts to access the API, **Then** the request is rejected by CORS validation

### Edge Cases

- What happens when the PostgreSQL connection is lost? The application should handle connection errors gracefully, retry with exponential backoff, and alert operators
- How does the system handle file uploads when Supabase storage temporarily unavailable? Upload requests should fail with clear error messages, not silently lose data
- What happens if required environment variables are missing during startup? The application should fail immediately with a helpful error message listing missing variables rather than failing mysteriously at first use
- How does the application handle rate limiting when deployed to Render? No rate limiting on backend yet, but Render's free tier has resource limitations that should be monitored
- What happens when the database schema has unapplied migrations? The application should detect this and either auto-migrate (with safety checks) or fail with clear instructions for the operator

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove all hardcoded local filesystem paths and reference only Supabase for file storage
- **FR-002**: System MUST support connecting to Supabase database using environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) without modifying code
- **FR-003**: System MUST load all configuration from environment variables with sensible defaults for optional settings
- **FR-004**: System MUST configure CORS to accept requests from the FRONTEND_URL environment variable instead of hardcoded localhost
- **FR-005**: System MUST compile TypeScript to JavaScript during the build process, resulting in executable code in the `dist/` directory
- **FR-006**: System MUST start on the port specified by the PORT environment variable (defaulting to 3001)
- **FR-007**: System MUST detect NODE_ENV and apply environment-specific configuration (development, testing, production)
- **FR-008**: System MUST implement structured logging that works with Render's log streaming (JSON or line-delimited format)
- **FR-009**: System MUST validate all required environment variables on startup and provide clear error messages if any are missing
- **FR-010**: System MUST handle Supabase connection errors gracefully without crashing the application immediately
- **FR-011**: System MUST be deployable to Render using the configuration in `render.yaml` without manual workarounds
- **FR-012**: System MUST use `npm ci` for production builds to ensure reproducible dependency installation
- **FR-013**: System MUST not create or reference any local file paths for storage (all files in Supabase)
- **FR-014**: System MUST validate Nano Banana API connectivity and return clear errors if API is unreachable

### Key Entities *(include if feature involves data)*

- **Database Configuration**: Connection string, authentication credentials, SSL/TLS requirements for PostgreSQL
- **File Storage**: Supabase bucket name, authentication tokens, public vs. private file access policies
- **Environment Configuration**: NODE_ENV, PORT, API keys (Nano Banana, Supabase), CORS origins, logging levels
- **Application Settings**: Health check status, version information, runtime environment details

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Backend successfully deploys to Render without manual file system configuration, and the application starts within 30 seconds of deployment
- **SC-002**: All API endpoints respond correctly when backend is on Render and frontend is on separate domain (no CORS errors)
- **SC-003**: Session data persists in Supabase across application restarts (verified by creating sessions, restarting app, confirming sessions still exist)
- **SC-004**: File uploads (images) persist in Supabase storage and are retrievable after application restarts
- **SC-005**: Application startup logs provide clear indication of environment, Supabase connection status, and any configuration issues
- **SC-006**: Build process completes successfully on Render's infrastructure in under 5 minutes
- **SC-007**: Health check endpoint (`/health`) returns 200 status and valid JSON response within 100ms when Supabase is connected
- **SC-008**: Zero hardcoded local file paths in the codebase (all file storage uses Supabase environment variables)
- **SC-009**: All environment variables required by the application are documented with examples and default values in `.env.example`
- **SC-010**: Nano Banana API connectivity is validated on startup with clear error messages if API is unreachable

## Assumptions

- ✅ Supabase account and project already exist with valid credentials
- ✅ Application is already using Supabase for database and file storage (no migration needed)
- ✅ Database schema already exists in Supabase PostgreSQL
- Nano Banana API is currently accessible from local development environment
- User has a Render account and understands basic Render concepts (services, environment variables, logs)
- Frontend deployment will happen separately (to Vercel or similar); backend must be production-ready regardless of frontend status
- Node.js 18+ is available in the Render runtime
- All existing tests pass before deployment (no test refactoring in this feature's scope)

## Out of Scope

- Frontend deployment configuration (separate Vercel integration)
- Database schema changes or migrations (already using Supabase PostgreSQL)
- Nano Banana API feature development or improvements
- CI/CD pipeline beyond basic build/test (no GitHub Actions configuration in this feature)
- API authentication/authorization (assuming session-based approach is sufficient for now)
- Performance optimization or caching strategies
- Container image building or Docker configuration (Render uses buildpacks)
- Monitoring, alerting, or metrics collection beyond basic logging
