-- Suppression de la base de données si elle existe
DROP DATABASE IF EXISTS gestion_distribution;

-- Création de la nouvelle base de données
CREATE DATABASE gestion_distribution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE gestion_distribution;

-- Table des sites
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des ménages
CREATE TABLE households (
    id VARCHAR(36) PRIMARY KEY,
    site_id INT NOT NULL,
    nom_menage VARCHAR(255) NOT NULL,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    nombre_beneficiaires INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Table des bénéficiaires
CREATE TABLE recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

-- Table des signatures
CREATE TABLE signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    recipient_id INT NOT NULL,
    signature_data MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- Table des distributions
CREATE TABLE distributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    recipient_id INT NOT NULL,
    signature_id INT NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
    FOREIGN KEY (signature_id) REFERENCES signatures(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_household_token ON households(token_number);
CREATE INDEX idx_household_site ON households(site_id);
CREATE INDEX idx_recipient_household ON recipients(household_id);
CREATE INDEX idx_distribution_household ON distributions(household_id);
CREATE INDEX idx_distribution_date ON distributions(distribution_date);
