@echo off
title Hospital Olvidado - Servidor Local
cd /d "%~dp0"
cls
echo ========================================================
echo   HOSPITAL OLVIDADO - Servidor Local (Actualizado)
echo ========================================================
echo.
echo [1/3] Liberando instancias o puertos anteriores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul

echo [2/3] Verificando motor de ejecucion...
if exist "C:\Program Files\nodejs\node.exe" (
    echo [OK] Node.js detectado en C:\Program Files\nodejs\
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
) else (
    where node >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "NODE_CMD=node"
    ) else (
        set "NODE_CMD="
    )
)

echo [3/3] Iniciando servidor de alta velocidad y abriendo juego...
echo.

if defined NODE_CMD (
    "%NODE_CMD%" server.js
) else (
    echo [INFO] Usando servidor PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)

pause
