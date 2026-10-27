$w = New-Object -ComObject WScript.Shell
$desktops = @([Environment]::GetFolderPath('Desktop'), 'C:\Users\Public\Desktop')
foreach ($d in $desktops) {
    if (Test-Path $d) {
        Get-ChildItem -Path $d -Filter "*.lnk" | ForEach-Object {
            $s = $w.CreateShortcut($_.FullName)
            if ($_.Name -like "*Click*") {
                Write-Host "File: $($_.FullName)"
                Write-Host "Target: $($s.TargetPath)"
                Write-Host "IconLocation: $($s.IconLocation)"
                Write-Host "--------------------------------"
            }
        }
    }
}
