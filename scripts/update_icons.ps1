# =====================================================================
# SCRIPT DE ATUALIZAÇÃO DO ÍCONE DO SISTEMA (DESKTOP, JANELA, ATALHOS)
# =====================================================================

$ErrorActionPreference = "Continue"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$erpIco = Join-Path $rootDir "ERP.ico"

if (-not (Test-Path $erpIco)) {
    Write-Error "Arquivo ERP.ico não encontrado em: $erpIco"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[CLICKSTORM] ATUALIZANDO ÍCONE DO SISTEMA COM ERP.ICO" -ForegroundColor Cyan
Write-Host "Fonte: $erpIco" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Copiar ERP.ico para todos os locais do projeto
$destinos = @(
    (Join-Path $rootDir "desktop\icon.ico"),
    (Join-Path $rootDir "frontend\public\favicon.ico"),
    (Join-Path $rootDir "frontend\dist\favicon.ico"),
    (Join-Path $rootDir "installer\staging\icon.ico"),
    (Join-Path $rootDir "installer\staging\resources\app\desktop\icon.ico"),
    (Join-Path $rootDir "installer\staging\resources\app\public\favicon.ico"),
    "C:\Program Files\ClickStorm PDV\icon.ico",
    "C:\Program Files\ClickStorm PDV\resources\app\desktop\icon.ico",
    "C:\Program Files\ClickStorm PDV\resources\app\public\favicon.ico"
)

foreach ($dest in $destinos) {
    try {
        $parent = Split-Path -Parent $dest
        if (Test-Path $parent) {
            Copy-Item -Path $erpIco -Destination $dest -Force -ErrorAction Stop
            Write-Host "  [OK] Copiado para: $dest" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [AVISO] Não foi possível copiar para $dest" -ForegroundColor Yellow
    }
}

# 2. Extrair PNG de alta resolução para favicon e ícone de janela
node -e @"
const fs = require('fs');
const buf = fs.readFileSync('$($erpIco.Replace('\', '/'))');
// Localiza o maior PNG dentro do .ico
const count = buf.readUInt16LE(4);
for (let i = count - 1; i >= 0; i--) {
  const off = 6 + i * 16;
  const imgOff = buf.readUInt32LE(off + 12);
  const size = buf.readUInt32LE(off + 8);
  const slice = buf.subarray(imgOff, imgOff + size);
  if (slice[0] === 0x89 && slice[1] === 0x50) {
    fs.writeFileSync('desktop/icon.png', slice);
    fs.writeFileSync('frontend/public/favicon.png', slice);
    if (fs.existsSync('frontend/dist')) {
      fs.writeFileSync('frontend/dist/favicon.png', slice);
    }
    const b64 = slice.toString('base64');
    const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"256\" height=\"256\"><image href=\"data:image/png;base64,' + b64 + '\" width=\"256\" height=\"256\"/></svg>';
    fs.writeFileSync('frontend/public/favicon.svg', svg);
    if (fs.existsSync('frontend/dist')) {
      fs.writeFileSync('frontend/dist/favicon.svg', svg);
    }
    console.log('  [OK] PNG e SVG de favicon atualizados com base no ERP.ico');
    break;
  }
}
"@

# 3. Atualizar atalhos da Área de Trabalho e Menu Iniciar
$wsh = New-Object -ComObject WScript.Shell

$atalhos = @(
    "C:\Users\Public\Desktop\Clickstorm ERP Local.lnk",
    "C:\Users\Public\Desktop\ClickStorm PDV.lnk",
    "C:\Users\$env:USERNAME\Desktop\Clickstorm ERP Local.lnk",
    "C:\Users\$env:USERNAME\Desktop\ClickStorm PDV.lnk",
    "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\ClickStorm PDV\Clickstorm ERP Local.lnk",
    "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\ClickStorm PDV\ClickStorm PDV.lnk"
)

foreach ($lnkPath in $atalhos) {
    if (Test-Path $lnkPath) {
        try {
            $shortcut = $wsh.CreateShortcut($lnkPath)
            $shortcut.IconLocation = "$erpIco,0"
            $shortcut.Save()
            Write-Host "  [OK] Atalho atualizado: $lnkPath" -ForegroundColor Green
        } catch {
            Write-Host "  [AVISO] Falha ao atualizar atalho $lnkPath" -ForegroundColor Yellow
        }
    }
}

# Criar atalho específico na Área de Trabalho do usuário se não existir
$userDesktopLnk = "C:\Users\$env:USERNAME\Desktop\Clickstorm ERP Local.lnk"
if (-not (Test-Path $userDesktopLnk)) {
    try {
        $targetExe = "C:\Program Files\ClickStorm PDV\ClickStorm.exe"
        if (-not (Test-Path $targetExe)) {
            $targetExe = Join-Path $rootDir "node_modules\electron\dist\electron.exe"
        }
        $sc = $wsh.CreateShortcut($userDesktopLnk)
        $sc.TargetPath = $targetExe
        $sc.WorkingDirectory = Split-Path -Parent $targetExe
        $sc.IconLocation = "$erpIco,0"
        $sc.Description = "Clickstorm ERP Local - Frente de Caixa e Retaguarda"
        $sc.Save()
        Write-Host "  [OK] Atalho criado na área de trabalho do usuário: $userDesktopLnk" -ForegroundColor Green
    } catch {
        Write-Host "  [AVISO] Falha ao criar atalho no desktop do usuário" -ForegroundColor Yellow
    }
}

# 4. Patching de binários via rcedit
try {
    node (Join-Path $rootDir "scripts\patch_exe_metadata.cjs") (Join-Path $rootDir "node_modules\electron\dist\electron.exe")
} catch {}

# 5. Atualizar cache de ícones do Windows
Write-Host "`nAtualizando cache de ícones do Windows..." -ForegroundColor Yellow
try {
    if (Get-Command ie4uinit.exe -ErrorAction SilentlyContinue) {
        & ie4uinit.exe -show
    }
} catch {}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "ÍCONES ATUALIZADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
