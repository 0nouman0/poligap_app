# Environment Setup Script for Poligap Security
# Usage: .\scripts\setup-env.ps1

Write-Host "🔧 Setting up secure environment for Poligap..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📋 Creating .env file from template..." -ForegroundColor Blue
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env file and replace all placeholder values with real credentials!" -ForegroundColor Yellow
    Write-Host "Required variables to update:" -ForegroundColor Yellow
    Write-Host "  - MONGODB_URI" -ForegroundColor Cyan
    Write-Host "  - FALLBACK_USER_ID" -ForegroundColor Cyan
    Write-Host "  - FALLBACK_USER_EMAIL" -ForegroundColor Cyan
    Write-Host "  - FALLBACK_USER_NAME" -ForegroundColor Cyan
    Write-Host "  - SONAR_TOKEN" -ForegroundColor Cyan
    Write-Host "  - All API keys (OpenAI, Gemini, etc.)" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check critical environment variables
Write-Host ""
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Blue

$envVars = @(
    "MONGODB_URI",
    "FALLBACK_USER_ID", 
    "FALLBACK_USER_EMAIL",
    "SONAR_TOKEN"
)

$missingVars = @()
foreach ($var in $envVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if (-not $value) {
        $missingVars += $var
        Write-Host "❌ $var not set" -ForegroundColor Red
    } else {
        Write-Host "✅ $var configured" -ForegroundColor Green
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing environment variables. Please set them in your .env file or system environment." -ForegroundColor Yellow
    Write-Host "Missing: $($missingVars -join ', ')" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "🎉 All critical environment variables are configured!" -ForegroundColor Green
}

# Security check
Write-Host ""
Write-Host "🔒 Running security checks..." -ForegroundColor Blue

# Check if .env is gitignored
$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
if ($gitignoreContent -and ($gitignoreContent -match "\.env\*")) {
    Write-Host "✅ .env files are properly gitignored" -ForegroundColor Green
} else {
    Write-Host "❌ .env files may not be properly gitignored!" -ForegroundColor Red
}

# Check for hardcoded credentials (basic check)
$suspiciousPatterns = @(
    "mongodb\+srv://.*:.*@",
    "sk-[a-zA-Z0-9]{48}",
    "AIza[0-9A-Za-z\\-_]{35}"
)

$foundIssues = @()
foreach ($pattern in $suspiciousPatterns) {
    $matches = Select-String -Path "src\**\*.ts", "src\**\*.js" -Pattern $pattern -ErrorAction SilentlyContinue
    if ($matches) {
        $foundIssues += $matches
    }
}

if ($foundIssues.Count -eq 0) {
    Write-Host "✅ No obvious hardcoded credentials found in source code" -ForegroundColor Green
} else {
    Write-Host "⚠️  Potential hardcoded credentials found:" -ForegroundColor Yellow
    foreach ($issue in $foundIssues) {
        Write-Host "  $($issue.Filename):$($issue.LineNumber)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Blue
Write-Host "1. Edit .env file with your real credentials" -ForegroundColor White
Write-Host "2. Run: .\scripts\sonar-scan.ps1 to scan for security issues" -ForegroundColor White
Write-Host "3. Never commit .env files to version control" -ForegroundColor White
Write-Host "4. Regularly rotate your API keys and passwords" -ForegroundColor White
