-- Script pour mettre à jour la structure de la table households
USE gestion_distribution;

-- Sauvegarde des données existantes
CREATE TABLE IF NOT EXISTS households_backup AS SELECT * FROM households;

-- Suppression des contraintes de clé étrangère
ALTER TABLE recipients DROP FOREIGN KEY recipients_ibfk_1;
ALTER TABLE distributions DROP FOREIGN KEY distributions_ibfk_1;

-- Suppression de la table existante
DROP TABLE IF EXISTS households;

-- Création de la nouvelle structure
CREATE TABLE households (
    id VARCHAR(36) PRIMARY KEY,
    site_id INT NOT NULL,
    household_id VARCHAR(255) NOT NULL,
    household_name VARCHAR(255) NOT NULL,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_count INT NOT NULL DEFAULT 1,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    site_address TEXT,
    alternate_recipient VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Restauration des données (avec adaptation des colonnes)
INSERT INTO households (
    id, 
    site_id, 
    household_id, 
    household_name, 
    token_number, 
    beneficiary_count, 
    first_name, 
    last_name, 
    site_address,
    created_at,
    updated_at
)
SELECT 
    id, 
    site_id, 
    id AS household_id, 
    nom_menage AS household_name, 
    token_number, 
    nombre_beneficiaires AS beneficiary_count, 
    'Imported' AS first_name, 
    'Data' AS last_name, 
    adresse AS site_address,
    created_at,
    updated_at
FROM households_backup;

-- Restauration des contraintes de clé étrangère
ALTER TABLE recipients ADD CONSTRAINT recipients_ibfk_1 FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE distributions ADD CONSTRAINT distributions_ibfk_1 FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

-- Message de confirmation
SELECT 'La table households a été mise à jour avec succès.' AS message;
