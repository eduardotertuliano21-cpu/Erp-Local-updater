# =====================================================================
# CLICKSTORM - SCRIPT DE PUBLICAÇÃO DE RELEASE NO GITHUB (AUTO-UPDATE)
# =====================================================================
param(
    [string]$Version = "",
    [string]$ReleaseNotes = "Atualização automática ClickStorm PDV & ERP com melhorias e correções.",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$token = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } else { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("Z2l0aHViX3BhdF8xMUI1SVhKVVkwUFoxbmRnR2FsTkRuX0ZZd3dhSUJHREdGRGpYVDNTQlI3d0ZGanolbEkyTzhPZWN5RjNkSEkwcDRTNldLQU9EQTk3dW9Eak9q")) }
$owner = "eduardotertuliano21-cpu"
$repo = "Erp-Local-updater"

# 1. Determina a versão
if (-not $Version) {
    $pkgJsonPath = Join-Path $rootDir "package.json"
    if (Test-Path $pkgJsonPath) {
        $pkg = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
        $Version = $pkg.version
    } else {
        $Version = "1.0.0"
    }
} else {
    $pkgJsonPath = Join-Path $rootDir "package.json"
    if (Test-Path $pkgJsonPath) {
        $pkgContent = Get-Content $pkgJsonPath -Raw
        $pkgContent = $pkgContent -replace '"version":\s*"[^"]+"', "`"version`": `"$Version`""
        Set-Content -Path $pkgJsonPath -Value $pkgContent -NoNewline
    }
    $issPath = Join-Path $rootDir "installer\ClickStorm_Setup.iss"
    if (Test-Path $issPath) {
        $issContent = Get-Content $issPath -Raw
        $issContent = $issContent -replace '#define MyAppVersion "[^"]+"', "#define MyAppVersion `"$Version`""
        Set-Content -Path $issPath -Value $issContent -NoNewline
    }
}

$tag = "v$Version"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[CLICKSTORM GITHUB RELEASE] Tag: $tag | Repo: $owner/$repo" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 2. Compila instalador se necessário
$outputDir = Join-Path $rootDir "installer\output"
$installerExe = Join-Path $outputDir "ClickStorm_Setup_v$Version.exe"

if (-not $SkipBuild) {
    Write-Host "`n[1/3] Compilando sistema e gerando instalador Windows..." -ForegroundColor Yellow
    Push-Location (Join-Path $rootDir "installer")
    try {
        powershell -ExecutionPolicy Bypass -File "build_installer.ps1"
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $installerExe)) {
    # Tenta achar qualquer .exe na pasta output
    $found = Get-ChildItem -Path $outputDir -Filter "*.exe" | Select-Object -First 1
    if ($found) {
        $installerExe = $found.FullName
    } else {
        Write-Error "Instalador não encontrado em: $outputDir"
        exit 1
    }
}

$assetName = "ClickStorm_Setup_$tag.exe"
Write-Host "`n[2/3] Preparando publicação no GitHub..." -ForegroundColor Yellow
Write-Host "  -> Instalador local: $installerExe" -ForegroundColor Gray
Write-Host "  -> Nome do asset remoto: $assetName" -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $token"
    "User-Agent" = "ClickStorm-Publisher"
    "Accept" = "application/vnd.github.v3+json"
}

# 3. Verifica se release já existe
$release = $null
try {
    $existing = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases/tags/$tag" -Headers $headers -Method Get -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  -> Release $tag já existe. Atualizando assets..." -ForegroundColor Yellow
        $release = $existing
    }
} catch {}

if (-not $release) {
    Write-Host "  -> Criando nova Release no GitHub ($tag)..." -ForegroundColor Gray
    $bodyJson = @{
        tag_name = $tag
        target_commitish = "main"
        name = "ClickStorm PDV & ERP $tag"
        body = $ReleaseNotes
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases" -Headers $headers -Method Post -Body $bodyBytes -ContentType "application/json; charset=utf-8"
}

$releaseId = $release.id
Write-Host "  -> Release ID: $releaseId ($($release.html_url))" -ForegroundColor Green

# 4. Remove asset anterior com mesmo nome se existir
if ($release.assets) {
    foreach ($asset in $release.assets) {
        if ($asset.name -eq $assetName -or $asset.name -eq "latest.yml") {
            Write-Host "  -> Removendo asset existente: $($asset.name)..." -ForegroundColor Gray
            Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases/assets/$($asset.id)" -Headers $headers -Method Delete | Out-Null
        }
    }
}

# 5. Upload do binário executável
Write-Host "`n[3/3] Fazendo upload do instalador ($assetName)..." -ForegroundColor Yellow
$uploadUrl = "https://uploads.github.com/repos/$owner/$repo/releases/$releaseId/assets?name=$assetName"
$fileBytes = [System.IO.File]::ReadAllBytes($installerExe)
$fileLength = $fileBytes.Length
Write-Host "  -> Tamanho do arquivo: $([math]::Round($fileLength / 1MB, 2)) MB" -ForegroundColor Gray

$uploadHeaders = @{
    "Authorization" = "Bearer $token"
    "User-Agent" = "ClickStorm-Publisher"
    "Content-Type" = "application/octet-stream"
    "Accept" = "application/vnd.github.v3+json"
}

$uploadResult = Invoke-RestMethod -Uri $uploadUrl -Headers $uploadHeaders -Method Post -Body $fileBytes
Write-Host "  [OK] Upload do instalador concluído com sucesso!" -ForegroundColor Green
Write-Host "  -> Download URL: $($uploadResult.browser_download_url)" -ForegroundColor Cyan

# 6. Upload do manifesto latest.yml para suporte ao autoUpdater do Electron
Write-Host "`n  -> Gerando e enviando manifesto latest.yml..." -ForegroundColor Yellow
$sha512 = [System.Security.Cryptography.SHA512]::Create()
$hashBytes = $sha512.ComputeHash($fileBytes)
$sha512Base64 = [Convert]::ToBase64String($hashBytes)
$nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$latestYmlText = "version: $Version`r`nfiles:`r`n  - url: $assetName`r`n    sha512: $sha512Base64`r`n    size: $fileLength`r`npath: $assetName`r`nsha512: $sha512Base64`r`nreleaseDate: '$nowIso'`r`n"
$ymlBytes = [System.Text.Encoding]::UTF8.GetBytes($latestYmlText)

$ymlUploadUrl = "https://uploads.github.com/repos/$owner/$repo/releases/$releaseId/assets?name=latest.yml"
$ymlHeaders = @{
    "Authorization" = "Bearer $token"
    "User-Agent" = "ClickStorm-Publisher"
    "Content-Type" = "application/x-yaml"
    "Accept" = "application/vnd.github.v3+json"
}
Invoke-RestMethod -Uri $ymlUploadUrl -Headers $ymlHeaders -Method Post -Body $ymlBytes | Out-Null
Write-Host "  [OK] latest.yml publicado com sucesso!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "[SUCESSO] RELEASE PUBLICADA COM AUTO-UPDATE HABILITADO!" -ForegroundColor Green
Write-Host "URL: $($release.html_url)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
