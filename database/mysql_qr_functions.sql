DELIMITER //

-- Function to validate and process QR code data
CREATE FUNCTION process_qr_scan(
    p_qr_data JSON
) RETURNS VARCHAR(1000)
DETERMINISTIC
BEGIN
    DECLARE v_household_id VARCHAR(50);
    DECLARE v_nom_menage VARCHAR(255);
    DECLARE v_site_distribution VARCHAR(255);
    DECLARE v_token_number VARCHAR(50);
    DECLARE v_recipient_name VARCHAR(255);
    DECLARE v_status TEXT;
    DECLARE v_result VARCHAR(1000);

    -- Validate QR data structure
    IF JSON_EXTRACT(p_qr_data, '$.id') IS NULL THEN
        RETURN JSON_OBJECT(
            'error', 'Invalid QR code format - Missing ID',
            'household_id', NULL,
            'nom_menage', NULL,
            'site_distribution', NULL,
            'token_number', NULL,
            'recipient_name', NULL,
            'status', 'ERROR'
        );
    END IF;

    -- Get household information
    SELECT 
        h.id,
        h.nom_menage,
        s.nom,
        h.token_number,
        CONCAT_WS(' ', r.first_name, r.middle_name, r.last_name),
        CASE 
            WHEN d.id IS NOT NULL THEN 'Already distributed'
            ELSE 'Ready for distribution'
        END
    INTO
        v_household_id,
        v_nom_menage,
        v_site_distribution,
        v_token_number,
        v_recipient_name,
        v_status
    FROM households h
    JOIN sites s ON h.site_id = s.id
    LEFT JOIN recipients r ON h.id = r.household_id AND r.is_primary = true
    LEFT JOIN distributions d ON h.id = d.household_id
    WHERE h.id = JSON_UNQUOTE(JSON_EXTRACT(p_qr_data, '$.id'));

    IF v_household_id IS NULL THEN
        RETURN JSON_OBJECT(
            'error', 'Household not found',
            'household_id', JSON_UNQUOTE(JSON_EXTRACT(p_qr_data, '$.id')),
            'nom_menage', NULL,
            'site_distribution', NULL,
            'token_number', NULL,
            'recipient_name', NULL,
            'status', 'ERROR'
        );
    END IF;

    RETURN JSON_OBJECT(
        'error', NULL,
        'household_id', v_household_id,
        'nom_menage', v_nom_menage,
        'site_distribution', v_site_distribution,
        'token_number', v_token_number,
        'recipient_name', v_recipient_name,
        'status', v_status
    );
END //

-- Function to check if QR code has been used
CREATE FUNCTION check_qr_status(
    p_household_id VARCHAR(50)
) RETURNS JSON
DETERMINISTIC
BEGIN
    DECLARE v_is_distributed BOOLEAN;
    DECLARE v_distribution_date TIMESTAMP;
    DECLARE v_recipient_name VARCHAR(255);
    DECLARE v_signature_exists BOOLEAN;

    SELECT 
        d.id IS NOT NULL,
        d.distribution_date,
        CONCAT_WS(' ', r.first_name, r.middle_name, r.last_name),
        s.id IS NOT NULL
    INTO
        v_is_distributed,
        v_distribution_date,
        v_recipient_name,
        v_signature_exists
    FROM households h
    LEFT JOIN distributions d ON h.id = d.household_id
    LEFT JOIN recipients r ON d.recipient_id = r.id
    LEFT JOIN signatures s ON d.signature_id = s.id
    WHERE h.id = p_household_id;

    RETURN JSON_OBJECT(
        'is_distributed', v_is_distributed,
        'distribution_date', v_distribution_date,
        'recipient_name', v_recipient_name,
        'signature_exists', v_signature_exists
    );
END //

DELIMITER ;

-- Example usage:
-- SELECT process_qr_scan('{"id": "TEST123"}');
-- SELECT check_qr_status('TEST123');
