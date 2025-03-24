@echo off
title Demarrage des serveurs Gestion Distribution

echo Installing backend dependencies...
cd server
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b %errorlevel%
)

echo Starting Backend Server...
start "Backend Server" cmd /k "node index.js"

cd ..

echo Installing frontend dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b %errorlevel%
)

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo Les serveurs ont ete demarres dans des fenetres separees.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pour arreter les serveurs, fermez simplement les fenetres correspondantes.
pause
