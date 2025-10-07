# SonarQube Security Scan Script
# Usage: .\scripts\sonar-scan.ps1

Write-Host "🔍 Starting SonarQube Security Scan..." -ForegroundColor Green

# Check if SONAR_TOKEN is set in environment
if (-not $env:SONAR_TOKEN) {
    Write-Host "⚠️  SONAR_TOKEN environment variable not set!" -ForegroundColor Yellow
    Write-Host "Please set it first:" -ForegroundColor Yellow
    Write-Host '$env:SONAR_TOKEN="your_token_here"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or add it to your .env file and source it." -ForegroundColor Yellow
    exit 1
}

# Verify SonarQube server is running
Write-Host "🌐 Checking SonarQube server connection..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ SonarQube server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ SonarQube server is not accessible at http://localhost:9000" -ForegroundColor Red
    Write-Host "Please start SonarQube server first." -ForegroundColor Yellow
    exit 1
}

# Run the scan
Write-Host "🚀 Running SonarQube scanner..." -ForegroundColor Blue
npx sonarqube-scanner

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SonarQube scan completed successfully!" -ForegroundColor Green
    Write-Host "📊 View results at: http://localhost:9000/dashboard?id=poligap" -ForegroundColor Cyan
} else {
    Write-Host "❌ SonarQube scan failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
