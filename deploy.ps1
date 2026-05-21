# Order Management System - Railway Deployment Installer
# Double-click this file to deploy to Railway

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Order Management - Railway Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
Write-Host "Checking for Railway CLI..." -ForegroundColor Yellow
$railway = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railway) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Railway CLI. Please install manually:" -ForegroundColor Red
        Write-Host "npm install -g @railway/cli" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Railway CLI found ✓" -ForegroundColor Green
Write-Host ""

# Check if git is initialized
Write-Host "Checking git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
}

Write-Host "Git repository ready ✓" -ForegroundColor Green
Write-Host ""

# Login to Railway
Write-Host "Logging in to Railway..." -ForegroundColor Yellow
Write-Host "(Browser will open for authentication)" -ForegroundColor Gray
railway login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Login cancelled. Exiting..." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Railway login successful ✓" -ForegroundColor Green
Write-Host ""

# Create or link project
Write-Host "Setting up Railway project..." -ForegroundColor Yellow
$projectName = "order-management-$(Get-Date -Format 'yyyyMMdd')"

railway init --name $projectName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Project setup failed. Trying to link existing project..." -ForegroundColor Yellow
    railway link
}

Write-Host "Railway project ready ✓" -ForegroundColor Green
Write-Host ""

# Verify environment variables are set (optional - user can set in Railway dashboard)
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "- Build: npm run build" -ForegroundColor Gray
Write-Host "- Start: npm start" -ForegroundColor Gray
Write-Host "- Port: 3001 (will be exposed via Railway)" -ForegroundColor Gray
Write-Host "- Database: SQLite (local to container)" -ForegroundColor Gray
Write-Host ""

# Deploy
Write-Host "Ready to deploy!" -ForegroundColor Green
Write-Host "Push your code with: " -ForegroundColor Yellow -NoNewline
Write-Host "git push" -ForegroundColor White
Write-Host ""
Write-Host "Or deploy now with: " -ForegroundColor Yellow -NoNewline
Write-Host "railway up" -ForegroundColor White
Write-Host ""

$deploy = Read-Host "Deploy now? (y/n)"

if ($deploy -eq 'y' -or $deploy -eq 'Y') {
    Write-Host ""
    Write-Host "Starting deployment..." -ForegroundColor Cyan
    git add .
    git commit -m "Pre-deployment build" -ErrorAction SilentlyContinue
    railway up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================" -ForegroundColor Green
        Write-Host "Deployment Successful! ✓" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your app is now live on Railway!" -ForegroundColor Green
        Write-Host "Check your deployment at: https://railway.app" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View logs: " -ForegroundColor Yellow -NoNewline
        Write-Host "railway logs" -ForegroundColor White
        Write-Host "Open shell: " -ForegroundColor Yellow -NoNewline
        Write-Host "railway shell" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    Write-Host "You can deploy later using: railway up" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Press Enter to exit"
