@echo off
REM Order Management - Railway Deployment Installer
REM Double-click this file to deploy to Railway

setlocal enabledelayedexpansion

echo.
echo ================================
echo Order Management - Railway Deploy
echo ================================
echo.

REM Check if PowerShell is available
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"

if errorlevel 1 (
    echo.
    echo Error: PowerShell execution failed.
    echo Try running deploy.ps1 directly in PowerShell.
    pause
    exit /b 1
)

pause
