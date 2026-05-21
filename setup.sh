#!/bin/bash

echo ""
echo "========================================"
echo "Order Management System - Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

echo ""
echo "Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Backend installation failed!"
    exit 1
fi

echo ""
echo "Installing Frontend Dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Frontend installation failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Open TWO terminal windows"
echo ""
echo "   Terminal 1 - Start Backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "   Terminal 2 - Start Frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. Go to Admin Panel and add Categories and Items"
echo ""
