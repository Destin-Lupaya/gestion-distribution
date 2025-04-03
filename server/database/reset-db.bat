@echo off
echo [%date% %time%] ========================================
echo [%date% %time%] Demarrage de la reinitialisation de la BD
echo [%date% %time%] ========================================
echo.

echo [%date% %time%] Arret de MySQL...
net stop MySQL 2>nul
if errorlevel 1 (
    echo [%date% %time%] Arret force de MySQL via XAMPP...
    taskkill /F /IM mysqld.exe >nul 2>&1
)

echo [%date% %time%] Attente de l'arret complet...
timeout /t 10 /nobreak >nul

echo [%date% %time%] Verification du chemin MySQL...
if not exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo [%date% %time%] ERREUR: MySQL non trouve dans C:\xampp\mysql\bin
    pause
    exit /b 1
)

echo [%date% %time%] Demarrage de MySQL...
start "MySQL" /B "C:\xampp\mysql\bin\mysqld.exe" --console

echo [%date% %time%] Attente du demarrage...
timeout /t 15 /nobreak >nul

echo [%date% %time%] Test de la connexion MySQL...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 'MySQL est operationnel'" 2>mysql_error.log
if errorlevel 1 (
    echo [%date% %time%] ERREUR: Impossible de se connecter a MySQL
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo [%date% %time%] Execution du script SQL...
echo [%date% %time%] Creation de la base de donnees et des tables...
"C:\xampp\mysql\bin\mysql.exe" -u root < schema.sql 2>mysql_error.log
if errorlevel 1 (
    echo [%date% %time%] ERREUR: Echec de la creation de la base de donnees
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo.
echo [%date% %time%] Installation des dependances pour le seed...
cd ..\..
call npm install --prefix server/database

echo.
echo [%date% %time%] Execution du script de seed...
cd server\database
node seed.js

echo.
echo [%date% %time%] ========================================
echo [%date% %time%] Configuration terminee
echo [%date% %time%] ========================================
echo.
echo Pour verifier la base de donnees, utilisez :
echo - PHPMyAdmin : http://localhost/phpmyadmin
echo - Base de donnees : gestion_distribution
echo.
pause
