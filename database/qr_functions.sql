-- Function to validate and process QR code data
CREATE OR REPLACE FUNCTION process_qr_scan(
    p_qr_data JSONB
) RETURNS TABLE (
    household_id VARCHAR(50),
    nom_menage VARCHAR(255),
    site_distribution VARCHAR(255),
    token_number VARCHAR(50),
    recipient_name VARCHAR(255),
    status TEXT
) AS $$
BEGIN
    -- Validate QR data structure
    IF NOT (p_qr_data ? 'id') THEN
        RETURN QUERY SELECT 
            NULL::VARCHAR(50),
            NULL::VARCHAR(255),
            NULL::VARCHAR(255),
            NULL::VARCHAR(50),
            NULL::VARCHAR(255),
            'ERROR: Invalid QR code format - Missing ID'::TEXT;
        RETURN;
    END IF;

    -- Return household information
    RETURN QUERY 
    SELECT 
        h.id,
        h.nom_menage,
        s.nom,
        h.token_number,
        concat_ws(' ', r.first_name, r.middle_name, r.last_name),
        CASE 
            WHEN d.id IS NOT NULL THEN 'Already distributed'
            ELSE 'Ready for distribution'
        END
    FROM households h
    JOIN sites s ON h.site_id = s.id
    LEFT JOIN recipients r ON h.id = r.household_id AND r.is_primary = true
    LEFT JOIN distributions d ON h.id = d.household_id
    WHERE h.id = (p_qr_data->>'id')::VARCHAR;

    -- If no rows returned, household not found
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            p_qr_data->>'id',
            NULL::VARCHAR(255),
            NULL::VARCHAR(255),
            NULL::VARCHAR(50),
            NULL::VARCHAR(255),
            'ERROR: Household not found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if QR code has been used
CREATE OR REPLACE FUNCTION check_qr_status(
    p_household_id VARCHAR(50)
) RETURNS TABLE (
    is_distributed BOOLEAN,
    distribution_date TIMESTAMPTZ,
    recipient_name VARCHAR(255),
    signature_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.id IS NOT NULL,
        d.distribution_date,
        concat_ws(' ', r.first_name, r.middle_name, r.last_name),
        s.id IS NOT NULL
    FROM households h
    LEFT JOIN distributions d ON h.id = d.household_id
    LEFT JOIN recipients r ON d.recipient_id = r.id
    LEFT JOIN signatures s ON d.signature_id = s.id
    WHERE h.id = p_household_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM process_qr_scan('{"id": "TEST123"}'::JSONB);
-- SELECT * FROM check_qr_status('TEST123');
