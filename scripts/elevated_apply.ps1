# Script to apply updated files to C:\Program Files\ClickStorm PDV with Administrator elevation
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$staging = Join-Path $rootDir "installer\staging"
$destDir = "C:\Program Files\ClickStorm PDV"
$erpIco = Join-Path $rootDir "ERP.ico"

# 1. Kill any stray processes
taskkill /F /IM ClickStorm.exe 2>$null
taskkill /F /IM node.exe 2>$null
Start-Sleep -Milliseconds 800

# 2. Copy ClickStorm.exe from staging
Copy-Item -Path (Join-Path $staging "ClickStorm.exe") -Destination (Join-Path $destDir "ClickStorm.exe") -Force

# 3. Copy icon.ico
Copy-Item -Path $erpIco -Destination (Join-Path $destDir "icon.ico") -Force

# 4. Copy desktop resources
$destApp = Join-Path $destDir "resources\app"
if (Test-Path $destApp) {
    Copy-Item -Path (Join-Path $rootDir "desktop\*") -Destination (Join-Path $destApp "desktop") -Recurse -Force
    Copy-Item -Path (Join-Path $rootDir "backend\dist\*") -Destination (Join-Path $destApp "dist") -Recurse -Force
    Copy-Item -Path (Join-Path $rootDir "frontend\dist\*") -Destination (Join-Path $destApp "public") -Recurse -Force
    Copy-Item -Path $erpIco -Destination (Join-Path $destApp "desktop\icon.ico") -Force
    Copy-Item -Path $erpIco -Destination (Join-Path $destApp "public\favicon.ico") -Force
}

# 5. Update Public Desktop Shortcut
$wsh = New-Object -ComObject WScript.Shell
$pubLnk = "C:\Users\Public\Desktop\Clickstorm ERP Local.lnk"
if (Test-Path $pubLnk) {
    $sc = $wsh.CreateShortcut($pubLnk)
    $sc.TargetPath = Join-Path $destDir "ClickStorm.exe"
    $sc.WorkingDirectory = $destDir
    $sc.IconLocation = "$destDir\icon.ico,0"
    $sc.Save()
}

# Delete obsolete ClickStorm PDV.lnk if present
$oldLnk = "C:\Users\Public\Desktop\ClickStorm PDV.lnk"
if (Test-Path $oldLnk) {
    Remove-Item -Path $oldLnk -Force -ErrorAction SilentlyContinue
}

# 6. Refresh icon cache
try { & ie4uinit.exe -show } catch {}

Write-Host "APPLIED_SUCCESSFULLY"
