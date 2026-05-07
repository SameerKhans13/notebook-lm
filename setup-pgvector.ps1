#!/usr/bin/env pwsh

# Quick setup script for NotebookLM with pgvector

Write-Host "================================" -ForegroundColor Cyan
Write-Host "NotebookLM - pgvector Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps *>$null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker Desktop not detected. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Install PostgreSQL locally instead." -ForegroundColor Yellow
    exit 1
}

# Navigate to project directory
Write-Host ""
Write-Host "Setting up project..." -ForegroundColor Yellow

# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Start Docker containers
Write-Host ""
Write-Host "Starting PostgreSQL with pgvector..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Compose failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL container started" -ForegroundColor Green

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempts = 0
while ($attempts -lt $maxAttempts) {
    try {
        $result = docker exec notebook-lm-postgres-1 pg_isready -U notebook_user -d notebook_db 2>$null
        if ($result -match "accepting") {
            Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
            break
        }
    } catch {}
    
    Start-Sleep -Seconds 1
    $attempts++
    Write-Host "." -NoNewline
}

if ($attempts -eq $maxAttempts) {
    Write-Host ""
    Write-Host "⚠️  PostgreSQL took too long to start. Check logs with: docker-compose logs postgres" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the development server:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2. Open in browser:"
Write-Host "   http://localhost:3001"
Write-Host ""
Write-Host "3. Upload a document and test the RAG pipeline"
Write-Host ""
Write-Host "Database credentials:" -ForegroundColor Cyan
Write-Host "  Host: localhost"
Write-Host "  Port: 5432"
Write-Host "  User: notebook_user"
Write-Host "  Password: notebook_password"
Write-Host "  Database: notebook_db"
Write-Host ""
