-- Schéma pour les tables de nutrition
USE gestion_distribution;

-- Table des bénéficiaires nutrition
CREATE TABLE IF NOT EXISTS nutrition_beneficiaires (
    id VARCHAR(36) PRIMARY KEY,
    numero_enregistrement VARCHAR(50) UNIQUE NOT NULL,
    nom_enfant VARCHAR(255) NOT NULL,
    nom_mere VARCHAR(255) NOT NULL,
    age_mois INT NOT NULL,
    sexe ENUM('M', 'F') NOT NULL,
    province VARCHAR(100) NOT NULL,
    territoire VARCHAR(100) NOT NULL,
    partenaire VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    site_cs VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des rations nutrition
CREATE TABLE IF NOT EXISTS nutrition_rations (
    id VARCHAR(36) PRIMARY KEY,
    beneficiaire_id VARCHAR(36) NOT NULL,
    numero_carte VARCHAR(50) UNIQUE NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('ACTIF', 'INACTIF', 'TERMINE') DEFAULT 'ACTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiaire_id) REFERENCES nutrition_beneficiaires(id) ON DELETE CASCADE
);

-- Table des distributions nutrition
CREATE TABLE IF NOT EXISTS nutrition_distributions (
    id VARCHAR(36) PRIMARY KEY,
    ration_id VARCHAR(36) NOT NULL,
    date_distribution DATE NOT NULL,
    cycle VARCHAR(50) NOT NULL,
    quantite VARCHAR(50) NOT NULL,
    pb VARCHAR(50),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ration_id) REFERENCES nutrition_rations(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_nutrition_beneficiaire_numero ON nutrition_beneficiaires(numero_enregistrement);
CREATE INDEX IF NOT EXISTS idx_nutrition_ration_beneficiaire ON nutrition_rations(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_distribution_ration ON nutrition_distributions(ration_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_distribution_date ON nutrition_distributions(date_distribution);

-- Vue pour les rapports de nutrition
CREATE OR REPLACE VIEW nutrition_reports AS
SELECT 
    nb.numero_enregistrement,
    nb.nom_enfant,
    nb.nom_mere,
    nb.age_mois,
    nb.sexe,
    nb.site_cs,
    nr.numero_carte,
    nr.statut,
    COUNT(nd.id) as nombre_distributions,
    MAX(nd.date_distribution) as derniere_distribution
FROM nutrition_beneficiaires nb
JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
LEFT JOIN nutrition_distributions nd ON nr.id = nd.ration_id
GROUP BY nb.id, nr.id;
