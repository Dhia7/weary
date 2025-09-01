# Start Wear Backend Application
Write-Host "🚀 Starting Wear Backend Application..." -ForegroundColor Green

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml down 2>$null
docker-compose down 2>$null

# Start PostgreSQL with simple setup
Write-Host "🐘 Starting PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
$testResult = docker exec wear_postgres_simple psql -U wear_user -d wear_db -c "SELECT version();" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database is ready!" -ForegroundColor Green
    
    # Start the application
    Write-Host "🎯 Starting Node.js application..." -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host "❌ Database connection failed!" -ForegroundColor Red
    Write-Host "Check the logs with: docker logs wear_postgres_simple" -ForegroundColor Yellow
}
