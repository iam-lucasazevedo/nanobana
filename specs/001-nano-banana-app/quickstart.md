# Developer Quickstart: Nano Banana Image Generation Web App

**Date**: 2025-11-13
**Status**: Complete
**Audience**: Development team setting up the project for the first time

## Prerequisites

- Node.js 18+ (verify with `node --version`)
- npm or yarn package manager
- Git
- A kie.ai Nano Banana API key (from kie.ai account)

## Project Structure Overview

```
nanobanana/
├── backend/                      # Express API server
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── types/                # TypeScript interfaces
│   │   ├── models/               # Data models
│   │   ├── services/             # Business logic
│   │   ├── api/                  # Express routes
│   │   └── utils/                # Helpers
│   ├── tests/                    # Test files
│   └── package.json
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── main.tsx              # Vite entry
│   │   ├── App.tsx               # Root component
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client
│   │   ├── hooks/                # Custom hooks
│   │   └── types/                # TypeScript interfaces
│   ├── tests/                    # Test files
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── specs/001-nano-banana-app/    # Feature documentation
    ├── spec.md                   # Feature specification
    ├── plan.md                   # Implementation plan
    ├── research.md               # Research findings
    ├── data-model.md             # Data model
    └── contracts/                # API contracts
```

## Backend Setup

### Step 1: Configure Environment

Create `backend/.env` with:
```bash
# Nano Banana API Key (from kie.ai)
NANO_BANANA_API_KEY=your_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Database (SQLite path)
DATABASE_URL=./data/nanobanana.db

# CORS (for frontend)
FRONTEND_URL=http://localhost:5173
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

**Expected packages**:
- `express`: HTTP server
- `typescript`: Language
- `ts-node`: TypeScript execution
- `axios` (or use native fetch): HTTP client for proxying
- `better-sqlite3` or `sqlite3`: Database driver
- `dotenv`: Environment config
- Testing: `jest`, `supertest`, `@types/jest`

### Step 3: Initialize Database

```bash
npm run db:init
```

This creates `data/nanobanana.db` with the schema from `data-model.md`.

### Step 4: Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`. You should see:
```
Express server running on http://localhost:3001
Database initialized at ./data/nanobanana.db
```

### Step 5: Verify Backend Health

Test with curl:
```bash
curl -X POST http://localhost:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response (creates a session):
```json
{
  "sessionId": "uuid-string",
  "createdAt": "2025-11-13T12:00:00Z"
}
```

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

**Expected packages**:
- `react@18`: UI library
- `vite`: Build tool
- `typescript`: Language
- `tailwindcss`: Styling
- `radix-ui` or `headlessui`: Component library
- Testing: `vitest`, `@testing-library/react`

### Step 2: Vite Configuration

`vite.config.ts` should proxy API calls to backend:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

### Step 3: Tailwind Setup

`tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: []
};
```

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Start Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite will auto-proxy `/api` calls to the backend.

### Step 5: Verify Frontend Loads

Open `http://localhost:5173` in your browser. You should see:
- A clean UI with two mode buttons: "Create from text" and "Edit images"
- No errors in the browser console
- Session initialized on load

## Running Both Servers

### Option A: Two Terminal Windows

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

### Option B: Use a Process Manager (Optional)

Install `concurrently`:
```bash
npm install -g concurrently
```

From root, create `npm` script:
```bash
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

Then run:
```bash
npm run dev
```

## Testing

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Test structure**:
- `tests/unit/` - Service and utility tests
- `tests/integration/` - API endpoint tests with mocked/real Nano Banana calls
- `tests/contract/` - API contract validation tests

### Frontend Tests

```bash
cd frontend
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

**Test structure**:
- `tests/unit/` - Component and hook tests
- `tests/integration/` - Frontend-backend integration flows
- `tests/contract/` - API contract validation tests

## Building for Production

### Backend Build

```bash
cd backend
npm run build
npm run start
```

Creates compiled JavaScript in `dist/` directory.

### Frontend Build

```bash
cd frontend
npm run build
```

Creates optimized bundle in `dist/` directory. Deploy to static hosting (Vercel, Netlify, etc.) or serve behind a reverse proxy.

## Common Development Tasks

### Adding a New API Endpoint

1. Define request/response types in `backend/src/types/`
2. Implement service logic in `backend/src/services/`
3. Add Express route in `backend/src/api/`
4. Write integration tests in `backend/tests/integration/`
5. Create frontend client method in `frontend/src/services/apiClient.ts`
6. Call from React component
7. Update `contracts/api.md` with new endpoint spec

### Creating a New React Component

1. Create file in `frontend/src/components/YourComponent.tsx`
2. Write component with TypeScript types
3. Style with Tailwind classes
4. Add unit tests in `frontend/tests/unit/`
5. Export from component index for easy imports

### Updating the Data Model

1. Modify schema in `backend/src/models/`
2. Create migration (or regenerate SQLite schema)
3. Update TypeScript types in both `backend/src/types/` and `frontend/src/types/`
4. Update integration tests
5. Document changes in `data-model.md`

## Debugging Tips

### Backend
- Enable debug logging: `DEBUG=* npm run dev`
- Check `.env` has `NANO_BANANA_API_KEY` set
- Inspect network with: `curl -v http://localhost:3001/api/...`
- Database errors: Check `data/nanobanana.db` exists and is readable

### Frontend
- Use React DevTools browser extension
- Browser DevTools Network tab to inspect API calls
- Check localStorage: `localStorage.getItem('sessionId')`
- Console for component render issues

### API Integration
- Test Nano Banana API directly (outside this app) to verify key works
- Use Postman or similar to test backend endpoints
- Enable request logging in Express middleware

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3001 already in use | Change `PORT` in `.env` or kill process: `lsof -i :3001` |
| `NANO_BANANA_API_KEY` error | Verify `.env` file exists in backend/ and contains key |
| Frontend can't reach backend API | Check Vite proxy config; ensure backend running on 3001 |
| Database locked error | Kill any other processes accessing db; restart backend |
| Tailwind classes not applying | Verify `content` paths in `tailwind.config.js` are correct |
| TypeScript errors | Run `npm run type-check` to see all type issues |

## Next Steps

1. Complete the backend and frontend implementation (see `/speckit.tasks`)
2. Set up CI/CD for automated testing (GitHub Actions recommended)
3. Deploy backend to hosting (Heroku, Railway, AWS Lambda, etc.)
4. Deploy frontend to CDN (Vercel, Netlify, etc.)
5. Monitor performance and error rates in production

## Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Radix UI Docs](https://www.radix-ui.com/) or [Headless UI Docs](https://headlessui.com/)
- [kie.ai Nano Banana API Docs](https://kie.ai/docs)
- [SQLite Docs](https://www.sqlite.org/)

## Support

For issues or questions:
1. Check this quickstart and project README
2. Review error logs in backend/frontend console
3. Check GitHub issues in the repository
4. Consult the feature specification (`spec.md`) for requirements
