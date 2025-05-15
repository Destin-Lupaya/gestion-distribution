@echo off
setlocal enabledelayedexpansion

echo Verification et arret des serveurs existants...

:: Arreter le serveur frontend s'il est en cours d'execution
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Arret du processus frontend %%a
    taskkill /F /PID %%a 2>nul
)

:: Arreter le serveur backend s'il est en cours d'execution
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Arret du processus backend %%a
    taskkill /F /PID %%a 2>nul
)

echo Verification de MySQL...
sc query MySQL >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo MySQL n'est pas en cours d'execution. Demarrage de MySQL...
    net start MySQL >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Impossible de demarrer MySQL. Assurez-vous que MySQL est installe correctement.
        exit /b 1
    )
)

echo Demarrage des nouveaux serveurs...

:: Creer la base de donnees si elle n'existe pas
mysql -u root -e "CREATE DATABASE IF NOT EXISTS gestion_distribution;" >nul 2>&1

:: Demarrer le serveur backend dans une nouvelle fenetre
start "Backend Server" cmd /c "cd /d %~dp0 && node server-combined.js"

:: Attendre 2 secondes pour que le backend démarre
timeout /t 2 /nobreak >nul

:: Demarrer le serveur frontend dans une nouvelle fenetre
start "Frontend Server" cmd /c "cd /d %~dp0 && npm run dev"

echo Les serveurs ont ete demarres avec succes !
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pour tester le backend, visitez : http://localhost:3001/api/health
echo Pour utiliser l'application, visitez : http://localhost:5173
echo.
echo Pour arreter les serveurs, fermez simplement les fenetres correspondantes.
pause