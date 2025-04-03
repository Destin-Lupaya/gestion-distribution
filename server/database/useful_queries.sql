-- Requêtes utiles pour l'application
USE gestion_distribution;

-- Vue pour le tableau de bord
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    s.nom as site_name,
    COUNT(DISTINCT h.id) as total_households,
    COUNT(DISTINCT r.id) as total_recipients,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as completed_distributions,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as pending_distributions
FROM sites s
LEFT JOIN households h ON s.id = h.site_id
LEFT JOIN recipients r ON h.id = r.household_id
LEFT JOIN distributions d ON h.id = d.household_id
GROUP BY s.id;

-- Procédure pour obtenir l'historique des distributions d'un ménage
DELIMITER //
CREATE OR REPLACE PROCEDURE get_household_distribution_history(IN p_household_id VARCHAR(36))
BEGIN
    SELECT 
        d.id,
        d.created_at,
        d.status,
        r.first_name,
        r.last_name,
        GROUP_CONCAT(CONCAT(i.nom, ': ', di.quantite, ' ', i.unite_mesure)) as items_distribues
    FROM distributions d
    JOIN recipients r ON d.recipient_id = r.id
    LEFT JOIN distribution_items di ON d.id = di.distribution_id
    LEFT JOIN items i ON di.item_id = i.id
    WHERE d.household_id = p_household_id
    GROUP BY d.id
    ORDER BY d.created_at DESC;
END //
DELIMITER ;

-- Procédure pour vérifier l'éligibilité d'un ménage
DELIMITER //
CREATE OR REPLACE PROCEDURE check_household_eligibility(
    IN p_household_id VARCHAR(36),
    OUT p_eligible BOOLEAN,
    OUT p_reason VARCHAR(255)
)
BEGIN
    DECLARE last_distribution DATETIME;
    
    -- Vérifier la dernière distribution
    SELECT MAX(created_at) INTO last_distribution
    FROM distributions
    WHERE household_id = p_household_id
    AND status = 'completed';
    
    IF last_distribution IS NULL THEN
        SET p_eligible = TRUE;
        SET p_reason = 'Première distribution';
    ELSEIF last_distribution < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN
        SET p_eligible = TRUE;
        SET p_reason = 'Plus de 30 jours depuis la dernière distribution';
    ELSE
        SET p_eligible = FALSE;
        SET p_reason = CONCAT('Dernière distribution le ', DATE_FORMAT(last_distribution, '%Y-%m-%d'));
    END IF;
END //
DELIMITER ;
