#!/bin/bash
# Order Management System - Railway Deployment Installer
# Run: chmod +x deploy.sh && ./deploy.sh

set -e  # Exit on error

echo ""
echo "================================"
echo "Order Management - Railway Deploy"
echo "================================"
echo ""

# Check if Railway CLI is installed
echo "Checking for Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "Failed to install Railway CLI. Please install manually:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
fi

echo "Railway CLI found ✓"
echo ""

# Check if git is initialized
echo "Checking git repository..."
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
fi

echo "Git repository ready ✓"
echo ""

# Login to Railway
echo "Logging in to Railway..."
echo "(Browser will open for authentication)"
railway login

if [ $? -ne 0 ]; then
    echo "Login cancelled. Exiting..."
    exit 1
fi

echo "Railway login successful ✓"
echo ""

# Create or link project
echo "Setting up Railway project..."
PROJECT_NAME="order-management-$(date +%Y%m%d)"

railway init --name "$PROJECT_NAME"

if [ $? -ne 0 ]; then
    echo "Project setup failed. Trying to link existing project..."
    railway link
fi

echo "Railway project ready ✓"
echo ""

# Display deployment info
echo "Deployment Configuration:"
echo "- Build: npm run build"
echo "- Start: npm start"
echo "- Port: 3001 (will be exposed via Railway)"
echo "- Database: SQLite (local to container)"
echo ""

# Deploy
echo "Ready to deploy!"
echo "Push your code with: git push"
echo "Or deploy now with: railway up"
echo ""
read -p "Deploy now? (y/n): " deploy

if [ "$deploy" = "y" ] || [ "$deploy" = "Y" ]; then
    echo ""
    echo "Starting deployment..."
    git add . 2>/dev/null || true
    git commit -m "Pre-deployment build" 2>/dev/null || true
    railway up
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "================================"
        echo "Deployment Successful! ✓"
        echo "================================"
        echo ""
        echo "Your app is now live on Railway!"
        echo "Check your deployment at: https://railway.app"
        echo ""
        echo "View logs: railway logs"
        echo "Open shell: railway shell"
    fi
else
    echo ""
    echo "Deployment cancelled."
    echo "You can deploy later using: railway up"
fi

echo ""
