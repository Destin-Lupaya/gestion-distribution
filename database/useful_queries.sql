USE gestion_distribution;

-- 1. Procédure pour le tableau de bord principal
DELIMITER //
CREATE PROCEDURE dashboard_summary(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- Statistiques générales
    SELECT 
        COUNT(DISTINCT h.id) as total_menages,
        SUM(h.nombre_beneficiaires) as total_beneficiaires,
        COUNT(DISTINCT d.id) as total_distributions,
        COUNT(DISTINCT s.id) as total_sites
    FROM households h
    LEFT JOIN distributions d ON h.id = d.household_id 
        AND d.distribution_date BETWEEN p_start_date AND p_end_date
    LEFT JOIN sites s ON h.site_id = s.id;

    -- Distribution par groupe d'âge
    SELECT 
        ag.nom as groupe_age,
        COUNT(r.id) as nombre_beneficiaires
    FROM age_groups ag
    LEFT JOIN recipients r ON ag.id = r.age_group_id
    GROUP BY ag.id, ag.nom;

    -- Articles les plus distribués
    SELECT 
        i.nom as article,
        i.unite_mesure,
        SUM(di.quantite) as quantite_totale
    FROM items i
    JOIN distribution_items di ON i.id = di.item_id
    JOIN distributions d ON di.distribution_id = d.id
    WHERE d.distribution_date BETWEEN p_start_date AND p_end_date
    GROUP BY i.id, i.nom, i.unite_mesure
    ORDER BY quantite_totale DESC;
END //
DELIMITER ;

-- 2. Procédure pour vérifier les doublons potentiels
DELIMITER //
CREATE PROCEDURE check_potential_duplicates()
BEGIN
    -- Vérifier les ménages avec des noms similaires
    SELECT 
        h1.id as id1,
        h1.nom_menage as menage1,
        h2.id as id2,
        h2.nom_menage as menage2,
        h1.site_id,
        s.nom as site_name
    FROM households h1
    JOIN households h2 ON h1.nom_menage SOUNDS LIKE h2.nom_menage
        AND h1.id < h2.id
    JOIN sites s ON h1.site_id = s.id;

    -- Vérifier les bénéficiaires potentiellement en double
    SELECT 
        r1.id as id1,
        CONCAT(r1.first_name, ' ', r1.last_name) as beneficiaire1,
        r2.id as id2,
        CONCAT(r2.first_name, ' ', r2.last_name) as beneficiaire2,
        h.nom_menage
    FROM recipients r1
    JOIN recipients r2 ON r1.first_name SOUNDS LIKE r2.first_name
        AND r1.last_name SOUNDS LIKE r2.last_name
        AND r1.id < r2.id
    JOIN households h ON r1.household_id = h.id;
END //
DELIMITER ;

-- 3. Procédure pour le suivi des distributions par site
DELIMITER //
CREATE PROCEDURE site_distribution_tracking(
    IN p_site_id INT,
    IN p_date DATE
)
BEGIN
    -- Résumé des distributions du jour
    SELECT 
        h.token_number,
        h.nom_menage,
        CONCAT(r.first_name, ' ', r.last_name) as beneficiaire,
        d.status,
        GROUP_CONCAT(
            CONCAT(i.nom, ': ', di.quantite, ' ', i.unite_mesure)
            SEPARATOR '; '
        ) as articles_distribues
    FROM distributions d
    JOIN households h ON d.household_id = h.id
    JOIN recipients r ON d.recipient_id = r.id
    LEFT JOIN distribution_items di ON d.id = di.distribution_id
    LEFT JOIN items i ON di.item_id = i.id
    WHERE h.site_id = p_site_id
    AND DATE(d.distribution_date) = p_date
    GROUP BY d.id;

    -- Statistiques du jour
    SELECT 
        COUNT(DISTINCT d.id) as total_distributions,
        COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as distributions_completees,
        COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as distributions_en_attente,
        SUM(h.nombre_beneficiaires) as total_beneficiaires_touches
    FROM distributions d
    JOIN households h ON d.household_id = h.id
    WHERE h.site_id = p_site_id
    AND DATE(d.distribution_date) = p_date;
END //
DELIMITER ;

-- 4. Procédure pour la gestion des stocks
DELIMITER //
CREATE PROCEDURE stock_management(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- Consommation par article
    SELECT 
        i.nom as article,
        i.unite_mesure,
        SUM(di.quantite) as quantite_distribuee,
        COUNT(DISTINCT d.id) as nombre_distributions,
        SUM(di.quantite) / COUNT(DISTINCT d.id) as moyenne_par_distribution
    FROM items i
    LEFT JOIN distribution_items di ON i.id = di.item_id
    LEFT JOIN distributions d ON di.distribution_id = d.id
    WHERE d.distribution_date BETWEEN p_start_date AND p_end_date
    GROUP BY i.id, i.nom, i.unite_mesure;

    -- Tendance quotidienne
    SELECT 
        DATE(d.distribution_date) as date_distribution,
        i.nom as article,
        SUM(di.quantite) as quantite_distribuee
    FROM distributions d
    JOIN distribution_items di ON d.id = di.distribution_id
    JOIN items i ON di.item_id = i.id
    WHERE d.distribution_date BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(d.distribution_date), i.id, i.nom
    ORDER BY date_distribution, i.nom;
END //
DELIMITER ;

-- 5. Procédure pour l'analyse des bénéficiaires
DELIMITER //
CREATE PROCEDURE beneficiary_analysis(
    IN p_site_id INT
)
BEGIN
    -- Distribution par âge et genre
    SELECT 
        ag.nom as groupe_age,
        COUNT(r.id) as nombre_total,
        SUM(CASE WHEN r.is_primary THEN 1 ELSE 0 END) as beneficiaires_principaux,
        SUM(CASE WHEN r.is_primary THEN 0 ELSE 1 END) as beneficiaires_suppleants
    FROM age_groups ag
    LEFT JOIN recipients r ON ag.id = r.age_group_id
    LEFT JOIN households h ON r.household_id = h.id
    WHERE p_site_id IS NULL OR h.site_id = p_site_id
    GROUP BY ag.id, ag.nom;

    -- Taille des ménages
    SELECT 
        CASE 
            WHEN nombre_beneficiaires BETWEEN 1 AND 2 THEN '1-2'
            WHEN nombre_beneficiaires BETWEEN 3 AND 4 THEN '3-4'
            WHEN nombre_beneficiaires BETWEEN 5 AND 6 THEN '5-6'
            ELSE '7+'
        END as taille_menage,
        COUNT(*) as nombre_menages
    FROM households
    WHERE p_site_id IS NULL OR site_id = p_site_id
    GROUP BY 
        CASE 
            WHEN nombre_beneficiaires BETWEEN 1 AND 2 THEN '1-2'
            WHEN nombre_beneficiaires BETWEEN 3 AND 4 THEN '3-4'
            WHEN nombre_beneficiaires BETWEEN 5 AND 6 THEN '5-6'
            ELSE '7+'
        END
    ORDER BY taille_menage;
END //
DELIMITER ;

-- 6. Fonction pour générer un rapport d'audit
DELIMITER //
CREATE FUNCTION generate_audit_report(
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP,
    p_table_name VARCHAR(50)
) RETURNS TEXT
DETERMINISTIC
BEGIN
    DECLARE report TEXT;
    
    SELECT GROUP_CONCAT(
        CONCAT(
            'Action: ', action,
            ' | Table: ', table_name,
            ' | Record: ', record_id,
            ' | User: ', COALESCE(user_id, 'System'),
            ' | Time: ', created_at,
            '\nOld Data: ', COALESCE(old_data, 'N/A'),
            '\nNew Data: ', COALESCE(new_data, 'N/A'),
            '\n-------------------\n'
        )
        ORDER BY created_at
        SEPARATOR '\n'
    )
    INTO report
    FROM audit_logs
    WHERE created_at BETWEEN p_start_date AND p_end_date
    AND (p_table_name IS NULL OR table_name = p_table_name);
    
    RETURN COALESCE(report, 'No audit records found for the specified period');
END //
DELIMITER ;

-- Exemples d'utilisation :
-- CALL dashboard_summary('2025-03-01', '2025-04-01');
-- CALL check_potential_duplicates();
-- CALL site_distribution_tracking(1, CURRENT_DATE);
-- CALL stock_management('2025-03-01', '2025-04-01');
-- CALL beneficiary_analysis(NULL);
-- SELECT generate_audit_report('2025-03-01', '2025-04-01', NULL);
