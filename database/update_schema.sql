-- Mise à jour du schéma de la base de données pour ajouter les nouvelles fonctionnalités
USE gestion_distribution;

-- 1. Mise à jour de la table sites pour ajouter les coordonnées GPS et autres informations
ALTER TABLE sites 
ADD COLUMN localisation_gps POINT NULL,
ADD COLUMN province VARCHAR(100) NULL,
ADD COLUMN region VARCHAR(100) NULL, 
ADD COLUMN district VARCHAR(100) NULL,
ADD COLUMN capacite_distribution INT NULL,
ADD COLUMN responsable_site_id VARCHAR(50) NULL;

-- 2. Mise à jour de la table recipients pour ajouter plus d'informations démographiques
-- Vérifier l'existence de chaque colonne avant de l'ajouter

-- date_naissance
SET @exist_date_naissance = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'date_naissance');
SET @sql_date_naissance = IF(@exist_date_naissance = 0, 'ALTER TABLE recipients ADD COLUMN date_naissance DATE NULL', 'SELECT \'La colonne date_naissance existe déjà\' AS message');
PREPARE stmt FROM @sql_date_naissance;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- age
SET @exist_age = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'age');
SET @sql_age = IF(@exist_age = 0, 'ALTER TABLE recipients ADD COLUMN age INT NULL', 'SELECT \'La colonne age existe déjà\' AS message');
PREPARE stmt FROM @sql_age;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sexe
SET @exist_sexe = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'sexe');
SET @sql_sexe = IF(@exist_sexe = 0, 'ALTER TABLE recipients ADD COLUMN sexe ENUM(\'M\', \'F\', \'Autre\') NULL', 'SELECT \'La colonne sexe existe déjà\' AS message');
PREPARE stmt FROM @sql_sexe;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- identifiant_national
SET @exist_identifiant_national = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'identifiant_national');
SET @sql_identifiant_national = IF(@exist_identifiant_national = 0, 'ALTER TABLE recipients ADD COLUMN identifiant_national VARCHAR(50) NULL', 'SELECT \'La colonne identifiant_national existe déjà\' AS message');
PREPARE stmt FROM @sql_identifiant_national;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- criteres_vulnerabilite
SET @exist_criteres_vulnerabilite = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'criteres_vulnerabilite');
SET @sql_criteres_vulnerabilite = IF(@exist_criteres_vulnerabilite = 0, 'ALTER TABLE recipients ADD COLUMN criteres_vulnerabilite JSON NULL', 'SELECT \'La colonne criteres_vulnerabilite existe déjà\' AS message');
PREPARE stmt FROM @sql_criteres_vulnerabilite;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- statut_beneficiaire
SET @exist_statut_beneficiaire = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'statut_beneficiaire');
SET @sql_statut_beneficiaire = IF(@exist_statut_beneficiaire = 0, 'ALTER TABLE recipients ADD COLUMN statut_beneficiaire ENUM(\'Actif\', \'Inactif\', \'Doublon\', \'Décédé\', \'Déplacé\') DEFAULT \'Actif\'', 'SELECT \'La colonne statut_beneficiaire existe déjà\' AS message');
PREPARE stmt FROM @sql_statut_beneficiaire;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- photo_id
SET @exist_photo_id = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'photo_id');
SET @sql_photo_id = IF(@exist_photo_id = 0, 'ALTER TABLE recipients ADD COLUMN photo_id VARCHAR(255) NULL', 'SELECT \'La colonne photo_id existe déjà\' AS message');
PREPARE stmt FROM @sql_photo_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- autres_informations_demographiques
SET @exist_autres_informations_demographiques = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'autres_informations_demographiques');
SET @sql_autres_informations_demographiques = IF(@exist_autres_informations_demographiques = 0, 'ALTER TABLE recipients ADD COLUMN autres_informations_demographiques JSON NULL', 'SELECT \'La colonne autres_informations_demographiques existe déjà\' AS message');
PREPARE stmt FROM @sql_autres_informations_demographiques;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- date_enregistrement
SET @exist_date_enregistrement = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipients' AND COLUMN_NAME = 'date_enregistrement');
SET @sql_date_enregistrement = IF(@exist_date_enregistrement = 0, 'ALTER TABLE recipients ADD COLUMN date_enregistrement TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT \'La colonne date_enregistrement existe déjà\' AS message');
PREPARE stmt FROM @sql_date_enregistrement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Création de la table programmes_aide
CREATE TABLE programmes_aide (
    programme_id VARCHAR(36) PRIMARY KEY,
    nom_programme VARCHAR(255) NOT NULL,
    organisation_responsable VARCHAR(100) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Création de la table evenements_distribution (Calendrier de Distribution)
CREATE TABLE evenements_distribution (
    evenement_id VARCHAR(36) PRIMARY KEY,
    programme_id VARCHAR(36) NOT NULL,
    site_id INT NOT NULL,
    date_distribution_prevue DATE NOT NULL,
    heure_debut_prevue TIME NULL,
    heure_fin_prevue TIME NULL,
    type_assistance_prevue VARCHAR(255) NOT NULL,
    quantite_totale_prevue JSON NULL,
    statut_evenement ENUM('Planifié', 'En cours', 'Terminé', 'Annulé') DEFAULT 'Planifié',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (programme_id) REFERENCES programmes_aide(programme_id),
    FOREIGN KEY (site_id) REFERENCES sites(id),
    INDEX idx_evenement_site (site_id),
    INDEX idx_evenement_date (date_distribution_prevue),
    INDEX idx_evenement_statut (statut_evenement)
);

-- 5. Création de la table assistances_distribuees (Suivi Individuel)
CREATE TABLE assistances_distribuees (
    assistance_id VARCHAR(36) PRIMARY KEY,
    evenement_id VARCHAR(36) NOT NULL,
    beneficiaire_id INT NOT NULL,
    household_id VARCHAR(50) NOT NULL,
    date_reception_effective DATE NOT NULL,
    heure_reception_effective TIME NOT NULL,
    articles_recus JSON NULL,
    quantite_recue FLOAT NULL,
    agent_distributeur_id VARCHAR(50) NULL,
    mode_verification ENUM('Scan carte', 'Biométrie', 'Signature') DEFAULT 'Signature',
    notes_distribution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenements_distribution(evenement_id),
    FOREIGN KEY (beneficiaire_id) REFERENCES recipients(id),
    FOREIGN KEY (household_id) REFERENCES households(id),
    INDEX idx_assistance_evenement (evenement_id),
    INDEX idx_assistance_beneficiaire (beneficiaire_id),
    INDEX idx_assistance_household (household_id),
    INDEX idx_assistance_date (date_reception_effective)
);

-- 6. Création de la table listes_eligibles_distribution (pour lier les bénéficiaires aux événements)
CREATE TABLE listes_eligibles_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evenement_id VARCHAR(36) NOT NULL,
    beneficiaire_id INT NOT NULL,
    household_id VARCHAR(50) NOT NULL,
    statut_eligibilite ENUM('Eligible', 'Non-Eligible', 'Servi', 'Absent') DEFAULT 'Eligible',
    raison_eligibilite VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenements_distribution(evenement_id),
    FOREIGN KEY (beneficiaire_id) REFERENCES recipients(id),
    FOREIGN KEY (household_id) REFERENCES households(id),
    UNIQUE KEY unique_beneficiaire_evenement (evenement_id, beneficiaire_id),
    INDEX idx_liste_evenement (evenement_id),
    INDEX idx_liste_beneficiaire (beneficiaire_id),
    INDEX idx_liste_household (household_id),
    INDEX idx_liste_statut (statut_eligibilite)
);

-- 7. Création des vues pour faciliter les requêtes complexes
CREATE OR REPLACE VIEW v_beneficiaires_details AS
SELECT 
    r.id AS beneficiaire_id,
    r.household_id,
    h.token_number,
    h.nom_menage AS household_name,
    r.first_name,
    r.middle_name,
    r.last_name,
    r.date_naissance,
    r.age,
    r.sexe,
    r.identifiant_national,
    r.criteres_vulnerabilite,
    r.statut_beneficiaire,
    s.id AS site_id,
    s.nom AS site_name,
    s.adresse AS site_address,
    s.localisation_gps,
    s.province,
    s.region,
    s.district
FROM 
    recipients r
JOIN 
    households h ON r.household_id = h.id
JOIN 
    sites s ON h.site_id = s.id;

-- Vue pour les assistances par bénéficiaire
CREATE OR REPLACE VIEW v_assistances_beneficiaires AS
SELECT 
    ad.assistance_id,
    ad.evenement_id,
    ed.programme_id,
    pa.nom_programme,
    ed.date_distribution_prevue,
    ad.date_reception_effective,
    ad.heure_reception_effective,
    r.id AS beneficiaire_id,
    r.first_name,
    r.middle_name,
    r.last_name,
    h.token_number,
    h.nom_menage AS household_name,
    s.nom AS site_name,
    ed.type_assistance_prevue,
    ad.articles_recus,
    ad.quantite_recue,
    ad.mode_verification,
    ad.notes_distribution
FROM 
    assistances_distribuees ad
JOIN 
    evenements_distribution ed ON ad.evenement_id = ed.evenement_id
JOIN 
    programmes_aide pa ON ed.programme_id = pa.programme_id
JOIN 
    recipients r ON ad.beneficiaire_id = r.id
JOIN 
    households h ON ad.household_id = h.id
JOIN 
    sites s ON ed.site_id = s.id;

-- 8. Procédure stockée pour générer une liste de distribution éligible
DELIMITER //
CREATE PROCEDURE generer_liste_eligibles(
    IN p_evenement_id VARCHAR(36),
    IN p_criteres_eligibilite JSON
)
BEGIN
    DECLARE v_site_id INT;
    
    -- Récupérer le site_id de l'événement
    SELECT site_id INTO v_site_id FROM evenements_distribution WHERE evenement_id = p_evenement_id;
    
    -- Insérer tous les bénéficiaires du site dans la liste éligible
    INSERT INTO listes_eligibles_distribution (evenement_id, beneficiaire_id, household_id, statut_eligibilite)
    SELECT 
        p_evenement_id,
        r.id,
        r.household_id,
        'Eligible'
    FROM 
        recipients r
    JOIN 
        households h ON r.household_id = h.id
    WHERE 
        h.site_id = v_site_id
        AND r.statut_beneficiaire = 'Actif'
    ON DUPLICATE KEY UPDATE statut_eligibilite = 'Eligible';
    
    -- Appliquer les critères d'éligibilité spécifiques si fournis
    -- Cette partie est simplifiée et devrait être adaptée selon les critères réels
    IF p_criteres_eligibilite IS NOT NULL THEN
        -- Exemple: désactiver les bénéficiaires qui ne correspondent pas aux critères
        -- Cette logique devrait être adaptée selon la structure de p_criteres_eligibilite
        UPDATE listes_eligibles_distribution led
        JOIN recipients r ON led.beneficiaire_id = r.id
        SET led.statut_eligibilite = 'Non-Eligible'
        WHERE 
            led.evenement_id = p_evenement_id
            AND (
                -- Exemple de critère: sexe spécifique
                (JSON_EXTRACT(p_criteres_eligibilite, '$.sexe') IS NOT NULL 
                 AND r.sexe != JSON_UNQUOTE(JSON_EXTRACT(p_criteres_eligibilite, '$.sexe')))
                 
                -- Exemple de critère: âge minimum
                OR (JSON_EXTRACT(p_criteres_eligibilite, '$.age_min') IS NOT NULL 
                    AND r.age < JSON_EXTRACT(p_criteres_eligibilite, '$.age_min'))
                    
                -- Exemple de critère: âge maximum
                OR (JSON_EXTRACT(p_criteres_eligibilite, '$.age_max') IS NOT NULL 
                    AND r.age > JSON_EXTRACT(p_criteres_eligibilite, '$.age_max'))
            );
    END IF;
END //
DELIMITER ;

-- 9. Procédure stockée pour enregistrer une assistance distribuée
DELIMITER //
CREATE PROCEDURE enregistrer_assistance(
    IN p_evenement_id VARCHAR(36),
    IN p_beneficiaire_id INT,
    IN p_household_id VARCHAR(50),
    IN p_articles_recus JSON,
    IN p_quantite_recue FLOAT,
    IN p_agent_distributeur_id VARCHAR(50),
    IN p_mode_verification VARCHAR(50),
    IN p_notes_distribution TEXT
)
BEGIN
    DECLARE v_assistance_id VARCHAR(36);
    
    -- Générer un UUID pour l'assistance
    SET v_assistance_id = UUID();
    
    -- Insérer l'assistance
    INSERT INTO assistances_distribuees (
        assistance_id,
        evenement_id,
        beneficiaire_id,
        household_id,
        date_reception_effective,
        heure_reception_effective,
        articles_recus,
        quantite_recue,
        agent_distributeur_id,
        mode_verification,
        notes_distribution
    ) VALUES (
        v_assistance_id,
        p_evenement_id,
        p_beneficiaire_id,
        p_household_id,
        CURDATE(),
        CURTIME(),
        p_articles_recus,
        p_quantite_recue,
        p_agent_distributeur_id,
        p_mode_verification,
        p_notes_distribution
    );
    
    -- Mettre à jour le statut dans la liste éligible
    UPDATE listes_eligibles_distribution
    SET statut_eligibilite = 'Servi'
    WHERE 
        evenement_id = p_evenement_id
        AND beneficiaire_id = p_beneficiaire_id;
    
    -- Retourner l'ID de l'assistance créée
    SELECT v_assistance_id AS assistance_id;
END //
DELIMITER ;
