@echo off
title GitHub Push - Portfolio-2
cd /d "%~dp0"
cls
echo ========================================================
echo   Subiendo cambios a tu repositorio: Portfolio-2
echo   Destino: https://github.com/josefinavaldesbal/Portfolio-2
echo ========================================================
echo.

git push origin main
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [EXITO] Cambios subidos correctamente a tu repositorio!
    echo   https://github.com/josefinavaldesbal/Portfolio-2
    echo ========================================================
    echo.
    goto sync_alejandra
)

echo [ERROR] No se pudo subir a tu repositorio principal.
pause
exit /b 1

:sync_alejandra
echo Deseas sincronizar tambien al repositorio de Alejandra Collantes? (S/N)
set /p sync="Opcion: "
if /i "%sync%"=="S" (
    echo.
    echo Intentando push a alejandracollantes09/JUEGOPOTAFOLIO...
    git push alejandra main
    if %ERRORLEVEL% equ 0 (
        echo [OK] Sincronizado tambien con el repositorio de Alejandra!
    ) else (
        echo [INFO] Recuerda que Alejandra debe agregarte como colaboradora en su GitHub
        echo para permitir el acceso directo de subida.
    )
)

echo.
pause
