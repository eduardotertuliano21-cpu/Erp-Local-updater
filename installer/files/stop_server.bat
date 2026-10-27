@echo off
echo Encerrando servico ClickStorm PDV...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a 2>nul
)
echo ClickStorm encerrado com sucesso.
