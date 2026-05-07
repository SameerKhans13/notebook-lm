@echo off
REM NotebookLM Quick Start Script for Windows
REM This script sets up and runs NotebookLM locally

echo.
echo 🚀 NotebookLM - Quick Start Setup
echo ==================================

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% detected

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% detected

REM Check .env.local
if not exist ".env.local" (
    echo.
    echo 📝 Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ✓ .env.local created
    echo.
    echo ⚠️  Please edit .env.local with your configuration:
    echo    - Add your GOOGLE_API_KEY
    echo    - Set QDRANT_URL ^(or use http://localhost:6333^)
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✓ .env.local found

REM Check Docker for Qdrant
if exist "docker-compose.yml" (
    echo.
    echo 🐳 Starting Qdrant with Docker Compose...
    
    where docker >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  Docker not found. Make sure Qdrant is running separately.
        echo    Visit: http://localhost:6333/health
    ) else (
        docker-compose up -d qdrant
        echo ✓ Qdrant started ^(http://localhost:6333^)
        
        echo ⏳ Waiting for Qdrant to be ready...
        timeout /t 3 /nobreak
    )
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed

REM Build
echo.
echo 🔨 Building application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to build application
    pause
    exit /b 1
)

echo ✓ Build successful

REM Done
echo.
echo ==================================
echo ✅ Setup Complete!
echo ==================================
echo.
echo 🚀 Starting development server...
echo.
echo Your app will be available at:
echo    http://localhost:3000
echo.
echo To stop: Press Ctrl+C
echo.

call npm run dev
pause
