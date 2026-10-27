' ClickStorm PDV - Inicializador Silencioso de Serviço em Segundo Plano
Option Explicit
Dim WshShell, fso, appDir

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Executa start_server.bat com janela oculta (0)
WshShell.Run Chr(34) & appDir & "\start_server.bat" & Chr(34), 0, False
