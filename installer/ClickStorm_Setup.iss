; =====================================================================
; CLICKSTORM SYSTEM - SCRIPT DE INSTALAÇÃO INNO SETUP
; PDV SaaS Local-First & Automação Comercial Desktop
; =====================================================================

#define MyAppName "Clickstorm ERP Local"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Clickstorm Technologies"
#define MyAppURL "https://clickstorm.com.br"
#define MyAppExeName "ClickStorm.exe"

[Setup]
AppId={{9B7F1D2C-8A63-4E90-B8E5-7A1E2F3D4C5B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\ClickStorm PDV
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=ClickStorm_Setup_v{#MyAppVersion}
SetupIconFile=staging\icon.ico
Compression=lzma2/fast
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
CloseApplications=force
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""ClickStorm PDV (TCP 5000)"" dir=in action=allow protocol=TCP localport=5000 profile=any"; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""ClickStorm mDNS (UDP 5353)"" dir=in action=allow protocol=UDP localport=5353 profile=any"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Flags: nowait

[UninstallRun]
Filename: "taskkill"; Parameters: "/F /IM ClickStorm.exe"; Flags: runhidden
Filename: "taskkill"; Parameters: "/F /IM node.exe"; Flags: runhidden
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""ClickStorm PDV (TCP 5000)"""; Flags: runhidden
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""ClickStorm mDNS (UDP 5353)"""; Flags: runhidden

[Code]
function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM ClickStorm.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Exec('taskkill.exe', '/F /IM node.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Sleep(1500);
  Result := True;
end;
