@echo off
title GitHub Push - JUEGOPOTAFOLIO
cd /d "%~dp0"
echo ========================================================
echo   Subiendo cambios a GitHub: JUEGOPOTAFOLIO
echo ========================================================
echo.
"C:\Program Files\Git\cmd\git.exe" push origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   [EXITO] Cambios subidos correctamente a JUEGOPOTAFOLIO!
    echo   Repo: https://github.com/alejandracollantes09/JUEGOPOTAFOLIO
    echo ========================================================
) else (
    echo [ERROR] No se pudo completar el push.
    echo Asegurate de tener permisos de colaboradora en el repositorio
    echo y autoriza la ventana de Git Credential Manager si aparece.
)
echo.
pause
