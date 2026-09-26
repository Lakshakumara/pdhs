# deploy.ps1 - pulls latest code, builds, and redeploys both apps
# Stops immediately on any error and shows what failed

$ErrorActionPreference = "Stop"

function Run-Step {
    param(
        [string]$StepName,
        [scriptblock]$Action
    )
    Write-Host "=== $StepName ===" -ForegroundColor Cyan
    try {
        & $Action
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            throw "$StepName failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Host "!!! FAILED at: $StepName !!!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

$rootPath     = "D:\root"
$frontendRepo = "https://github.com/Lakshakumara/pdhs.git"
$backendRepo  = "https://github.com/Lakshakumara/pdhs-api.git"
$frontendPath = "$rootPath\pdhs"
$backendPath  = "$rootPath\pdhs-api"

Run-Step "Updating Frontend (Angular)" {
    if (Test-Path "$frontendPath\.git") {
        Set-Location $frontendPath
        git pull
    } else {
        Set-Location $rootPath
        git clone $frontendRepo
    }
}

Run-Step "Installing Frontend deps" {
    Set-Location $frontendPath
    npm install
}

Run-Step "Building Frontend" {
    Set-Location $frontendPath
    ng build --configuration production
}

Run-Step "Updating Backend (NestJS)" {
    if (Test-Path "$backendPath\.git") {
        Set-Location $backendPath
        git pull
    } else {
        Set-Location $rootPath
        git clone $backendRepo
    }
}

Run-Step "Copying Angular build into NestJS client folder" {
    $clientDest = "$backendPath\client"
    Remove-Item -Recurse -Force "$clientDest\*" -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $clientDest | Out-Null
    Copy-Item -Recurse "$frontendPath\dist\pdhs\browser\*" $clientDest
}

Run-Step "Installing Backend deps" {
    Set-Location $backendPath
    npm install
}

Run-Step "Building Backend" {
    Set-Location $backendPath
    npm run build
}

Run-Step "Checking .env exists" {
    if (-not (Test-Path "$backendPath\.env")) {
        throw ".env file missing in $backendPath — app will fail to connect to DB. Create it before restarting PM2."
    }
}

Run-Step "Restarting via PM2" {
    Set-Location $backendPath
    $pmListText = pm2 list
    if ($pmListText -match "nestjs-api") {
        pm2 restart nestjs-api
    } else {
        pm2 start dist/src/main.js --name nestjs-api
    }
    pm2 save
}

Write-Host "Deploy complete." -ForegroundColor Green

Write-Host "=== Post-deploy check ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
pm2 list
pm2 logs nestjs-api --lines 20 --nostream