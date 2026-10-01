@echo off
title Hospital Olvidado - Servidor Local
cd /d "%~dp0"
echo ========================================================
echo   Iniciando Hospital Olvidado - Juego Portafolio 3D
echo ========================================================
echo.
echo Buscando motor de ejecucion disponible...

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js detectado. Iniciando servidor streaming de alta velocidad...
    node server.js
) else (
    echo [INFO] Iniciando servidor local en PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)

pause
