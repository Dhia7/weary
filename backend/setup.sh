#!/bin/bash

echo "🚀 Setting up Wear Backend with PgBouncer..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists."
fi

# Start database services
echo "🐘 Starting PostgreSQL and PgBouncer..."
npm run db:up

# Wait for services to be ready
echo "⏳ Waiting for database services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Database services are running!"
    echo ""
    echo "📊 Service Status:"
    echo "   PostgreSQL: localhost:5432"
    echo "   PgBouncer:  localhost:6432"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Edit .env file with your configuration"
    echo "   2. Run 'npm run dev' to start the development server"
    echo "   3. Access the API at http://localhost:5000"
    echo ""
    echo "📚 Useful commands:"
    echo "   npm run dev          - Start development server"
    echo "   npm run db:logs      - View database logs"
    echo "   npm run db:down      - Stop database services"
    echo "   npm run db:restart   - Restart database services"
else
    echo "❌ Failed to start database services. Check the logs with 'npm run db:logs'"
    exit 1
fi
