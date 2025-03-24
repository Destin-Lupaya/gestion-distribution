-- Désactiver les contraintes de clé étrangère
SET FOREIGN_KEY_CHECKS=0;

-- Recréer la base de données
DROP DATABASE IF EXISTS gestion_distribution;
CREATE DATABASE gestion_distribution;
USE gestion_distribution;

-- Créer la table sites
CREATE TABLE sites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créer la table households
CREATE TABLE households (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  household_id VARCHAR(255) NOT NULL,
  token_number VARCHAR(50) NOT NULL,
  beneficiary_count INT NOT NULL DEFAULT 0,
  first_name VARCHAR(255) NOT NULL DEFAULT '',
  middle_name VARCHAR(255) NOT NULL DEFAULT '',
  last_name VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créer la table recipients
CREATE TABLE recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  household_id INT,
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créer la table distributions
CREATE TABLE distributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  household_id INT,
  distribution_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  signature TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajouter les index uniques
ALTER TABLE households 
ADD UNIQUE INDEX unique_token (token_number),
ADD UNIQUE INDEX unique_household (site_name, household_id);

-- Réactiver les contraintes de clé étrangère
SET FOREIGN_KEY_CHECKS=1;
