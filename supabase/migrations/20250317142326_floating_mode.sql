/*
  # Initial Schema Setup for PAM Distribution Management

  1. New Tables
    - `sites_distribution`
      - `id` (uuid, primary key)
      - `nom` (text, site name)
      - `adresse` (text, site address)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `menages`
      - `id` (uuid, primary key)
      - `household_id` (text, unique identifier)
      - `nom_menage` (text, household name)
      - `token_number` (text, unique token)
      - `site_distribution_id` (uuid, foreign key)
      - `nombre_beneficiaires` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `beneficiaires`
      - `id` (uuid, primary key)
      - `menage_id` (uuid, foreign key)
      - `first_name` (text)
      - `middle_name` (text)
      - `last_name` (text)
      - `est_principal` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `distributions`
      - `id` (uuid, primary key)
      - `menage_id` (uuid, foreign key)
      - `date_distribution` (timestamp)
      - `signature` (text, base64 signature data)
      - `beneficiaire_id` (uuid, foreign key, who received)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Update timestamps trigger
    - Import data function
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sites_distribution table
CREATE TABLE sites_distribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_sites_distribution_updated_at
    BEFORE UPDATE ON sites_distribution
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create menages table
CREATE TABLE menages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id TEXT UNIQUE NOT NULL,
    nom_menage TEXT NOT NULL,
    token_number TEXT UNIQUE NOT NULL,
    site_distribution_id UUID NOT NULL REFERENCES sites_distribution(id),
    nombre_beneficiaires INTEGER NOT NULL CHECK (nombre_beneficiaires > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_menages_updated_at
    BEFORE UPDATE ON menages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create beneficiaires table
CREATE TABLE beneficiaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menage_id UUID NOT NULL REFERENCES menages(id),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    est_principal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_beneficiaires_updated_at
    BEFORE UPDATE ON beneficiaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create distributions table
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menage_id UUID NOT NULL REFERENCES menages(id),
    date_distribution TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature TEXT NOT NULL,
    beneficiaire_id UUID NOT NULL REFERENCES beneficiaires(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE sites_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE menages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON sites_distribution
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON menages
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON beneficiaires
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON distributions
    FOR SELECT
    TO authenticated
    USING (true);

-- Create indexes for better performance
CREATE INDEX idx_menages_household_id ON menages(household_id);
CREATE INDEX idx_menages_token_number ON menages(token_number);
CREATE INDEX idx_beneficiaires_menage_id ON beneficiaires(menage_id);
CREATE INDEX idx_distributions_menage_id ON distributions(menage_id);
CREATE INDEX idx_distributions_date ON distributions(date_distribution);

-- Create function to import data
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
    -- Get or create site
    INSERT INTO sites_distribution (nom, adresse)
    VALUES (p_site_nom, p_site_adresse)
    ON CONFLICT (nom) DO UPDATE SET adresse = EXCLUDED.adresse
    RETURNING id INTO v_site_id;

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