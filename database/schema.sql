-- Create the database
CREATE DATABASE IF NOT EXISTS gestion_distribution;
USE gestion_distribution;

-- Create sites table to store distribution sites
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create households table to store household information
CREATE TABLE households (
    id VARCHAR(50) PRIMARY KEY,
    site_id INT NOT NULL,
    nom_menage VARCHAR(255) NOT NULL,
    token_number VARCHAR(50) NOT NULL UNIQUE,
    nombre_beneficiaires INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    INDEX idx_token (token_number)
);

-- Create recipients table to store recipient information
CREATE TABLE recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id),
    INDEX idx_household (household_id)
);

-- Create signatures table to store signature collections
CREATE TABLE signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(50) NOT NULL,
    recipient_id INT NOT NULL,
    signature_data MEDIUMTEXT NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    INDEX idx_household_signature (household_id)
);

-- Create distributions table to track distribution events
CREATE TABLE distributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(50) NOT NULL,
    recipient_id INT NOT NULL,
    signature_id INT NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (signature_id) REFERENCES signatures(id),
    INDEX idx_household_dist (household_id),
    INDEX idx_status (status)
);

-- Create audit_logs table for tracking changes
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    action ENUM('insert', 'update', 'delete') NOT NULL,
    old_data JSON,
    new_data JSON,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id)
);

-- Create helpful views
CREATE VIEW v_household_details AS
SELECT 
    h.id AS household_id,
    h.nom_menage,
    h.token_number,
    h.nombre_beneficiaires,
    s.nom AS site_distribution,
    s.adresse,
    r.first_name AS recipient_first_name,
    r.middle_name AS recipient_middle_name,
    r.last_name AS recipient_last_name,
    COALESCE(
        (SELECT first_name 
         FROM recipients 
         WHERE household_id = h.id 
         AND is_primary = FALSE 
         LIMIT 1
        ), ''
    ) AS nom_suppleant
FROM households h
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON h.id = r.household_id AND r.is_primary = TRUE;

-- Create stored procedure for importing household data
DELIMITER //
CREATE PROCEDURE import_household_data(
    IN p_site_nom VARCHAR(255),
    IN p_site_adresse TEXT,
    IN p_household_id VARCHAR(50),
    IN p_nom_menage VARCHAR(255),
    IN p_token_number VARCHAR(50),
    IN p_nombre_beneficiaires INT,
    IN p_recipient_first_name VARCHAR(100),
    IN p_recipient_middle_name VARCHAR(100),
    IN p_recipient_last_name VARCHAR(100),
    IN p_nom_suppleant VARCHAR(100)
)
BEGIN
    DECLARE v_site_id INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get or create site
    INSERT INTO sites (nom, adresse)
    SELECT p_site_nom, p_site_adresse
    WHERE NOT EXISTS (
        SELECT 1 FROM sites WHERE nom = p_site_nom AND adresse = p_site_adresse
    )
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
    
    SET v_site_id = LAST_INSERT_ID();
    
    -- Create household
    INSERT INTO households (
        id, site_id, nom_menage, token_number, nombre_beneficiaires
    ) VALUES (
        p_household_id, v_site_id, p_nom_menage, p_token_number, p_nombre_beneficiaires
    );
    
    -- Create primary recipient
    INSERT INTO recipients (
        household_id, first_name, middle_name, last_name, is_primary
    ) VALUES (
        p_household_id, 
        p_recipient_first_name, 
        p_recipient_middle_name, 
        p_recipient_last_name,
        TRUE
    );
    
    -- Create alternate recipient if provided
    IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
        INSERT INTO recipients (
            household_id, first_name, is_primary
        ) VALUES (
            p_household_id, p_nom_suppleant, FALSE
        );
    END IF;
    
    -- Commit transaction
    COMMIT;
END //
DELIMITER ;

-- Create stored procedure for recording signatures
DELIMITER //
CREATE PROCEDURE record_signature(
    IN p_household_id VARCHAR(50),
    IN p_signature_data MEDIUMTEXT
)
BEGIN
    DECLARE v_recipient_id INT;
    DECLARE v_signature_id INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get primary recipient ID
    SELECT id INTO v_recipient_id
    FROM recipients
    WHERE household_id = p_household_id AND is_primary = TRUE
    LIMIT 1;
    
    -- Record signature
    INSERT INTO signatures (
        household_id, recipient_id, signature_data
    ) VALUES (
        p_household_id, v_recipient_id, p_signature_data
    );
    
    SET v_signature_id = LAST_INSERT_ID();
    
    -- Create distribution record
    INSERT INTO distributions (
        household_id, recipient_id, signature_id, status
    ) VALUES (
        p_household_id, v_recipient_id, v_signature_id, 'completed'
    );
    
    -- Commit transaction
    COMMIT;
    
    -- Return the signature ID
    SELECT v_signature_id AS signature_id;
END //
DELIMITER ;
