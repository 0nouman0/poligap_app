# PowerShell script to fix remaining models
Write-Host "🔧 Fixing remaining model files..."

# List of model files that need fixing
$modelFiles = @(
    "src\models\agentConversationChat.model.ts",
    "src\models\auditLog.model.ts", 
    "src\models\documentAnalysis.model.ts",
    "src\models\enterpriseRule.model.ts",
    "src\models\feedback.model.ts",
    "src\models\flaggedIssue.model.ts",
    "src\models\folderPermissionUserList.model.ts",
    "src\models\integrationPlatform.model.ts",
    "src\models\media.model.ts"
)

foreach ($file in $modelFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Processing $file"
        
        # Read content
        $content = Get-Content $file -Raw
        
        # Replace connection.enterprise with proper fallback pattern
        $content = $content -replace 'connection\.enterprise\.model<([^>]+)>\(\s*"([^"]+)",\s*([^)]+)\)', 'mongoose.models.$2 || mongoose.model<$1>("$2", $3)'
        $content = $content -replace 'connection\.enterprise\.models\.([^|]+)\s*\|\|\s*connection\.enterprise\.model<([^>]+)>\(\s*"([^"]+)",\s*([^)]+)\)', 'mongoose.models.$3 || mongoose.model<$2>("$3", $4)'
        
        # Write back
        Set-Content $file -Value $content -NoNewline
        
        Write-Host "   Fixed enterprise connection references"
    } else {
        Write-Host "❌ File not found: $file"
    }
}

Write-Host "🎉 Model fixing complete!"
Write-Host "💡 Run 'npm run build' to test the fixes"
