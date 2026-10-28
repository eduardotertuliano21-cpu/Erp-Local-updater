# =====================================================================
# CLICKSTORM SYSTEM - SCRIPT DE BUILD E PACOTE DO INSTALADOR DESKTOP
# =====================================================================
param(
    [switch]$SkipBuild,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$installerDir = $PSScriptRoot
$stagingDir = Join-Path $installerDir "staging"
$outputDir = Join-Path $installerDir "output"
$appStaging = Join-Path $stagingDir "resources\app"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[CLICKSTORM PDV] GERADOR DO INSTALADOR DESKTOP WINDOWS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Compilação do Frontend SPA e Backend
if (-not $SkipBuild) {
    Write-Host "`n[1/4] Compilando Frontend (React + Vite + Tailwind)..." -ForegroundColor Yellow
    Push-Location (Join-Path $rootDir "frontend")
    try {
        npm run build
    } finally {
        Pop-Location
    }

    Write-Host "`n[2/4] Compilando Backend (TypeScript + Dual SQLite)..." -ForegroundColor Yellow
    Push-Location (Join-Path $rootDir "backend")
    try {
        npm run build
    } finally {
        Pop-Location
    }
}

# 2. Montagem da Estrutura de Staging do App Desktop
Write-Host "`n[3/4] Montando Estrutura Desktop Standalone em Staging..." -ForegroundColor Yellow

if (Test-Path $stagingDir) {
    Remove-Item -Path $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
New-Item -ItemType Directory -Path $appStaging -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $appStaging "runtime") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $appStaging "data") -Force | Out-Null
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# Copia Runtime do Electron para a raiz de staging
$electronDist = Join-Path $rootDir "node_modules\electron\dist"
if (Test-Path $electronDist) {
    Write-Host "  -> Embarcando Electron Desktop Engine..." -ForegroundColor Gray
    Copy-Item -Path "$electronDist\*" -Destination $stagingDir -Recurse -Force
    # Renomeia electron.exe para ClickStorm.exe
    if (Test-Path (Join-Path $stagingDir "electron.exe")) {
        Rename-Item -Path (Join-Path $stagingDir "electron.exe") -NewName "ClickStorm.exe" -Force
    }
    # Aplica metadados e ícone ERP.ico no ClickStorm.exe
    $targetExe = Join-Path $stagingDir "ClickStorm.exe"
    if (Test-Path $targetExe) {
        Write-Host "  -> Customizando metadados (Clickstorm ERP Local) e ícone no ClickStorm.exe..." -ForegroundColor Gray
        node (Join-Path $rootDir "scripts\patch_exe_metadata.cjs") $targetExe
    }
} else {
    Write-Error "Runtime do Electron não encontrado em $electronDist. Execute npm install no root."
}

# Copia ícone do aplicativo
$iconSrc = if (Test-Path (Join-Path $rootDir "ERP.ico")) { Join-Path $rootDir "ERP.ico" } else { Join-Path $rootDir "desktop\icon.ico" }
if (Test-Path $iconSrc) {
    Copy-Item -Path $iconSrc -Destination (Join-Path $stagingDir "icon.ico") -Force
}

# Prepara resources/app com o bundle do sistema
Write-Host "  -> Empacotando recursos do ERP e PDV (resources/app)..." -ForegroundColor Gray
Copy-Item -Path (Join-Path $rootDir "package.json") -Destination (Join-Path $appStaging "package.json") -Force
if (Test-Path (Join-Path $rootDir ".env")) {
    Copy-Item -Path (Join-Path $rootDir ".env") -Destination (Join-Path $appStaging ".env") -Force
}
Copy-Item -Path (Join-Path $rootDir "desktop") -Destination (Join-Path $appStaging "desktop") -Recurse -Force
Copy-Item -Path (Join-Path $rootDir "backend\dist") -Destination (Join-Path $appStaging "dist") -Recurse -Force
Copy-Item -Path (Join-Path $rootDir "backend\node_modules") -Destination (Join-Path $appStaging "node_modules") -Recurse -Force
if (Test-Path (Join-Path $rootDir "node_modules\electron-updater")) {
    $targetUpdater = Join-Path $appStaging "node_modules\electron-updater"
    if (-not (Test-Path $targetUpdater)) {
        Copy-Item -Path (Join-Path $rootDir "node_modules\electron-updater") -Destination $targetUpdater -Recurse -Force
    }
}
Copy-Item -Path (Join-Path $rootDir "frontend\dist") -Destination (Join-Path $appStaging "public") -Recurse -Force

Write-Host "  -> Sanitizando bancos de dados de template (sistema limpo para cliente final)..." -ForegroundColor Gray
node (Join-Path $rootDir "scripts\sanitize_databases.cjs")

$sourceDataDir = Join-Path $rootDir "data"
if (Test-Path $sourceDataDir) {
    Get-ChildItem -Path $sourceDataDir -Filter "*.sqlite" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination (Join-Path $appStaging "data") -Force
        if (Test-Path (Join-Path $rootDir "backend\data")) {
            Copy-Item -Path $_.FullName -Destination (Join-Path $rootDir "backend\data") -Force
        }
    }
}

# Copia Node.js runtime embedded
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd -and (Test-Path $nodeCmd.Source)) {
    Write-Host "  -> Embarcando Node.js standalone runtime..." -ForegroundColor Gray
    Copy-Item -Path $nodeCmd.Source -Destination (Join-Path $appStaging "runtime\node.exe") -Force
}

Write-Host "  [OK] Estrutura Desktop montada com sucesso em: $stagingDir" -ForegroundColor Green

# 3. Compilação do Instalador via Inno Setup
if ($SkipInstaller) {
    Write-Host "`n[INFO] Geração do instalador .exe ignorada conforme parâmetro." -ForegroundColor Gray
    exit 0
}

Write-Host "`n[4/4] Compilando Instalador Nativo .EXE via Inno Setup..." -ForegroundColor Yellow

$candidatePaths = @(
    "iscc",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

$isccPath = $null
foreach ($cand in $candidatePaths) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) {
        $isccPath = (Get-Command $cand).Source
        break
    }
    if (Test-Path $cand) {
        $isccPath = $cand
        break
    }
}

if ($isccPath) {
    $pkgPath = Join-Path $rootDir "package.json"
    $appVer = "1.0.4"
    if (Test-Path $pkgPath) {
        $appVer = (Get-Content $pkgPath -Raw | ConvertFrom-Json).version
    }
    Write-Host "  -> Utilizando Inno Setup Compiler: $isccPath" -ForegroundColor Green
    Write-Host "  -> Gerando instalador ClickStorm_Setup_v$appVer.exe..." -ForegroundColor Cyan
    & $isccPath (Join-Path $installerDir "ClickStorm_Setup.iss")
    
    $setupExe = Join-Path $outputDir "ClickStorm_Setup_v$appVer.exe"
    if (Test-Path $setupExe) {
        $sizeMb = [math]::Round((Get-Item $setupExe).Length / 1MB, 2)
        Write-Host "`n==========================================================" -ForegroundColor Green
        Write-Host "[SUCESSO] INSTALADOR GERADO COM SUCESSO!" -ForegroundColor Green
        Write-Host ("Arquivo: " + $setupExe + " (" + $sizeMb + " MB)") -ForegroundColor White
        Write-Host "==========================================================" -ForegroundColor Green
    }
} else {
    Write-Host "  [AVISO] ISCC.exe nao encontrado. Instale com: winget install JRSoftware.InnoSetup" -ForegroundColor Yellow
}
