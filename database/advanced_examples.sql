USE gestion_distribution;

-- 1. Exemple de rapport mensuel complet
-- =====================================
DELIMITER //
CREATE PROCEDURE monthly_complete_report(
    IN p_year INT,
    IN p_month INT
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    SET start_date = DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'));
    SET end_date = LAST_DAY(start_date);
    
    -- 1.1 Résumé mensuel
    SELECT 
        DATE_FORMAT(start_date, '%M %Y') as periode,
        COUNT(DISTINCT d.household_id) as menages_servis,
        SUM(h.nombre_beneficiaires) as total_beneficiaires,
        COUNT(DISTINCT d.id) as distributions_effectuees
    FROM distributions d
    JOIN households h ON d.household_id = h.id
    WHERE d.distribution_date BETWEEN start_date AND end_date
    AND d.status = 'completed';

    -- 1.2 Distribution par site
    SELECT 
        s.nom as site,
        COUNT(DISTINCT d.household_id) as menages,
        SUM(h.nombre_beneficiaires) as beneficiaires,
        GROUP_CONCAT(DISTINCT 
            CONCAT(i.nom, ': ', SUM(di.quantite), ' ', i.unite_mesure)
        ) as articles_distribues
    FROM sites s
    LEFT JOIN households h ON s.id = h.site_id
    LEFT JOIN distributions d ON h.id = d.household_id
    LEFT JOIN distribution_items di ON d.id = di.distribution_id
    LEFT JOIN items i ON di.item_id = i.id
    WHERE d.distribution_date BETWEEN start_date AND end_date
    AND d.status = 'completed'
    GROUP BY s.id, s.nom;

    -- 1.3 Analyse démographique
    SELECT 
        ag.nom as groupe_age,
        COUNT(r.id) as nombre,
        ROUND(COUNT(r.id) * 100.0 / (
            SELECT COUNT(*) FROM recipients
            JOIN households h ON recipients.household_id = h.id
            JOIN distributions d ON h.id = d.household_id
            WHERE d.distribution_date BETWEEN start_date AND end_date
        ), 2) as pourcentage
    FROM age_groups ag
    LEFT JOIN recipients r ON ag.id = r.age_group_id
    JOIN households h ON r.household_id = h.id
    JOIN distributions d ON h.id = d.household_id
    WHERE d.distribution_date BETWEEN start_date AND end_date
    GROUP BY ag.id, ag.nom;
END //
DELIMITER ;

-- 2. Analyse des tendances de distribution
-- ======================================
DELIMITER //
CREATE PROCEDURE distribution_trends_analysis(
    IN p_months INT -- Nombre de mois à analyser
)
BEGIN
    -- 2.1 Tendance mensuelle des distributions
    SELECT 
        DATE_FORMAT(d.distribution_date, '%Y-%m') as mois,
        COUNT(DISTINCT d.id) as total_distributions,
        COUNT(DISTINCT d.household_id) as menages_uniques,
        ROUND(AVG(h.nombre_beneficiaires), 2) as moyenne_beneficiaires_par_menage
    FROM distributions d
    JOIN households h ON d.household_id = h.id
    WHERE d.distribution_date >= DATE_SUB(CURRENT_DATE, INTERVAL p_months MONTH)
    GROUP BY DATE_FORMAT(d.distribution_date, '%Y-%m')
    ORDER BY mois;

    -- 2.2 Articles les plus demandés par période
    SELECT 
        DATE_FORMAT(d.distribution_date, '%Y-%m') as mois,
        i.nom as article,
        SUM(di.quantite) as quantite_totale,
        RANK() OVER (
            PARTITION BY DATE_FORMAT(d.distribution_date, '%Y-%m')
            ORDER BY SUM(di.quantite) DESC
        ) as rang
    FROM distributions d
    JOIN distribution_items di ON d.id = di.distribution_id
    JOIN items i ON di.item_id = i.id
    WHERE d.distribution_date >= DATE_SUB(CURRENT_DATE, INTERVAL p_months MONTH)
    GROUP BY DATE_FORMAT(d.distribution_date, '%Y-%m'), i.id, i.nom
    HAVING rang <= 3;
END //
DELIMITER ;

-- 3. Analyse des anomalies et alertes
-- ==================================
DELIMITER //
CREATE PROCEDURE anomaly_detection()
BEGIN
    -- 3.1 Distributions multiples pour le même ménage
    SELECT 
        h.id as household_id,
        h.nom_menage,
        COUNT(d.id) as nombre_distributions,
        GROUP_CONCAT(
            CONCAT(
                DATE_FORMAT(d.distribution_date, '%Y-%m-%d'),
                ' (', d.status, ')'
            )
        ) as dates_distribution
    FROM households h
    JOIN distributions d ON h.id = d.household_id
    WHERE d.distribution_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY h.id, h.nom_menage
    HAVING COUNT(d.id) > 1;

    -- 3.2 Ménages n'ayant jamais reçu de distribution
    SELECT 
        h.id,
        h.nom_menage,
        h.token_number,
        s.nom as site,
        h.nombre_beneficiaires
    FROM households h
    LEFT JOIN distributions d ON h.id = d.household_id
    JOIN sites s ON h.site_id = s.id
    WHERE d.id IS NULL;

    -- 3.3 Distributions avec quantités anormales
    WITH avg_quantities AS (
        SELECT 
            i.id as item_id,
            i.nom as item_name,
            AVG(di.quantite) as avg_quantity,
            STDDEV(di.quantite) as std_dev
        FROM distribution_items di
        JOIN items i ON di.item_id = i.id
        GROUP BY i.id, i.nom
    )
    SELECT 
        d.id as distribution_id,
        h.nom_menage,
        i.nom as item,
        di.quantite,
        aq.avg_quantity,
        aq.std_dev,
        ROUND((di.quantite - aq.avg_quantity) / aq.std_dev, 2) as z_score
    FROM distribution_items di
    JOIN distributions d ON di.distribution_id = d.id
    JOIN households h ON d.household_id = h.id
    JOIN items i ON di.item_id = i.id
    JOIN avg_quantities aq ON i.id = aq.item_id
    WHERE ABS((di.quantite - aq.avg_quantity) / aq.std_dev) > 2;
END //
DELIMITER ;

-- 4. Rapports de performance des sites
-- ==================================
DELIMITER //
CREATE PROCEDURE site_performance_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- 4.1 Performance globale par site
    SELECT 
        s.nom as site,
        COUNT(DISTINCT d.id) as total_distributions,
        COUNT(DISTINCT d.household_id) as menages_servis,
        SUM(h.nombre_beneficiaires) as beneficiaires_touches,
        ROUND(AVG(
            TIMESTAMPDIFF(MINUTE, 
                d.distribution_date, 
                (SELECT MIN(created_at) FROM signatures WHERE household_id = d.household_id)
            )
        ), 2) as temps_moyen_distribution_minutes
    FROM sites s
    LEFT JOIN households h ON s.id = h.site_id
    LEFT JOIN distributions d ON h.id = d.household_id
    WHERE d.distribution_date BETWEEN p_start_date AND p_end_date
    GROUP BY s.id, s.nom;

    -- 4.2 Efficacité quotidienne
    SELECT 
        s.nom as site,
        DATE(d.distribution_date) as jour,
        COUNT(d.id) as distributions,
        COUNT(DISTINCT 
            CASE WHEN d.status = 'completed' 
            THEN d.id END
        ) as completees,
        ROUND(
            COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) * 100.0 / 
            COUNT(d.id), 
        2) as taux_completion
    FROM sites s
    JOIN households h ON s.id = h.site_id
    JOIN distributions d ON h.id = d.household_id
    WHERE d.distribution_date BETWEEN p_start_date AND p_end_date
    GROUP BY s.id, s.nom, DATE(d.distribution_date);
END //
DELIMITER ;

-- 5. Exemples d'utilisation
-- ========================

-- Rapport mensuel pour mars 2025
CALL monthly_complete_report(2025, 3);

-- Analyse des tendances sur 6 mois
CALL distribution_trends_analysis(6);

-- Détection des anomalies
CALL anomaly_detection();

-- Performance des sites pour le dernier mois
CALL site_performance_report(
    DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH),
    CURRENT_DATE
);

-- 6. Requêtes utiles pour l'interface utilisateur
-- =============================================

-- 6.1 Recherche de ménages (pour l'autocomplétion)
SELECT id, nom_menage, token_number
FROM households
WHERE nom_menage LIKE CONCAT('%', :search_term, '%')
   OR token_number LIKE CONCAT('%', :search_term, '%')
LIMIT 10;

-- 6.2 Résumé rapide pour un ménage
SELECT 
    h.nom_menage,
    h.token_number,
    s.nom as site,
    h.nombre_beneficiaires,
    CONCAT(r.first_name, ' ', r.last_name) as beneficiaire_principal,
    (SELECT COUNT(*) FROM distributions 
     WHERE household_id = h.id AND status = 'completed') as distributions_recues,
    (SELECT MAX(distribution_date) FROM distributions 
     WHERE household_id = h.id AND status = 'completed') as derniere_distribution
FROM households h
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON h.id = r.household_id AND r.is_primary = true
WHERE h.id = :household_id;

-- 6.3 Statistiques en temps réel pour le tableau de bord
SELECT 
    COUNT(DISTINCT CASE WHEN d.distribution_date = CURRENT_DATE THEN d.id END) as distributions_aujourd_hui,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as en_attente,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' 
        AND d.distribution_date = CURRENT_DATE THEN d.id END) as completees_aujourd_hui,
    (SELECT COUNT(DISTINCT household_id) 
     FROM distributions 
     WHERE distribution_date = CURRENT_DATE) as menages_servis_aujourd_hui
FROM distributions d;

-- 6.4 Rapport de distribution quotidien par site
SELECT 
    s.nom as site,
    COUNT(DISTINCT d.id) as total_distributions,
    SUM(CASE WHEN d.status = 'completed' THEN 1 ELSE 0 END) as completees,
    SUM(CASE WHEN d.status = 'pending' THEN 1 ELSE 0 END) as en_attente,
    COUNT(DISTINCT d.household_id) as menages_uniques,
    SUM(h.nombre_beneficiaires) as total_beneficiaires
FROM sites s
LEFT JOIN households h ON s.id = h.site_id
LEFT JOIN distributions d ON h.id = d.household_id 
    AND DATE(d.distribution_date) = CURRENT_DATE
GROUP BY s.id, s.nom;
