@echo off
echo.
echo ========================================
echo Order Management System - Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version

echo.
echo Installing Backend Dependencies...
cd backend
call npm install
if errorlevel 1 goto :error

echo.
echo Installing Frontend Dependencies...
cd ..\frontend
call npm install
if errorlevel 1 goto :error

echo.
echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Open TWO command prompts
echo.
echo    Terminal 1 - Start Backend:
echo    cd c:\Projects\OrderManagement\backend
echo    npm start
echo.
echo    Terminal 2 - Start Frontend:
echo    cd c:\Projects\OrderManagement\frontend
echo    npm run dev
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo 4. Go to Admin Panel and add Categories and Items
echo.
pause
exit /b 0

:error
echo.
echo ERROR: Installation failed!
echo Please check the error messages above.
pause
exit /b 1
