' ClickStorm PDV - Launcher Silencioso para Desktop
Option Explicit
Dim WshShell, fso, appDir, http, url, isRunning, i

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Verifica se o backend ja esta respondendo na porta 5000
isRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 500, 500, 500, 500
http.open "GET", "http://localhost:5000/health", False
http.send
If http.status = 200 Then
    isRunning = True
End If
On Error GoTo 0

' 2. Se nao estiver rodando, inicia o start_server.bat silenciosamente (janela 0 = oculta)
If Not isRunning Then
    WshShell.Run Chr(34) & appDir & "\start_server.bat" & Chr(34), 0, False
    ' Aguarda ate 5 segundos ate o servico responder
    For i = 1 To 10
        WScript.Sleep 500
        On Error Resume Next
        Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        http.setTimeouts 500, 500, 500, 500
        http.open "GET", "http://localhost:5000/health", False
        http.send
        If http.status = 200 Then
            Exit For
        End If
        On Error GoTo 0
    Next
End If

' 3. Abre a interface no Edge em modo Aplicação (PWA/Standalone sem barra de navegacao)
' Caso o Edge nao esteja disponivel, abre no navegador padrao
On Error Resume Next
WshShell.Run "msedge.exe --app=http://localhost:5000", 1, False
If Err.Number <> 0 Then
    WshShell.Run "http://localhost:5000", 1, False
End If
