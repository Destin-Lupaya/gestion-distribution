@echo off
echo Configuration de la base de donnees...

REM Verifier si MySQL est en cours d'execution via XAMPP
netstat -an | find ":3306" > nul
if errorlevel 1 (
    echo MySQL n'est pas en cours d'execution.
    echo Demarrage de MySQL...
    start "" /b "C:\xampp\mysql\bin\mysqld.exe"
    timeout /t 5 /nobreak
)

REM Installation des dependances necessaires
echo Installation des dependances...
cd ..\..
call npm install mysql2 dotenv uuid

REM Execution du script SQL pour creer la base de donnees
echo Creation de la base de donnees...
"C:\xampp\mysql\bin\mysql.exe" -u root < "server\database\schema.sql"
if errorlevel 1 (
    echo Erreur lors de la creation de la base de donnees.
    pause
    exit /b 1
)

REM Execution du script de seed pour les donnees de test
echo Ajout des donnees de test...
cd server\database
node seed.js
if errorlevel 1 (
    echo Erreur lors de l'ajout des donnees de test.
    pause
    exit /b 1
)

echo.
echo Base de donnees configuree avec succes !
echo La base de donnees 'gestion_distribution' est prete a etre utilisee.
pause
