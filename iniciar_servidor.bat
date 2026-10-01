@echo off
title Hospital Olvidado - Servidor Local
cd /d "%~dp0"
echo ========================================================
echo   Iniciando Hospital Olvidado - Juego Portafolio 3D
echo ========================================================
echo.
echo Buscando puerto disponible y abriendo tu navegador...
echo (Presiona Ctrl+C en esta ventana cuando quieras detener el servidor)
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
