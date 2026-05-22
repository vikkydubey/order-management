# Railway Deployment Guide

## Quick Deploy (Double-Click Method)

### Windows
1. **Download & Install Railway CLI:**
   - Run `deploy.bat` (double-click the file)
   - Or run `deploy.ps1` in PowerShell

2. **What the installer does:**
   - ✓ Checks for Railway CLI (installs if missing)
   - ✓ Initializes git repository
   - ✓ Logs into your Railway account
   - ✓ Creates a new Railway project
   - ✓ Deploys your app

### macOS/Linux
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```
This opens your browser for authentication.

### 3. Initialize Project
```bash
railway init --name order-management
```

### 4. Deploy
```bash
railway up
```

---

## Environment Configuration

After deployment, configure these in Railway Dashboard:

### Required Environment Variables
```
NODE_ENV=production
PORT=3001
```

### Optional
```
# Database path (defaults to SQLite in container)
DATABASE_PATH=/data/orders.db
```

### Required for SQLite persistence
1. Open your Railway service.
2. Go to the Volumes tab and add a volume.
3. Mount path: `/data`
4. In Variables, set `DATABASE_PATH=/data/orders.db`
5. Redeploy the service.

---

## Project Structure for Railway

```
├── Procfile              # Railway start command
├── railway.json          # Railway config
├── package.json          # Root dependencies
├── backend/
│   ├── server.js         # Express server
│   ├── database.js       # SQLite setup
│   ├── package.json
│   └── node_modules/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── .git/                 # Required for Railway
```

---

## Build & Start Process

Railway will automatically:
1. Run `npm install` for root + all subdirectories
2. Build frontend: `npm run build`
3. Start backend: `npm start`

The built frontend (in `backend/public/`) is served from the same origin.

---

## Accessing Your App

After successful deployment:
1. Visit the Railway Dashboard: https://railway.app
2. Click your project
3. Find the domain/URL assigned to your service
4. Visit `https://your-app-url.railway.app`

---

## Database Persistence

### Current Setup (SQLite in Container)
- If `DATABASE_PATH` is not set to a mounted volume, data can reset on restart/redeploy
- Good for testing/demo only

### For Production (Optional)
Add a PostgreSQL plugin in Railway Dashboard:
1. Click "Create" in your Railway project
2. Select "PostgreSQL"
3. Railway automatically injects `DATABASE_URL`
4. Update `backend/database.js` to use PostgreSQL

---

## Useful Railway Commands

```bash
# View logs
railway logs

# Open interactive shell
railway shell

# View current environment
railway env

# Redeploy last commit
railway up

# Stop service
railway down
```

---

## Troubleshooting

### Build Failed
- Check `railway logs` for errors
- Ensure all dependencies are listed in `package.json`
- Verify `backend/` and `frontend/` have their own `package.json`

### Port Error
- Railway assigns a dynamic port via `$PORT` env var
- Backend uses `process.env.PORT || 3001`
- No configuration needed

### Database Not Found
- SQLite creates automatically on first run
- Check logs: `railway logs`

### CORS Issues (If API is separate)
- Backend has CORS enabled in dev mode
- In production (`NODE_ENV=production`), frontend and backend share origin
- No CORS headers needed

---

## Cost

Railway pricing:
- **Free Tier**: $5/month credit per account
- **Pay as you go**: $0.50/GB RAM-hour, $0.08/GB storage-month
- This app easily fits within free tier

---

## Next Steps

1. Deploy with `deploy.bat` or `railway up`
2. Add a PostgreSQL database (optional, for persistence)
3. Configure custom domain (Railway Dashboard → Settings)
4. Set up automated deployments (push to GitHub, Railway auto-deploys)

---

## Support

- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/guides/cli
- Community: https://railway.app/community
