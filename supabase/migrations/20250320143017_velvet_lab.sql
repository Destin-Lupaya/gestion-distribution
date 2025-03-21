/*
  # Enhance validation and error handling

  1. Changes
    - Add more robust input validation
    - Improve error messages
    - Handle empty strings and NULL values consistently
    - Add validation for required fields
*/

-- Drop existing function
DROP FUNCTION IF EXISTS import_household_data(varchar, varchar, varchar, varchar, varchar, integer, varchar, varchar, varchar, varchar);

-- Recreate function with enhanced validation
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
BEGIN
    -- Validate required inputs with better error messages
    IF p_site_nom IS NULL OR trim(p_site_nom) = '' THEN
        RAISE EXCEPTION 'Le nom du site ne peut pas être vide';
    END IF;

    IF p_household_id IS NULL OR trim(p_household_id) = '' THEN
        RAISE EXCEPTION 'L''ID du ménage ne peut pas être vide';
    END IF;

    IF p_nom_menage IS NULL OR trim(p_nom_menage) = '' THEN
        RAISE EXCEPTION 'Le nom du ménage ne peut pas être vide';
    END IF;

    IF p_token_number IS NULL OR trim(p_token_number) = '' THEN
        RAISE EXCEPTION 'Le numéro de token ne peut pas être vide';
    END IF;

    IF p_nombre_beneficiaires IS NULL OR p_nombre_beneficiaires <= 0 THEN
        RAISE EXCEPTION 'Le nombre de bénéficiaires doit être supérieur à 0';
    END IF;

    IF p_recipient_first_name IS NULL OR trim(p_recipient_first_name) = '' THEN
        RAISE EXCEPTION 'Le prénom du bénéficiaire principal ne peut pas être vide';
    END IF;

    IF p_recipient_last_name IS NULL OR trim(p_recipient_last_name) = '' THEN
        RAISE EXCEPTION 'Le nom de famille du bénéficiaire principal ne peut pas être vide';
    END IF;

    -- Get or create site
    SELECT id INTO v_site_id
    FROM sites_distribution
    WHERE nom = trim(p_site_nom);

    IF v_site_id IS NULL THEN
        INSERT INTO sites_distribution (nom, adresse, created_by, updated_by)
        VALUES (
            trim(p_site_nom),
            COALESCE(trim(p_site_adresse), ''),
            auth.uid(),
            auth.uid()
        )
        RETURNING id INTO v_site_id;
    ELSE
        UPDATE sites_distribution
        SET 
            adresse = COALESCE(trim(p_site_adresse), adresse),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE id = v_site_id;
    END IF;

    -- Check for existing household
    SELECT id INTO v_menage_id
    FROM menages
    WHERE household_id = trim(p_household_id);

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
            trim(p_household_id),
            trim(p_nom_menage),
            trim(p_token_number),
            v_site_id,
            p_nombre_beneficiaires,
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
            trim(p_recipient_first_name),
            NULLIF(trim(p_recipient_middle_name), ''),
            trim(p_recipient_last_name),
            true,
            true,
            auth.uid(),
            auth.uid()
        )
        RETURNING id INTO v_beneficiaire_principal_id;

        -- Create alternate beneficiary if provided
        IF p_nom_suppleant IS NOT NULL AND trim(p_nom_suppleant) != '' THEN
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
                trim(p_nom_suppleant),
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
            nom_menage = trim(p_nom_menage),
            token_number = trim(p_token_number),
            site_distribution_id = v_site_id,
            nombre_beneficiaires = p_nombre_beneficiaires,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE id = v_menage_id;

        -- Update principal beneficiary
        UPDATE beneficiaires
        SET 
            first_name = trim(p_recipient_first_name),
            middle_name = NULLIF(trim(p_recipient_middle_name), ''),
            last_name = trim(p_recipient_last_name),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE menage_id = v_menage_id AND est_principal = true;

        -- Handle alternate beneficiary
        IF p_nom_suppleant IS NOT NULL AND trim(p_nom_suppleant) != '' THEN
            -- Update or create alternate beneficiary
            IF EXISTS (SELECT 1 FROM beneficiaires WHERE menage_id = v_menage_id AND est_principal = false) THEN
                UPDATE beneficiaires
                SET 
                    first_name = trim(p_nom_suppleant),
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
                    trim(p_nom_suppleant),
                    '',
                    false,
                    true,
                    auth.uid(),
                    auth.uid()
                );
            END IF;
        ELSE
            -- Remove alternate beneficiary if it exists
            UPDATE beneficiaires
            SET 
                est_actif = false,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = auth.uid()
            WHERE menage_id = v_menage_id AND est_principal = false;
        END IF;
    END IF;

    RETURN v_menage_id;
END;
$$;