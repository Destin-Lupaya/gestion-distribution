/*
  # Fix duplicate site default value handling

  1. Changes
    - Add unique constraint handling for default site
    - Update import_household_data function to handle default site properly
    - Add ON CONFLICT clause for site creation
*/

-- Drop existing function
DROP FUNCTION IF EXISTS import_household_data(varchar, varchar, varchar, varchar, varchar, integer, varchar, varchar, varchar, varchar);

-- Recreate function with proper default site handling
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

    -- Create new household with generated values if needed
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
        COALESCE(NULLIF(TRIM(p_household_id), ''), 'HH-' || gen_random_uuid()::TEXT),
        COALESCE(NULLIF(TRIM(p_nom_menage), ''), 'Ménage ' || gen_random_uuid()::TEXT),
        COALESCE(NULLIF(TRIM(p_token_number), ''), 'TK-' || gen_random_uuid()::TEXT),
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

    RETURN v_menage_id;
END;
$$;