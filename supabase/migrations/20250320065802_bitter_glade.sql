/*
  # Update import_household_data function to handle duplicates

  1. Changes
    - Add duplicate handling for household_id
    - Add duplicate handling for token_number
    - Update existing household data if found
    - Return existing household id if found

  2. Security
    - Maintain SECURITY DEFINER
    - Keep search_path restriction
*/

-- Drop and recreate import function with duplicate handling
DROP FUNCTION IF EXISTS import_household_data(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION import_household_data(
    p_site_nom TEXT,
    p_site_adresse TEXT,
    p_household_id TEXT,
    p_nom_menage TEXT,
    p_token_number TEXT,
    p_nombre_beneficiaires INTEGER,
    p_recipient_first_name TEXT,
    p_recipient_middle_name TEXT,
    p_recipient_last_name TEXT,
    p_nom_suppleant TEXT
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_site_id UUID;
    v_menage_id UUID;
    v_beneficiaire_principal_id UUID;
    v_beneficiaire_suppleant_id UUID;
BEGIN
    -- First try to get existing site
    SELECT id INTO v_site_id
    FROM sites_distribution
    WHERE nom = p_site_nom;

    -- If site doesn't exist, create it
    IF v_site_id IS NULL THEN
        INSERT INTO sites_distribution (nom, adresse)
        VALUES (p_site_nom, p_site_adresse)
        RETURNING id INTO v_site_id;
    ELSE
        -- Update existing site address if different
        UPDATE sites_distribution
        SET adresse = p_site_adresse
        WHERE id = v_site_id AND adresse != p_site_adresse;
    END IF;

    -- Check if household already exists
    SELECT id INTO v_menage_id
    FROM menages
    WHERE household_id = p_household_id;

    IF v_menage_id IS NULL THEN
        -- Create new household if it doesn't exist
        INSERT INTO menages (household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires)
        VALUES (p_household_id, p_nom_menage, p_token_number, v_site_id, p_nombre_beneficiaires)
        RETURNING id INTO v_menage_id;

        -- Create principal beneficiary
        INSERT INTO beneficiaires (menage_id, first_name, middle_name, last_name, est_principal)
        VALUES (v_menage_id, p_recipient_first_name, p_recipient_middle_name, p_recipient_last_name, true)
        RETURNING id INTO v_beneficiaire_principal_id;

        -- Create alternate beneficiary if provided
        IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
            INSERT INTO beneficiaires (menage_id, first_name, middle_name, last_name, est_principal)
            VALUES (v_menage_id, p_nom_suppleant, NULL, '', false)
            RETURNING id INTO v_beneficiaire_suppleant_id;
        END IF;
    ELSE
        -- Update existing household
        UPDATE menages
        SET 
            nom_menage = p_nom_menage,
            token_number = p_token_number,
            site_distribution_id = v_site_id,
            nombre_beneficiaires = p_nombre_beneficiaires,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_menage_id;

        -- Update principal beneficiary
        UPDATE beneficiaires
        SET 
            first_name = p_recipient_first_name,
            middle_name = p_recipient_middle_name,
            last_name = p_recipient_last_name,
            updated_at = CURRENT_TIMESTAMP
        WHERE menage_id = v_menage_id AND est_principal = true;

        -- Handle alternate beneficiary
        IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
            -- Update existing alternate or create new one
            IF EXISTS (SELECT 1 FROM beneficiaires WHERE menage_id = v_menage_id AND est_principal = false) THEN
                UPDATE beneficiaires
                SET 
                    first_name = p_nom_suppleant,
                    updated_at = CURRENT_TIMESTAMP
                WHERE menage_id = v_menage_id AND est_principal = false;
            ELSE
                INSERT INTO beneficiaires (menage_id, first_name, middle_name, last_name, est_principal)
                VALUES (v_menage_id, p_nom_suppleant, NULL, '', false);
            END IF;
        ELSE
            -- Remove alternate beneficiary if it exists
            DELETE FROM beneficiaires
            WHERE menage_id = v_menage_id AND est_principal = false;
        END IF;
    END IF;

    RETURN v_menage_id;
END;
$$;