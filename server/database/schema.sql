-- Utilisation de la base de données
USE gestion_distribution;

-- Suppression des tables existantes
DROP TABLE IF EXISTS distribution_items;
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sites;

-- Table des sites
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

-- Table des ménages
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

-- Table des bénéficiaires
CREATE TABLE recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_naissance DATE,
    genre ENUM('M', 'F') NOT NULL,
    type_piece_identite VARCHAR(50),
    numero_piece_identite VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    telephone VARCHAR(50),
    statut ENUM('actif', 'inactif') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

-- Table des articles disponibles
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite_mesure VARCHAR(50) NOT NULL,
    quantite_standard DECIMAL(10,2) DEFAULT 1.00,
    categorie VARCHAR(100),
    status ENUM('disponible', 'rupture', 'discontinue') DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des signatures
CREATE TABLE signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    recipient_id INT NOT NULL,
    signature_data MEDIUMTEXT NOT NULL,
    type_signature ENUM('manuscrite', 'electronique', 'empreinte') DEFAULT 'manuscrite',
    ip_address VARCHAR(45),
    device_info TEXT,
    qr_token VARCHAR(255),
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
    motif_annulation TEXT,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    validated_by VARCHAR(100),
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
    FOREIGN KEY (signature_id) REFERENCES signatures(id) ON DELETE CASCADE
);

-- Table des articles distribués
CREATE TABLE distribution_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    distribution_id INT NOT NULL,
    item_id INT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distribution_id) REFERENCES distributions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Table des imports Excel
CREATE TABLE imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    error_details TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des erreurs d'import
CREATE TABLE import_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id INT NOT NULL,
    row_number INT NOT NULL,
    error_message TEXT NOT NULL,
    raw_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_household_token ON households(token_number);
CREATE INDEX idx_household_site ON households(site_id);
CREATE INDEX idx_recipient_household ON recipients(household_id);
CREATE INDEX idx_distribution_household ON distributions(household_id);
CREATE INDEX idx_distribution_date ON distributions(distribution_date);
CREATE INDEX idx_distribution_status ON distributions(status);
CREATE INDEX idx_import_status ON imports(status);
CREATE INDEX idx_items_status ON items(status);

-- Vues pour les rapports
CREATE VIEW vue_distributions_completes AS
SELECT 
    d.id as distribution_id,
    s.nom as site_nom,
    h.token_number,
    h.household_name,
    CONCAT(r.first_name, ' ', r.last_name) as beneficiaire,
    d.distribution_date,
    GROUP_CONCAT(CONCAT(i.nom, ': ', di.quantite, ' ', i.unite_mesure)) as articles
FROM distributions d
JOIN households h ON d.household_id = h.id
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON d.recipient_id = r.id
JOIN distribution_items di ON d.id = di.distribution_id
JOIN items i ON di.item_id = i.id
WHERE d.status = 'completed'
GROUP BY d.id;

-- Procédure stockée pour la validation des distributions
DELIMITER //
CREATE PROCEDURE valider_distribution(
    IN p_distribution_id INT,
    IN p_validator VARCHAR(100)
)
BEGIN
    UPDATE distributions 
    SET 
        status = 'completed',
        validated_by = p_validator,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_distribution_id;
END //
DELIMITER ;
