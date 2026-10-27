@echo off
setlocal
cd /d "%~dp0"

set PORT=5000
set NODE_ENV=production

if exist "%~dp0runtime\node.exe" (
    set "NODE_CMD=%~dp0runtime\node.exe"
) else (
    set "NODE_CMD=node"
)

echo [ClickStorm] Iniciando Servidor na porta %PORT%...
"%NODE_CMD%" dist/server.js
endlocal
