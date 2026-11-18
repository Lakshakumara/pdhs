# pdhs.ps1 - pulls latest code, builds, and redeploys both apps
#
# ORDER MATTERS: the backend builds FIRST because its "prebuild" step
# (npm run gen:perms) regenerates the frontend permission files in ../pdhs.
# The frontend build must run AFTER that so it compiles the fresh files.
#
# Stops immediately on any error and shows what failed

$ErrorActionPreference = "Stop"

function Run-Step {
    param(
        [string]$StepName,
        [scriptblock]$Action
    )
    Write-Host "=== $StepName ===" -ForegroundColor Cyan
    try {
        # Reset the GLOBAL LASTEXITCODE: a local $null would shadow the real
        # value (and a stale value from the caller's session caused false fails)
        $global:LASTEXITCODE = $null
        & $Action
        if ($null -ne $global:LASTEXITCODE -and $global:LASTEXITCODE -ne 0) {
            throw "$StepName failed with exit code $global:LASTEXITCODE"
        }
    }
    catch {
        Write-Host "!!! FAILED at: $StepName !!!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Root = the folder this script lives in (E:\root on the server, D:\root on dev)
$rootPath     = $PSScriptRoot
$frontendRepo = "https://github.com/Lakshakumara/pdhs.git"
$backendRepo  = "https://github.com/Lakshakumara/pdhs-api.git"
$frontendPath = "$rootPath\pdhs"
$backendPath  = "$rootPath\pdhs-api"

Run-Step "Checking prerequisites" {
    foreach ($cmd in 'git', 'node', 'npm', 'npx', 'pm2') {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            throw "'$cmd' is not installed or not on PATH. Install it before deploying."
        }
    }
}

Run-Step "Updating Frontend (Angular)" {
    if (Test-Path "$frontendPath\.git") {
        Set-Location $frontendPath
        # Server must mirror GitHub: discard any local edits before pulling
        git reset --hard HEAD
        git pull
    } else {
        Set-Location $rootPath
        git clone $frontendRepo
    }
}

Run-Step "Updating Backend (NestJS)" {
    if (Test-Path "$backendPath\.git") {
        Set-Location $backendPath
        # Server must mirror GitHub: discard any local edits before pulling
        # (safe: .env, client/, dist/, node_modules are all gitignored)
        git reset --hard HEAD
        git pull
    } else {
        Set-Location $rootPath
        git clone $backendRepo
    }
}

Run-Step "Checking .env exists" {
    if (-not (Test-Path "$backendPath\.env")) {
        throw ".env file missing in $backendPath - app will fail to connect to DB. Create it before continuing."
    }
}

Run-Step "Installing Backend deps" {
    Set-Location $backendPath
    npm install
}

Run-Step "Generating Prisma client" {
    Set-Location $backendPath
    # Required after every schema change / fresh install: regenerates the
    # typed client in node_modules\.prisma so nest build can type-check.
    npx prisma generate
}

Run-Step "Building Backend" {
    Set-Location $backendPath
    # prebuild = gen:perms -> regenerates E:\root\pdhs permission files
    npm run build
}

Run-Step "Installing Frontend deps" {
    Set-Location $frontendPath
    npm install
}

Run-Step "Building Frontend" {
    Set-Location $frontendPath
    # 'ng' is not global on a clean server - use the package script
    # (npm run build = ng build with the default production configuration).
    # Runs AFTER the backend build so gen:perms output is compiled in.
    npm run build
}

Run-Step "Copying Angular build into NestJS client folder" {
    $clientDest = "$backendPath\client"
    Remove-Item -Recurse -Force "$clientDest\*" -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $clientDest | Out-Null
    Copy-Item -Recurse "$frontendPath\dist\pdhs\browser\*" $clientDest
}

Run-Step "Running DB migrations" {
    Set-Location $backendPath
    npx prisma migrate deploy
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
