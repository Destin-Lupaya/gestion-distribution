/*
  # Fix duplicate household ID handling

  1. Changes
    - Add ON CONFLICT clause for household creation
    - Update existing household data if found
    - Generate unique household IDs
*/

-- Drop existing function
DROP FUNCTION IF EXISTS import_household_data(varchar, varchar, varchar, varchar, varchar, integer, varchar, varchar, varchar, varchar);

-- Recreate function with proper household handling
CREATE OR REPLACE FUNCTION import_household_data(
    p_site_nom VARCHAR(100),
    p_site_adresse VARCHAR(255),
    p_household_id VARCHAR(50),
    p_nom_menage VARCHAR(100),
    p_token_number VARCHAR(50),
    p_nombre_beneficiaires INTEGER,
    p_recipient_first_name VARCHAR(50),
    p_recipient_middle_name VARCHAR(50),
    p_recipient_last_name VARCHAR(50),
    p_nom_suppleant VARCHAR(100)
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_site_id UUID;
    v_menage_id UUID;
    v_beneficiaire_principal_id UUID;
    v_beneficiaire_suppleant_id UUID;
    v_site_nom VARCHAR(100);
    v_site_counter INTEGER;
    v_household_id VARCHAR(50);
    v_token_number VARCHAR(50);
BEGIN
    -- Handle default site name
    v_site_nom := COALESCE(NULLIF(TRIM(p_site_nom), ''), 'Site par défaut');
    
    -- If using default site name, append counter if needed
    IF v_site_nom = 'Site par défaut' THEN
        SELECT COUNT(*) + 1 INTO v_site_counter
        FROM sites_distribution
        WHERE nom LIKE 'Site par défaut%';
        
        IF v_site_counter > 1 THEN
            v_site_nom := v_site_nom || ' ' || v_site_counter::TEXT;
        END IF;
    END IF;

    -- Get or create site with conflict handling
    INSERT INTO sites_distribution (
        nom,
        adresse,
        created_by,
        updated_by
    )
    VALUES (
        v_site_nom,
        COALESCE(NULLIF(TRIM(p_site_adresse), ''), 'Adresse non spécifiée'),
        auth.uid(),
        auth.uid()
    )
    ON CONFLICT (nom) DO UPDATE
    SET 
        adresse = EXCLUDED.adresse,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = auth.uid()
    RETURNING id INTO v_site_id;

    -- Generate unique household ID and token number if not provided
    v_household_id := COALESCE(NULLIF(TRIM(p_household_id), ''), 'HH-' || gen_random_uuid()::TEXT);
    v_token_number := COALESCE(NULLIF(TRIM(p_token_number), ''), 'TK-' || gen_random_uuid()::TEXT);

    -- Check if household exists
    SELECT id INTO v_menage_id
    FROM menages
    WHERE household_id = v_household_id;

    IF v_menage_id IS NULL THEN
        -- Create new household
        INSERT INTO menages (
            household_id,
            nom_menage,
            token_number,
            site_distribution_id,
            nombre_beneficiaires,
            statut,
            created_by,
            updated_by
        )
        VALUES (
            v_household_id,
            COALESCE(NULLIF(TRIM(p_nom_menage), ''), 'Ménage ' || gen_random_uuid()::TEXT),
            v_token_number,
            v_site_id,
            COALESCE(NULLIF(p_nombre_beneficiaires, 0), 1),
            'ACTIF',
            auth.uid(),
            auth.uid()
        )
        RETURNING id INTO v_menage_id;

        -- Create principal beneficiary
        INSERT INTO beneficiaires (
            menage_id,
            first_name,
            middle_name,
            last_name,
            est_principal,
            est_actif,
            created_by,
            updated_by
        )
        VALUES (
            v_menage_id,
            COALESCE(NULLIF(TRIM(p_recipient_first_name), ''), 'Prénom'),
            NULLIF(TRIM(p_recipient_middle_name), ''),
            COALESCE(NULLIF(TRIM(p_recipient_last_name), ''), 'Nom'),
            true,
            true,
            auth.uid(),
            auth.uid()
        )
        RETURNING id INTO v_beneficiaire_principal_id;

        -- Create alternate beneficiary if provided
        IF p_nom_suppleant IS NOT NULL AND TRIM(p_nom_suppleant) != '' THEN
            INSERT INTO beneficiaires (
                menage_id,
                first_name,
                last_name,
                est_principal,
                est_actif,
                created_by,
                updated_by
            )
            VALUES (
                v_menage_id,
                TRIM(p_nom_suppleant),
                '',
                false,
                true,
                auth.uid(),
                auth.uid()
            )
            RETURNING id INTO v_beneficiaire_suppleant_id;
        END IF;
    ELSE
        -- Update existing household
        UPDATE menages
        SET 
            nom_menage = COALESCE(NULLIF(TRIM(p_nom_menage), ''), nom_menage),
            token_number = CASE 
                WHEN NULLIF(TRIM(p_token_number), '') IS NOT NULL THEN TRIM(p_token_number)
                ELSE token_number
            END,
            site_distribution_id = v_site_id,
            nombre_beneficiaires = COALESCE(NULLIF(p_nombre_beneficiaires, 0), nombre_beneficiaires),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE id = v_menage_id;

        -- Update principal beneficiary
        UPDATE beneficiaires
        SET 
            first_name = COALESCE(NULLIF(TRIM(p_recipient_first_name), ''), first_name),
            middle_name = NULLIF(TRIM(p_recipient_middle_name), ''),
            last_name = COALESCE(NULLIF(TRIM(p_recipient_last_name), ''), last_name),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE menage_id = v_menage_id AND est_principal = true;

        -- Handle alternate beneficiary
        IF p_nom_suppleant IS NOT NULL AND TRIM(p_nom_suppleant) != '' THEN
            IF EXISTS (SELECT 1 FROM beneficiaires WHERE menage_id = v_menage_id AND est_principal = false) THEN
                UPDATE beneficiaires
                SET 
                    first_name = TRIM(p_nom_suppleant),
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = auth.uid()
                WHERE menage_id = v_menage_id AND est_principal = false;
            ELSE
                INSERT INTO beneficiaires (
                    menage_id,
                    first_name,
                    last_name,
                    est_principal,
                    est_actif,
                    created_by,
                    updated_by
                )
                VALUES (
                    v_menage_id,
                    TRIM(p_nom_suppleant),
                    '',
                    false,
                    true,
                    auth.uid(),
                    auth.uid()
                );
            END IF;
        END IF;
    END IF;

    RETURN v_menage_id;
END;
$$;