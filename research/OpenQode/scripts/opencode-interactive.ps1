# Interactive OpenCode launcher with model selection and auto-auth
param(
    [string]$Model = "",
    [switch]$SkipAuth = $false
)

function Show-ModelMenu {
    # Console clear disabled to preserve startup logs/history
    Write-Host "🤖 OpenCode - Choose Your AI Model" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Qwen Coder Model (Free - 2,000 requests/day, 60 RPM)" -ForegroundColor Green
    Write-Host "   • Excellent for coding tasks" -ForegroundColor Gray
    Write-Host "   • Requires qwen.ai authentication" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Qwen Vision Model (Free - 2,000 requests/day, 60 RPM)" -ForegroundColor Green
    Write-Host "   • For vision and coding tasks" -ForegroundColor Gray
    Write-Host "   • Requires qwen.ai authentication" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. OpenCode Big Pickle (Default)" -ForegroundColor Yellow
    Write-Host "   • OpenCode's default model" -ForegroundColor Gray
    Write-Host "   • No authentication required" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. OpenCode GPT-5 Nano" -ForegroundColor Yellow
    Write-Host "   • OpenCode's experimental model" -ForegroundColor Gray
    Write-Host "   • No authentication required" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Grok Code" -ForegroundColor Yellow
    Write-Host "   • Grok's coding model" -ForegroundColor Gray
    Write-Host "   • No authentication required" -ForegroundColor Gray
    Write-Host ""
    
    do {
        $choice = Read-Host "Enter your choice (1-5)"
        switch ($choice) {
            "1" { return "qwen/coder-model" }
            "2" { return "qwen/vision-model" }
            "3" { return "opencode/big-pickle" }
            "4" { return "opencode/gpt-5-nano" }
            "5" { return "opencode/grok-code" }
            default { 
                Write-Host "Invalid choice. Please enter 1-5." -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    } while ($choice -notin @("1","2","3","4","5"))
}

function Test-QwenAuth {
    try {
        $result = & "E:\TRAE Playground\Test Ideas\opencode-install\opencode.exe" auth list 2>$null
        return $result -match "qwen"
    } catch {
        return $false
    }
}

function Start-QwenAuth {
    Write-Host ""
    Write-Host "🔐 Qwen Authentication Required" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host "Opening browser for qwen.ai authentication..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        & "E:\TRAE Playground\Test Ideas\opencode-install\opencode.exe" auth qwen
        Write-Host ""
        Write-Host "✅ Authentication initiated! Please complete in browser." -ForegroundColor Green
        Write-Host "⏳ Waiting for authentication to complete..." -ForegroundColor Cyan
        
        # Wait for auth to complete
        $maxWait = 60  # seconds
        $waited = 0
        do {
            Start-Sleep -Seconds 2
            $waited += 2
            if (Test-QwenAuth) {
                Write-Host "✅ Authentication successful!" -ForegroundColor Green
                return $true
            }
            if ($waited -ge $maxWait) {
                Write-Host "⚠️ Authentication timeout. You can try again later." -ForegroundColor Yellow
                return $false
            }
        } while ($waited -lt $maxWait)
        
    } catch {
        Write-Host "❌ Failed to start authentication" -ForegroundColor Red
        Write-Host "You can manually run: opencode auth qwen" -ForegroundColor Gray
        return $false
    }
    
    return $false
}

function Start-OpenCode {
    param([string]$SelectedModel)
    
    Write-Host ""
    Write-Host "🚀 Starting OpenCode TUI..." -ForegroundColor Green
    Write-Host "Model: $SelectedModel" -ForegroundColor Cyan
    Write-Host "Features: Lakeview + Sequential Thinking" -ForegroundColor Gray
    Write-Host ""
    Start-Sleep -Seconds 2
    
    # Launch OpenCode with selected model and features
    & "E:\TRAE Playground\Test Ideas\opencode-install\opencode.exe" -m $SelectedModel --lakeview --think
}

# Main execution
if (-not $Model) {
    $selectedModel = Show-ModelMenu
} else {
    $selectedModel = $Model
}

# Check if Qwen model needs authentication
if ($selectedModel -like "qwen/*" -and -not $SkipAuth) {
    if (-not (Test-QwenAuth)) {
        if (Start-QwenAuth) {
            Start-OpenCode -SelectedModel $selectedModel
        } else {
            Write-Host ""
            Write-Host "❌ Could not authenticate with Qwen. Please try again later." -ForegroundColor Red
            Write-Host "You can manually run: opencode auth qwen" -ForegroundColor Gray
            exit 1
        }
    } else {
        Write-Host "✅ Already authenticated with Qwen!" -ForegroundColor Green
        Start-OpenCode -SelectedModel $selectedModel
    }
} else {
    Start-OpenCode -SelectedModel $selectedModel
}