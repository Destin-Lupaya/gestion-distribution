@echo off
echo Verification de XAMPP MySQL...

REM Vérifier si MySQL est en cours d'exécution
netstat -an | find ":3306" > nul
if errorlevel 1 (
    echo MySQL n'est pas en cours d'execution.
    echo Demarrage de MySQL via XAMPP...
    start "" /b "C:\xampp\mysql\bin\mysqld.exe"
    timeout /t 5 /nobreak
)

echo Installation des dependances necessaires...
cd ..\..
call npm install mysql2 dotenv uuid

echo Configuration de la base de donnees...
cd server\database
node setup-database.js

echo.
if errorlevel 1 (
    echo Erreur lors de la configuration de la base de donnees.
    pause
    exit /b 1
) else (
    echo Configuration terminee avec succes !
    echo La base de donnees est prete a etre utilisee.
    pause
)
