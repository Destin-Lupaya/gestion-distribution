@echo off
echo Execution du script SQL...
"C:\xampp\mysql\bin\mysql.exe" -u root < schema.sql
if errorlevel 1 (
    echo Erreur lors de l'execution du script SQL
    pause
    exit /b 1
)

echo Installation des dependances pour le seed...
cd ..\..
call npm install mysql2 dotenv uuid

echo Execution du script de seed...
cd server\database
node seed.js

echo.
echo Configuration terminee !
pause
