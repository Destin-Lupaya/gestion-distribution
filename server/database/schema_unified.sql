-- Schéma unifié pour la base de données gestion_distribution
-- Combinaison des schémas de server/database/schema.sql et src/db/schema.sql

-- Utilisation de la base de données
CREATE DATABASE IF NOT EXISTS gestion_distribution;
USE gestion_distribution;

-- Suppression des tables existantes
DROP TABLE IF EXISTS distribution_items;
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS beneficiaires;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS menages;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS sites_distribution;

-- Table des sites (fusion de sites et sites_distribution)
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    responsable VARCHAR(255),
    telephone VARCHAR(50),
    email VARCHAR(255),
    status ENUM('actif', 'inactif') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des ménages (fusion de households et menages)
CREATE TABLE households (
    id VARCHAR(36) PRIMARY KEY,
    site_id INT NOT NULL,
    household_id VARCHAR(255) UNIQUE NOT NULL,
    household_name VARCHAR(255) NOT NULL,
    nom_menage VARCHAR(255) NOT NULL,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_count INT NOT NULL DEFAULT 1,
    nombre_beneficiaires INT NOT NULL DEFAULT 1,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    site_address TEXT,
    alternate_recipient VARCHAR(255),
    adresse TEXT,
    telephone VARCHAR(50),
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Table des bénéficiaires (fusion de recipients et beneficiaires)
CREATE TABLE recipients (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    est_principal BOOLEAN NOT NULL DEFAULT FALSE,
    date_naissance DATE,
    genre ENUM('M', 'F') NOT NULL,
    type_piece_identite VARCHAR(50),
    numero_piece_identite VARCHAR(50),
    telephone VARCHAR(50),
    email VARCHAR(100),
    adresse TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

-- Table des signatures
CREATE TABLE signatures (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(36) NOT NULL,
    signature_data TEXT NOT NULL,
    date_signature TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- Table des articles
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100),
    unite_mesure VARCHAR(50) NOT NULL,
    quantite_standard DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    status ENUM('actif', 'inactif') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des distributions
CREATE TABLE distributions (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    site_id INT NOT NULL,
    date_distribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature TEXT NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    notes TEXT,
    statut ENUM('planifiee', 'en_cours', 'completee', 'annulee') DEFAULT 'completee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- Table des articles distribués
CREATE TABLE distribution_items (
    id VARCHAR(36) PRIMARY KEY,
    distribution_id VARCHAR(36) NOT NULL,
    item_id INT NOT NULL,
    quantite DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (distribution_id) REFERENCES distributions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Création des index
CREATE INDEX idx_households_token_number ON households(token_number);
CREATE INDEX idx_households_household_id ON households(household_id);
CREATE INDEX idx_recipients_household_id ON recipients(household_id);
CREATE INDEX idx_distributions_household_id ON distributions(household_id);
CREATE INDEX idx_distributions_date ON distributions(date_distribution);
CREATE INDEX idx_distribution_items_distribution_id ON distribution_items(distribution_id);
CREATE INDEX idx_distribution_items_item_id ON distribution_items(item_id);

-- Vues pour les rapports
CREATE OR REPLACE VIEW view_distribution_summary AS
SELECT 
    d.id as distribution_id,
    d.date_distribution,
    s.nom as site_nom,
    h.token_number,
    h.household_name,
    CONCAT(r.first_name, ' ', r.last_name) as beneficiaire,
    COUNT(di.id) as nombre_articles,
    GROUP_CONCAT(CONCAT(i.nom, ': ', di.quantite, ' ', i.unite_mesure) SEPARATOR ', ') as articles_distribues
FROM distributions d
JOIN sites s ON d.site_id = s.id
JOIN households h ON d.household_id = h.id
JOIN recipients r ON d.recipient_id = r.id
LEFT JOIN distribution_items di ON d.id = di.distribution_id
LEFT JOIN items i ON di.item_id = i.id
GROUP BY d.id, d.date_distribution, s.nom, h.token_number, h.household_name, beneficiaire
ORDER BY d.date_distribution DESC;
