#!/bin/bash

# NotebookLM Quick Start Script
# This script sets up and runs NotebookLM locally

echo "🚀 NotebookLM - Quick Start Setup"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✓ npm $(npm --version) detected"

# Check .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✓ .env.local created"
    echo ""
    echo "⚠️  Please edit .env.local with your configuration:"
    echo "   - Add your GOOGLE_API_KEY"
    echo "   - Set QDRANT_URL (or use http://localhost:6333)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✓ .env.local found"

# Check Docker for Qdrant
if [ -f "docker-compose.yml" ]; then
    echo ""
    echo "🐳 Starting Qdrant with Docker Compose..."
    
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker not found. Make sure Qdrant is running separately."
        echo "   Visit: http://localhost:6333/health"
    else
        docker-compose up -d qdrant
        echo "✓ Qdrant started (http://localhost:6333)"
        
        # Wait for Qdrant to be ready
        echo "⏳ Waiting for Qdrant to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:6333/health > /dev/null 2>&1; then
                echo "✓ Qdrant is ready!"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "⚠️  Qdrant took too long to start. Check docker-compose logs."
            fi
            sleep 1
        done
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

# Build
echo ""
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

echo "✓ Build successful"

# Done
echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "🚀 Starting development server..."
echo ""
echo "Your app will be available at:"
echo "   http://localhost:3000"
echo ""
echo "To stop: Press Ctrl+C"
echo ""

npm run dev
