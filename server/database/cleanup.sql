-- Désactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer la base de données si elle existe
DROP DATABASE IF EXISTS gestion_distribution;

-- Recréer la base de données avec le bon encodage
CREATE DATABASE gestion_distribution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestion_distribution;

-- Désactiver temporairement l'historique des binlogs pour les opérations de nettoyage
SET sql_log_bin = 0;

-- Forcer le nettoyage des tablespaces InnoDB
SET GLOBAL innodb_file_per_table = 1;

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS distribution_items;
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sites;

-- Réactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
