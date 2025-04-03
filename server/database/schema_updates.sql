-- Mises à jour du schéma de la base de données
USE gestion_distribution;

-- Ajout de colonnes pour le suivi des modifications
ALTER TABLE households
ADD COLUMN updated_by VARCHAR(100);

ALTER TABLE recipients
ADD COLUMN updated_by VARCHAR(100);

ALTER TABLE distributions
ADD COLUMN updated_by VARCHAR(100);

-- Ajout d'index pour améliorer les performances (avec vérification d'existence)
CREATE INDEX IF NOT EXISTS idx_household_token ON households(token_number);
CREATE INDEX IF NOT EXISTS idx_recipient_household ON recipients(household_id);
CREATE INDEX IF NOT EXISTS idx_distribution_household ON distributions(household_id);
CREATE INDEX IF NOT EXISTS idx_distribution_status ON distributions(status);

-- Vue pour les rapports de distribution
CREATE OR REPLACE VIEW distribution_reports AS
SELECT 
    d.id as distribution_id,
    h.token_number,
    h.nom_menage,
    s.nom as site_nom,
    r.first_name,
    r.last_name,
    d.status,
    d.created_at,
    COUNT(di.item_id) as nombre_articles,
    GROUP_CONCAT(i.nom) as articles_distribues
FROM distributions d
JOIN households h ON d.household_id = h.id
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON d.recipient_id = r.id
LEFT JOIN distribution_items di ON d.id = di.distribution_id
LEFT JOIN items i ON di.item_id = i.id
GROUP BY d.id;
