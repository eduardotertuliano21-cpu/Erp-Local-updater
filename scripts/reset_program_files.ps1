$srcDir = "C:\Users\eduar\Desktop\Erp local\data"
$destDir = "C:\Program Files\ClickStorm PDV\resources\app\data"

Write-Host "Resetando bases em $destDir..." -ForegroundColor Cyan

$obsoletos = @(
  "catalogo_sync.db", "catalogo_sync.db-shm", "catalogo_sync.db-wal",
  "local_operacao.db", "local_operacao.db-shm", "local_operacao.db-wal",
  "db_mercado.sqlite-shm", "db_mercado.sqlite-wal",
  "db_roupas.sqlite-shm", "db_roupas.sqlite-wal"
)

foreach ($item in $obsoletos) {
  $target = Join-Path $destDir $item
  if (Test-Path $target) {
    try {
      Remove-Item -Path $target -Force -ErrorAction Stop
      Write-Host "Removido obsoleto: $item" -ForegroundColor Green
    } catch {
      Write-Host "Nao foi possivel remover $item`: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

Get-ChildItem -Path $srcDir -Filter "*.sqlite" | ForEach-Object {
  $destFile = Join-Path $destDir $_.Name
  Copy-Item -Path $_.FullName -Destination $destFile -Force
  Write-Host "Copiado banco limpo: $($_.Name)" -ForegroundColor Green
}

Write-Host "Reset de Program Files finalizado com sucesso!" -ForegroundColor Cyan
