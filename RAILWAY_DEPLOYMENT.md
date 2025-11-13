# Railway Backend Deployment Guide

## Step 1: Connect GitHub Repository

1. On the Railway "New Project" screen, click **"GitHub Repository"**
2. Click **"Configure GitHub App"** to authorize Railway
3. Select your repository from the list
4. Railway will auto-detect the project structure

## Step 2: Select the Backend Service

1. Railway will show project detection options
2. Select **"backend"** folder (or the Express.js service)
3. Click **"Deploy"** to start the deployment

## Step 3: Add Environment Variables

After selecting the backend, Railway will show the environment variables screen.

**Add the following variables exactly:**

```
NODE_ENV=production
PORT=3001
NANO_BANANA_API_KEY=500b31e62f3d0f11d347ba0f9f32a0b7
DATABASE_URL=./data/nanobanana.db
FRONTEND_URL=https://[YOUR-VERCEL-FRONTEND-URL] (Add after Vercel deployment)
SUPABASE_URL=https://ehaimmftevvbphjudlyi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYWltbWZ0ZXZ2YnBoanVkbHlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk1MDk3MCwiZXhwIjoyMDUxNTI2OTcwfQ.GerHv4gyrhIyLJW3pGNmDy1cwOnHtAKYLsM0gzfmbJY
SUPABASE_BUCKET_NAME=nanobanana images bucket
LOG_LEVEL=info
```

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for Railway to build and deploy (takes 2-5 minutes)
3. Once deployment is complete, you'll get a URL like: `https://[random-name].railway.app`

## Step 5: Get Your Backend URL

After deployment succeeds:
1. Click the deployed service
2. Find the "Public URL" or "Generated Domain"
3. Copy this URL (example: `https://myapi-production.up.railway.app`)
4. **Save this URL - you'll need it for Vercel**

## Step 6: Update FRONTEND_URL

1. Go back to environment variables
2. Update `FRONTEND_URL` with your Vercel frontend URL (after you deploy it)
3. This is optional but recommended for security

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'tsx'"**
- Railway may not have node_modules installed
- Solution: Ensure `package.json` and `package-lock.json` are in the backend folder (they are)

### Service Crashes After Deploy

**Check logs:**
1. Click your Railway service
2. Go to "Logs" tab
3. Look for error messages

**Common issues:**
- Missing environment variables → Add them from backend/.env.example
- Database file issues → Already configured, should work
- Supabase keys invalid → Verify they're copied correctly

### CORS Errors in Frontend

**If frontend can't connect to backend:**
1. Check the backend URL in Vercel environment variables
2. Ensure it matches your Railway public URL
3. Verify backend has correct FRONTEND_URL set

## Next: Deploy Frontend to Vercel

After Railway deployment succeeds:
1. Go to vercel.com
2. Create new project from your GitHub repo
3. Set these environment variables:
   - `VITE_API_URL=https://[YOUR-RAILWAY-URL]` (without `/api`)
4. Deploy
5. Get your Vercel URL
6. Update Railway's `FRONTEND_URL` with this Vercel URL

