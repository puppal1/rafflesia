@echo off
REM created: 2026-11-23T12:03:00-08:00
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0toggle-server.ps1"
