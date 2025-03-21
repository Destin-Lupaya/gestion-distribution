/*
  # Update Schema to Use VARCHAR for Text Fields

  1. Changes
    - Convert TEXT fields to VARCHAR
    - Adjust column types for better data management
    - Maintain existing functionality and constraints

  2. Security
    - Maintain existing RLS policies
    - Keep audit logging functionality
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS distributions CASCADE;
DROP TABLE IF EXISTS beneficiaires CASCADE;
DROP TABLE IF EXISTS menages CASCADE;
DROP TABLE IF EXISTS sites_distribution CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sync_status CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit log function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create sites_distribution table
CREATE TABLE sites_distribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    adresse VARCHAR(255) NOT NULL,
    coordonnees_gps POINT,
    responsable_nom VARCHAR(100),
    responsable_contact VARCHAR(50),
    est_actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create menages table
CREATE TABLE menages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id VARCHAR(50) UNIQUE NOT NULL,
    nom_menage VARCHAR(100) NOT NULL,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    site_distribution_id UUID NOT NULL REFERENCES sites_distribution(id),
    nombre_beneficiaires INTEGER NOT NULL CHECK (nombre_beneficiaires > 0),
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('ACTIF', 'INACTIF', 'SUSPENDU')),
    derniere_distribution TIMESTAMPTZ,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create beneficiaires table
CREATE TABLE beneficiaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menage_id UUID NOT NULL REFERENCES menages(id),
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    date_naissance DATE,
    genre VARCHAR(1) CHECK (genre IN ('M', 'F')),
    type_piece_identite VARCHAR(50),
    numero_piece_identite VARCHAR(50),
    est_principal BOOLEAN NOT NULL DEFAULT false,
    est_actif BOOLEAN NOT NULL DEFAULT true,
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create distributions table
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menage_id UUID NOT NULL REFERENCES menages(id),
    beneficiaire_id UUID NOT NULL REFERENCES beneficiaires(id),
    date_distribution TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature VARCHAR(2000) NOT NULL,
    quantite_distribuee NUMERIC(10,2) NOT NULL,
    type_ration VARCHAR(50) NOT NULL,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('COMPLETEE', 'ANNULEE', 'EN_ATTENTE')),
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create sync_status table
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('PENDING', 'SYNCED', 'ERROR')),
    last_sync_attempt TIMESTAMPTZ,
    error_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_menages_household_id ON menages(household_id);
CREATE INDEX idx_menages_token_number ON menages(token_number);
CREATE INDEX idx_beneficiaires_menage_id ON beneficiaires(menage_id);
CREATE INDEX idx_distributions_menage_id ON distributions(menage_id);
CREATE INDEX idx_distributions_date ON distributions(date_distribution);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_sync_status_record ON sync_status(record_type, record_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sites_distribution_updated_at
    BEFORE UPDATE ON sites_distribution
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menages_updated_at
    BEFORE UPDATE ON menages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaires_updated_at
    BEFORE UPDATE ON beneficiaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at
    BEFORE UPDATE ON sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit triggers
CREATE TRIGGER audit_sites_distribution
    AFTER INSERT OR UPDATE OR DELETE ON sites_distribution
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_menages
    AFTER INSERT OR UPDATE OR DELETE ON menages
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_beneficiaires
    AFTER INSERT OR UPDATE OR DELETE ON beneficiaires
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_distributions
    AFTER INSERT OR UPDATE OR DELETE ON distributions
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Enable Row Level Security
ALTER TABLE sites_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE menages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable all operations for authenticated users" ON sites_distribution
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON menages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON beneficiaires
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON distributions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON audit_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON sync_status
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create import function with enhanced validation
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
    -- Validate inputs
    IF p_nombre_beneficiaires <= 0 THEN
        RAISE EXCEPTION 'Le nombre de bénéficiaires doit être supérieur à 0';
    END IF;

    -- Get or create site
    SELECT id INTO v_site_id
    FROM sites_distribution
    WHERE nom = p_site_nom;

    IF v_site_id IS NULL THEN
        INSERT INTO sites_distribution (nom, adresse, created_by, updated_by)
        VALUES (p_site_nom, p_site_adresse, auth.uid(), auth.uid())
        RETURNING id INTO v_site_id;
    ELSE
        UPDATE sites_distribution
        SET 
            adresse = p_site_adresse,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE id = v_site_id;
    END IF;

    -- Check for existing household
    SELECT id INTO v_menage_id
    FROM menages
    WHERE household_id = p_household_id;

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
            p_household_id,
            p_nom_menage,
            p_token_number,
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
            p_recipient_first_name,
            p_recipient_middle_name,
            p_recipient_last_name,
            true,
            true,
            auth.uid(),
            auth.uid()
        )
        RETURNING id INTO v_beneficiaire_principal_id;

        -- Create alternate beneficiary if provided
        IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
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
                p_nom_suppleant,
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
            nom_menage = p_nom_menage,
            token_number = p_token_number,
            site_distribution_id = v_site_id,
            nombre_beneficiaires = p_nombre_beneficiaires,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE id = v_menage_id;

        -- Update principal beneficiary
        UPDATE beneficiaires
        SET 
            first_name = p_recipient_first_name,
            middle_name = p_recipient_middle_name,
            last_name = p_recipient_last_name,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = auth.uid()
        WHERE menage_id = v_menage_id AND est_principal = true;

        -- Handle alternate beneficiary
        IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
            -- Update or create alternate beneficiary
            IF EXISTS (SELECT 1 FROM beneficiaires WHERE menage_id = v_menage_id AND est_principal = false) THEN
                UPDATE beneficiaires
                SET 
                    first_name = p_nom_suppleant,
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
                    p_nom_suppleant,
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