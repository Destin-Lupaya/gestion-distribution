USE gestion_distribution;

-- 1. Procédures avancées pour la gestion des QR codes
-- =================================================
DELIMITER //

-- 1.1 Validation complète d'un QR code avec historique
CREATE PROCEDURE validate_qr_with_history(
    IN p_qr_data JSON
)
BEGIN
    DECLARE v_household_id VARCHAR(50);
    DECLARE v_last_distribution TIMESTAMP;
    DECLARE v_is_valid BOOLEAN DEFAULT FALSE;
    
    -- Extraire l'ID du ménage
    SET v_household_id = JSON_UNQUOTE(JSON_EXTRACT(p_qr_data, '$.id'));
    
    -- Vérifier la dernière distribution
    SELECT MAX(distribution_date)
    INTO v_last_distribution
    FROM distributions
    WHERE household_id = v_household_id
    AND status = 'completed';
    
    -- Vérifier la validité
    SELECT EXISTS (
        SELECT 1 
        FROM households h
        WHERE h.id = v_household_id
        AND NOT EXISTS (
            SELECT 1 
            FROM distributions d
            WHERE d.household_id = h.id
            AND d.status = 'completed'
            AND d.distribution_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
    ) INTO v_is_valid;

    -- Retourner les informations détaillées
    SELECT 
        h.id,
        h.nom_menage,
        h.token_number,
        s.nom as site_name,
        CONCAT(r.first_name, ' ', r.last_name) as beneficiaire_principal,
        h.nombre_beneficiaires,
        v_is_valid as est_valide,
        v_last_distribution as derniere_distribution,
        CASE 
            WHEN v_last_distribution IS NULL THEN 'Première distribution'
            WHEN v_is_valid THEN 'Éligible pour distribution'
            ELSE 'Distribution récente - Non éligible'
        END as statut,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', DATE_FORMAT(d.distribution_date, '%Y-%m-%d'),
                    'status', d.status,
                    'items', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'nom', i.nom,
                                'quantite', di.quantite,
                                'unite', i.unite_mesure
                            )
                        )
                        FROM distribution_items di
                        JOIN items i ON di.item_id = i.id
                        WHERE di.distribution_id = d.id
                    )
                )
            )
            FROM distributions d
            WHERE d.household_id = h.id
            ORDER BY d.distribution_date DESC
            LIMIT 5
        ) as historique_recent
    FROM households h
    JOIN sites s ON h.site_id = s.id
    LEFT JOIN recipients r ON h.id = r.household_id AND r.is_primary = true
    WHERE h.id = v_household_id;
END //

-- 1.2 Procédure de validation de signature
CREATE PROCEDURE validate_and_store_signature(
    IN p_household_id VARCHAR(50),
    IN p_signature_data MEDIUMTEXT,
    IN p_items JSON
)
BEGIN
    DECLARE v_distribution_id INT;
    DECLARE v_signature_id INT;
    DECLARE v_recipient_id INT;
    DECLARE v_is_valid BOOLEAN DEFAULT FALSE;
    
    -- Vérifier l'éligibilité
    SELECT EXISTS (
        SELECT 1 
        FROM households h
        WHERE h.id = p_household_id
        AND NOT EXISTS (
            SELECT 1 
            FROM distributions d
            WHERE d.household_id = h.id
            AND d.status = 'completed'
            AND d.distribution_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
    ) INTO v_is_valid;
    
    IF NOT v_is_valid THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ménage non éligible pour une nouvelle distribution';
    END IF;

    -- Début de la transaction
    START TRANSACTION;
    
    -- Obtenir l'ID du bénéficiaire principal
    SELECT id INTO v_recipient_id
    FROM recipients
    WHERE household_id = p_household_id AND is_primary = true
    LIMIT 1;
    
    -- Enregistrer la signature
    INSERT INTO signatures (household_id, recipient_id, signature_data)
    VALUES (p_household_id, v_recipient_id, p_signature_data);
    
    SET v_signature_id = LAST_INSERT_ID();
    
    -- Créer la distribution
    INSERT INTO distributions (
        household_id, 
        recipient_id, 
        signature_id, 
        status,
        distribution_date
    ) VALUES (
        p_household_id,
        v_recipient_id,
        v_signature_id,
        'completed',
        NOW()
    );
    
    SET v_distribution_id = LAST_INSERT_ID();
    
    -- Enregistrer les articles distribués
    INSERT INTO distribution_items (distribution_id, item_id, quantite)
    SELECT 
        v_distribution_id,
        JSON_UNQUOTE(JSON_EXTRACT(items.item, '$.id')),
        JSON_EXTRACT(items.item, '$.quantite')
    FROM JSON_TABLE(
        p_items,
        '$[*]' COLUMNS (
            item JSON PATH '$'
        )
    ) items;
    
    -- Valider la transaction
    COMMIT;
    
    -- Retourner la confirmation
    SELECT 
        d.id as distribution_id,
        d.distribution_date,
        h.nom_menage,
        h.token_number,
        s.nom as site_name,
        CONCAT(r.first_name, ' ', r.last_name) as beneficiaire,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'nom', i.nom,
                    'quantite', di.quantite,
                    'unite', i.unite_mesure
                )
            )
            FROM distribution_items di
            JOIN items i ON di.item_id = i.id
            WHERE di.distribution_id = d.id
        ) as articles_distribues
    FROM distributions d
    JOIN households h ON d.household_id = h.id
    JOIN sites s ON h.site_id = s.id
    JOIN recipients r ON d.recipient_id = r.id
    WHERE d.id = v_distribution_id;
END //

-- 1.3 Procédure de vérification de signature
CREATE PROCEDURE verify_signature(
    IN p_household_id VARCHAR(50),
    IN p_distribution_id INT
)
BEGIN
    SELECT 
        s.id as signature_id,
        s.signature_data,
        s.collected_at,
        d.distribution_date,
        d.status,
        CONCAT(r.first_name, ' ', r.last_name) as signed_by,
        r.is_primary as is_primary_recipient
    FROM signatures s
    JOIN distributions d ON s.id = d.signature_id
    JOIN recipients r ON s.recipient_id = r.id
    WHERE d.household_id = p_household_id
    AND (p_distribution_id IS NULL OR d.id = p_distribution_id)
    ORDER BY s.collected_at DESC;
END //

DELIMITER ;

-- 2. Exemples d'utilisation
-- ========================

-- 2.1 Valider un QR code
CALL validate_qr_with_history('{"id": "TEST001"}');

-- 2.2 Enregistrer une distribution avec signature
CALL validate_and_store_signature(
    'TEST001',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    '[
        {"id": 1, "quantite": 25.0},
        {"id": 2, "quantite": 5.0},
        {"id": 3, "quantite": 10.0}
    ]'
);

-- 2.3 Vérifier une signature
CALL verify_signature('TEST001', NULL);

-- 3. Requêtes utiles pour l'interface QR
-- ====================================

-- 3.1 Vérifier si un QR code a déjà été utilisé aujourd'hui
SELECT EXISTS (
    SELECT 1
    FROM distributions
    WHERE household_id = :household_id
    AND DATE(distribution_date) = CURRENT_DATE
) as used_today;

-- 3.2 Obtenir l'historique des scans pour un QR code
SELECT 
    d.distribution_date,
    d.status,
    CONCAT(r.first_name, ' ', r.last_name) as beneficiaire,
    s.collected_at as signature_timestamp,
    GROUP_CONCAT(
        CONCAT(i.nom, ': ', di.quantite, ' ', i.unite_mesure)
        SEPARATOR '; '
    ) as articles
FROM distributions d
JOIN recipients r ON d.recipient_id = r.id
LEFT JOIN signatures s ON d.signature_id = s.id
LEFT JOIN distribution_items di ON d.id = di.distribution_id
LEFT JOIN items i ON di.item_id = i.id
WHERE d.household_id = :household_id
GROUP BY d.id
ORDER BY d.distribution_date DESC;

-- 3.3 Statistiques des scans QR par site
SELECT 
    s.nom as site,
    COUNT(d.id) as total_scans,
    COUNT(DISTINCT d.household_id) as menages_uniques,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as distributions_completees,
    AVG(TIMESTAMPDIFF(MINUTE, d.distribution_date, sig.collected_at)) as temps_moyen_signature
FROM sites s
JOIN households h ON s.id = h.site_id
LEFT JOIN distributions d ON h.id = d.household_id
LEFT JOIN signatures sig ON d.signature_id = sig.id
WHERE DATE(d.distribution_date) = CURRENT_DATE
GROUP BY s.id, s.nom;
