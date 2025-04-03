-- Script pour mettre à jour la structure de la table households
USE gestion_distribution;

-- Ajouter les nouvelles colonnes à la table households
ALTER TABLE households 
ADD COLUMN household_id VARCHAR(255) AFTER id,
ADD COLUMN household_name VARCHAR(255) AFTER household_id,
ADD COLUMN beneficiary_count INT AFTER token_number,
ADD COLUMN first_name VARCHAR(100) AFTER beneficiary_count,
ADD COLUMN middle_name VARCHAR(100) AFTER first_name,
ADD COLUMN last_name VARCHAR(100) AFTER middle_name,
ADD COLUMN site_address TEXT AFTER last_name,
ADD COLUMN alternate_recipient VARCHAR(255) AFTER site_address;

-- Mettre à jour les colonnes avec les valeurs existantes
UPDATE households SET 
household_id = id,
household_name = nom_menage,
beneficiary_count = nombre_beneficiaires,
first_name = 'Imported',
last_name = 'Data',
site_address = adresse;

-- Message de confirmation
SELECT 'La table households a été mise à jour avec succès.' AS message;
