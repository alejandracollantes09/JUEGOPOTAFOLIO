@echo off
title GitHub Push - JUEGOPOTAFOLIO
cd /d "%~dp0"
cls
echo ========================================================
echo   Subiendo cambios al repositorio: JUEGOPOTAFOLIO
echo   Destino: https://github.com/alejandracollantes09/JUEGOPOTAFOLIO
echo ========================================================
echo.

git push origin main
if %ERRORLEVEL% equ 0 goto exito

echo.
echo ========================================================
echo   [AVISO DE PERMISOS DE GITHUB]
echo ========================================================
echo   Tu equipo esta conectado actualmente como: josefinavaldesbal
echo   El repositorio pertenece a: alejandracollantes09
echo.
echo   Para subir los cambios, elige una opcion:
echo.
echo   [1] Ya agregue a josefinavaldesbal como colaboradora en GitHub (Reintentar)
echo   [2] Quiero iniciar sesion como alejandracollantes09 (Abrir login de GitHub)
echo   [3] Quiero usar un Token de Acceso Personal (GitHub Personal Access Token)
echo   [4] Subir a la copia de respaldo (https://github.com/josefinavaldesbal/Portfolio-2)
echo   [5] Salir
echo.
set /p opt="Elige una opcion (1-5): "

if "%opt%"=="1" (
    echo.
    echo Reintentando push a origin main...
    git push origin main
    if %ERRORLEVEL% equ 0 goto exito
    goto fallo
)

if "%opt%"=="2" (
    echo.
    echo Eliminando credenciales guardadas de GitHub para solicitar nuevo inicio de sesion...
    cmdkey /delete:LegacyGeneric:target=git:https://github.com 2>nul
    echo.
    echo Se abrira una ventana en tu navegador para iniciar sesion como alejandracollantes09...
    git push origin main
    if %ERRORLEVEL% equ 0 goto exito
    goto fallo
)

if "%opt%"=="3" (
    echo.
    echo Ingresa tu Token de GitHub (ghp_...):
    set /p token="Token: "
    if defined token (
        git remote set-url origin https://%token%@github.com/alejandracollantes09/JUEGOPOTAFOLIO.git
        git push origin main
        if %ERRORLEVEL% equ 0 goto exito
    )
    goto fallo
)

if "%opt%"=="4" (
    echo.
    echo Subiendo a la rama hospital-update de josefinavaldesbal...
    git push josefina main:hospital-update --force
    if %ERRORLEVEL% equ 0 (
        echo [OK] Cambios subidos correctamente al repositorio de respaldo.
        goto fin
    )
    goto fallo
)

goto fin

:exito
echo.
echo ========================================================
echo   [EXITO] Cambios subidos correctamente a JUEGOPOTAFOLIO!
echo   https://github.com/alejandracollantes09/JUEGOPOTAFOLIO
echo ========================================================
goto fin

:fallo
echo.
echo [ERROR] No se pudo completar la subida. Verifica los permisos o el token.
goto fin

:fin
echo.
pause
