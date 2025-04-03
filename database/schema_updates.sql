USE gestion_distribution;

-- Create items table
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite_mesure VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create distribution_items table
CREATE TABLE distribution_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    distribution_id INT NOT NULL,
    item_id INT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distribution_id) REFERENCES distributions(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    INDEX idx_distribution (distribution_id)
);

-- Create age_groups table
CREATE TABLE age_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    age_min INT NOT NULL,
    age_max INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_age_range (age_min, age_max)
);

-- Add age_group_id to recipients
ALTER TABLE recipients
ADD COLUMN age_group_id INT,
ADD FOREIGN KEY (age_group_id) REFERENCES age_groups(id);

-- Create view for distribution statistics
CREATE OR REPLACE VIEW v_distribution_stats AS
SELECT 
    d.distribution_date,
    s.nom AS site_name,
    COUNT(DISTINCT d.household_id) AS total_households,
    SUM(h.nombre_beneficiaires) AS total_beneficiaires,
    ag.nom AS age_group,
    COUNT(r.id) AS beneficiaires_par_age
FROM distributions d
JOIN households h ON d.household_id = h.id
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON h.id = r.household_id
LEFT JOIN age_groups ag ON r.age_group_id = ag.id
WHERE d.status = 'completed'
GROUP BY d.distribution_date, s.nom, ag.nom;

-- Create stored procedure for distribution reporting
DELIMITER //
CREATE PROCEDURE generate_distribution_report(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_site_id INT
)
BEGIN
    SELECT 
        di.distribution_date,
        s.nom AS site_name,
        COUNT(DISTINCT di.household_id) AS menages,
        SUM(h.nombre_beneficiaires) AS beneficiaires,
        GROUP_CONCAT(DISTINCT CONCAT(i.nom, ': ', dit.quantite, ' ', i.unite_mesure)) AS articles_distribues
    FROM distributions di
    JOIN households h ON di.household_id = h.id
    JOIN sites s ON h.site_id = s.id
    JOIN distribution_items dit ON di.id = dit.distribution_id
    JOIN items i ON dit.item_id = i.id
    WHERE di.distribution_date BETWEEN p_start_date AND p_end_date
    AND (p_site_id IS NULL OR s.id = p_site_id)
    GROUP BY di.distribution_date, s.nom;
END //
DELIMITER ;

-- Insert default age groups
INSERT INTO age_groups (nom, age_min, age_max) VALUES
('0-14 ans', 0, 14),
('15-24 ans', 15, 24),
('25-44 ans', 25, 44),
('45-64 ans', 45, 64),
('65+ ans', 65, 200);

-- Create trigger for automatic age group assignment
DELIMITER //
CREATE TRIGGER after_recipient_insert
AFTER INSERT ON recipients
FOR EACH ROW
BEGIN
    DECLARE v_age INT;
    -- Calculate age based on birth date (you'll need to add birth_date column)
    -- SET v_age = YEAR(CURRENT_DATE) - YEAR(NEW.birth_date);
    
    -- For now, we'll use a default age group
    UPDATE recipients 
    SET age_group_id = (
        SELECT id 
        FROM age_groups 
        WHERE age_min <= 25 AND age_max >= 25
        LIMIT 1
    )
    WHERE id = NEW.id;
END //
DELIMITER ;
