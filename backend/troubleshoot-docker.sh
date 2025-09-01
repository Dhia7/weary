#!/bin/bash

echo "🔍 Docker Troubleshooting Script"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

echo "✅ Docker is installed: $(docker --version)"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running."
    echo ""
    echo "🔧 To fix this:"
    echo "   1. Open Docker Desktop from your Start Menu"
    echo "   2. Wait for it to fully start (check system tray)"
    echo "   3. Try running this script again"
    echo ""
    echo "💡 Alternative: Use the simple setup without PgBouncer:"
    echo "   npm run db:simple"
    exit 1
fi

echo "✅ Docker daemon is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available."
    echo "💡 Try using: docker compose (without hyphen)"
    exit 1
fi

echo "✅ Docker Compose is available"

# Test pulling the images
echo "📥 Testing image pulls..."

echo "Testing PostgreSQL image..."
if docker pull postgres:15; then
    echo "✅ PostgreSQL image pulled successfully"
else
    echo "❌ Failed to pull PostgreSQL image"
    exit 1
fi

echo "Testing PgBouncer image..."
if docker pull bitnami/pgbouncer:1.18.0; then
    echo "✅ PgBouncer image pulled successfully"
else
    echo "❌ Failed to pull PgBouncer image"
    echo "💡 You can still use the simple setup: npm run db:simple"
    exit 1
fi

echo ""
echo "🎉 All checks passed! You can now run:"
echo "   npm run db:up    # Full setup with PgBouncer"
echo "   npm run db:simple # Simple setup (PostgreSQL only)"
