@echo off
echo Verification des fichiers SQL...

set MISSING_FILES=0
if not exist schema.sql (
    echo ERREUR: schema.sql manquant
    set MISSING_FILES=1
)
if not exist schema_updates.sql (
    echo ERREUR: schema_updates.sql manquant
    set MISSING_FILES=1
)
if not exist qr_signature.sql (
    echo ERREUR: qr_signature.sql manquant
    set MISSING_FILES=1
)
if not exist test_data.sql (
    echo ERREUR: test_data.sql manquant
    set MISSING_FILES=1
)
if not exist useful_queries.sql (
    echo ERREUR: useful_queries.sql manquant
    set MISSING_FILES=1
)
if not exist cleanup.sql (
    echo ERREUR: cleanup.sql manquant
    set MISSING_FILES=1
)

if %MISSING_FILES%==1 (
    echo Un ou plusieurs fichiers SQL sont manquants.
    pause
    exit /b 1
)

echo Verification de la connexion MySQL...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERREUR: MySQL n'est pas en cours d'execution. Demarrez MySQL dans XAMPP Control Panel.
    pause
    exit /b 1
)

echo Nettoyage et recreation de la base de donnees...
"C:\xampp\mysql\bin\mysql.exe" -u root < cleanup.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec du nettoyage de la base de donnees
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo Execution du schema de base...
"C:\xampp\mysql\bin\mysql.exe" -u root gestion_distribution < schema.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec de la creation du schema
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo Execution des mises a jour du schema...
"C:\xampp\mysql\bin\mysql.exe" -u root gestion_distribution < schema_updates.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec des mises a jour du schema
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo Ajout des fonctions QR...
"C:\xampp\mysql\bin\mysql.exe" -u root gestion_distribution < qr_signature.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec de l'ajout des fonctions QR
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo Insertion des donnees de test...
"C:\xampp\mysql\bin\mysql.exe" -u root gestion_distribution < test_data.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec de l'insertion des donnees de test
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo Ajout des requetes utiles...
"C:\xampp\mysql\bin\mysql.exe" -u root gestion_distribution < useful_queries.sql 2>mysql_error.log
if errorlevel 1 (
    echo ERREUR: Echec de l'ajout des requetes utiles
    type mysql_error.log
    del mysql_error.log
    pause
    exit /b 1
)

echo.
echo Configuration terminee avec succes !
echo Verifiez la base de donnees dans phpMyAdmin : http://localhost/phpmyadmin
echo Base de donnees : gestion_distribution
echo.
echo Pour verifier la structure :
echo 1. Ouvrez phpMyAdmin
echo 2. Selectionnez la base "gestion_distribution"
echo 3. Cliquez sur "Structure" pour voir les tables
echo.
pause
