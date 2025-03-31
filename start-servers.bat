@echo off
echo Verification et arret des serveurs existants...

REM Verifier et arreter le serveur backend (port 3001)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do (
    echo Arret du processus backend %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Verifier et arreter le serveur frontend (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do (
    echo Arret du processus frontend %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Demarrage des nouveaux serveurs...

REM Demarrer le serveur backend
start "Backend Server" cmd /c "cd server && node index.js"

REM Attendre quelques secondes pour que le backend démarre
timeout /t 5 /nobreak

REM Demarrer le serveur frontend
start "Frontend Server" cmd /c "npm run dev"

echo Les serveurs ont ete demarres avec succes !
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pour arreter les serveurs, fermez simplement les fenetres correspondantes.
pause
