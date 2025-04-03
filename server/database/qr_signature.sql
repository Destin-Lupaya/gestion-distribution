-- Fonctions pour la gestion des signatures QR
DELIMITER //

CREATE OR REPLACE FUNCTION generate_qr_token(household_id VARCHAR(36))
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
    RETURN CONCAT('QR-', household_id, '-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
END //

CREATE OR REPLACE FUNCTION validate_qr_signature(token VARCHAR(255), household_id VARCHAR(36))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE valid BOOLEAN;
    SET valid = (
        SELECT EXISTS (
            SELECT 1 
            FROM signatures s
            JOIN recipients r ON s.recipient_id = r.id
            WHERE r.household_id = household_id 
            AND s.qr_token = token 
            AND s.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )
    );
    RETURN valid;
END //

DELIMITER ;
