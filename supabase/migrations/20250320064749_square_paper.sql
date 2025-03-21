/*
  # Fix import function and add policies

  1. Changes
    - Add insert/update policies for authenticated users
    - Modify import_household_data function to handle conflicts properly

  2. Security
    - Add insert/update policies for all tables
*/

-- Add insert/update policies for authenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sites_distribution;
CREATE POLICY "Enable insert for authenticated users" ON sites_distribution
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON sites_distribution;
CREATE POLICY "Enable update for authenticated users" ON sites_distribution
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON menages;
CREATE POLICY "Enable insert for authenticated users" ON menages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON beneficiaires;
CREATE POLICY "Enable insert for authenticated users" ON beneficiaires
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON distributions;
CREATE POLICY "Enable insert for authenticated users" ON distributions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Drop and recreate import function with proper conflict handling
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
) RETURNS UUID AS $$
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

    -- Create household
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

    RETURN v_menage_id;
END;
$$ LANGUAGE plpgsql;