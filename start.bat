@echo off
setlocal enabledelayedexpansion
title CrewAI Studio & Documentation

echo ================================================================
echo           CrewAI Studio ^& Multi-Agent Workbench
echo ================================================================
echo.

:: 1. Check for Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js (version 20+ recommended) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Display detected Node and npm versions
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo [OK] Detected Node.js !NODE_VER! and npm !NPM_VER!

:: 3. Check for .env file, create from .env.example if missing
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env not found. Creating default .env from .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] .env file created. You can customize your API keys anytime.
    )
)

:: 4. Check for node_modules, install dependencies if missing
if not exist "node_modules" (
    echo [INFO] node_modules directory missing. Installing dependencies...
    echo This may take a minute on first run...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
)

:: 5. Open browser automatically
echo [INFO] Launching default browser to http://localhost:3000...
start "" "http://localhost:3000"

:: 6. Start the full-stack development server
echo.
echo ================================================================
echo [READY] Server running at http://localhost:3000
echo - Documentation, Crew Studio, Flow Visualizer, Tools ^& GitHub Hub
echo - Press Ctrl+C in this command prompt anytime to stop the server.
echo ================================================================
echo.

call npm run dev

pause
