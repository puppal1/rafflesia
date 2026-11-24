# created: 2026-11-23T12:03:00-08:00
# updated: 2026-11-23T12:09:00-08:00
# Rafflesia Online — start/stop + LAN alias "webname"

$ErrorActionPreference = 'Continue'
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $appDir
$AliasName = 'webname'

function Get-ListenersOn5173 {
  # created: 2026-11-23T12:03:00-08:00
  Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
}

function Get-PhoneIp {
  # created: 2026-11-23T12:03:00-08:00
  # prefer Wi-Fi IPv4
  $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' -and $_.IPAddress -notlike '169.254.*' }
  if ($wifi) { return $wifi[0].IPAddress }

  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object InterfaceMetric
  if ($candidates) { return $candidates[0].IPAddress }
  return $null
}

function Set-WebnameHostsAlias {
  # created: 2026-11-23T12:09:00-08:00
  param([string]$Ip, [string]$Name)
  $hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
  try {
    $lines = Get-Content $hostsPath -ErrorAction Stop
    $filtered = $lines | Where-Object { $_ -notmatch "(?i)\s$([regex]::Escape($Name))\s*$" -and $_ -notmatch "(?i)\s$([regex]::Escape($Name))\s" }
    $filtered += "$Ip`t$Name`t# rafflesia-online alias"
    $filtered | Set-Content -Path $hostsPath -Encoding ascii -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

Write-Host ''
Write-Host '=== Rafflesia Online Server ===' -ForegroundColor Cyan
Write-Host ("Folder: {0}" -f $appDir)
Write-Host ("Alias:  {0}" -f $AliasName)

$listeners = Get-ListenersOn5173
if ($listeners) {
  $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  Write-Host 'Status: RUNNING — stopping now...' -ForegroundColor Yellow
  foreach ($procId in $pids) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host ("Stopped process {0}" -f $procId)
    } catch {
      Write-Host ("Could not stop process {0}: {1}" -f $procId, $_.Exception.Message) -ForegroundColor Red
    }
  }
  Start-Sleep -Seconds 1
  if (Get-ListenersOn5173) {
    Write-Host 'Still running. Close the other PowerShell window that has npm/vite.' -ForegroundColor Red
  } else {
    Write-Host 'Server STOPPED.' -ForegroundColor Green
  }
  Write-Host ''
  Write-Host 'Press any key to close...'
  $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
  exit 0
}

$ip = Get-PhoneIp
Write-Host 'Status: STOPPED — starting for phone...' -ForegroundColor Yellow
Write-Host 'CORS + LAN host + webname alias: ON' -ForegroundColor DarkCyan

try {
  $rule = Get-NetFirewallRule -DisplayName 'Rafflesia Online Dev 5173' -ErrorAction SilentlyContinue
  if (-not $rule) {
    New-NetFirewallRule -DisplayName 'Rafflesia Online Dev 5173' -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private -ErrorAction Stop | Out-Null
    Write-Host 'Firewall: allowed port 5173 on Private networks' -ForegroundColor Green
  } else {
    Write-Host 'Firewall: rule already present' -ForegroundColor DarkGray
  }
} catch {
  Write-Host 'Firewall: could not add rule (OK if Windows already allows Node).' -ForegroundColor Yellow
}

$hostsOk = $false
if ($ip) {
  $hostsOk = Set-WebnameHostsAlias -Ip $ip -Name $AliasName
  if ($hostsOk) {
    Write-Host ("PC hosts alias set: {0} -> {1}" -f $AliasName, $ip) -ForegroundColor Green
  } else {
    Write-Host 'PC hosts alias needs Admin once (optional).' -ForegroundColor Yellow
    Write-Host 'Right-click Rafflesia Server.bat -> Run as administrator' -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host 'Open on this PC:' -ForegroundColor Green
Write-Host '  http://localhost:5173/'
if ($hostsOk) {
  Write-Host ("  http://{0}:5173/" -f $AliasName)
}
if ($ip) {
  $phoneAlias = "http://{0}.{1}.sslip.io:5173/" -f $AliasName, $ip
  Write-Host ''
  Write-Host 'Open on your PHONE (same Wi-Fi):' -ForegroundColor Green
  Write-Host ("  {0}" -f $phoneAlias)
  Write-Host ("  backup IP: http://{0}:5173/" -f $ip)
  Write-Host '(sslip.io is only a name helper; traffic stays on your Wi-Fi)' -ForegroundColor DarkGray

  @"
# created: 2026-11-23T12:09:00-08:00
alias=$AliasName
ip=$ip
pc=http://localhost:5173/
pc_alias=http://$AliasName:5173/
phone=$phoneAlias
backup=http://$ip:5173/
"@ | Set-Content -Path (Join-Path $appDir 'network-check.log') -Encoding utf8
} else {
  Write-Host 'Could not find Wi-Fi IP.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Leave this window OPEN while you test. Run this script again to STOP.' -ForegroundColor Cyan
Write-Host ''

npm run dev
