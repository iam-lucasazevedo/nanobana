# nanobanana Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-13

## Active Technologies
- TypeScript/Node.js 18+ (per CLAUDE.md) + Express.js 4.18, SQLite3 5.1.6 (migrating to PostgreSQL), Supabase 2.81.1, Multer 1.4.5, dotenv 16.6.1 (002-render-deployment)
- Currently SQLite at `./data/nanobanana.db` (migrating to PostgreSQL); file uploads at `./data/uploads` (migrating to Supabase) (002-render-deployment)
- TypeScript, Node.js 18+ + Express.js 4.18, Axios (HTTP client for webhook calls) (feature/ai-prompt-enhance)
- Supabase PostgreSQL (for request logging/audit trail if needed; enhancement requests are stateless) (feature/ai-prompt-enhance)

- TypeScript/Node.js 18+ (frontend & backend) (001-nano-banana-app)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript/Node.js 18+ (frontend & backend): Follow standard conventions

## Recent Changes
- feature/ai-prompt-enhance: Added TypeScript, Node.js 18+ + Express.js 4.18, Axios (HTTP client for webhook calls)
- 002-render-deployment: Added TypeScript/Node.js 18+ (per CLAUDE.md) + Express.js 4.18, SQLite3 5.1.6 (migrating to PostgreSQL), Supabase 2.81.1, Multer 1.4.5, dotenv 16.6.1

- 001-nano-banana-app: Added TypeScript/Node.js 18+ (frontend & backend)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
