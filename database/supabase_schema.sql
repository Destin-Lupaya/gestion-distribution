-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE distribution_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- Create sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create households table
CREATE TABLE households (
    id VARCHAR(50) PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id),
    nom_menage VARCHAR(255) NOT NULL,
    token_number VARCHAR(50) NOT NULL UNIQUE,
    nombre_beneficiaires INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipients table
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id VARCHAR(50) NOT NULL REFERENCES households(id),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create signatures table
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id VARCHAR(50) NOT NULL REFERENCES households(id),
    recipient_id UUID NOT NULL REFERENCES recipients(id),
    signature_data TEXT NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create distributions table
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id VARCHAR(50) NOT NULL REFERENCES households(id),
    recipient_id UUID NOT NULL REFERENCES recipients(id),
    signature_id UUID NOT NULL REFERENCES signatures(id),
    distribution_date TIMESTAMPTZ DEFAULT NOW(),
    status distribution_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    action audit_action NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_households_site ON households(site_id);
CREATE INDEX idx_households_token ON households(token_number);
CREATE INDEX idx_recipients_household ON recipients(household_id);
CREATE INDEX idx_signatures_household ON signatures(household_id);
CREATE INDEX idx_distributions_household ON distributions(household_id);
CREATE INDEX idx_distributions_status ON distributions(status);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);

-- Create view for household details
CREATE OR REPLACE VIEW v_household_details AS
SELECT 
    h.id AS household_id,
    h.nom_menage,
    h.token_number,
    h.nombre_beneficiaires,
    s.nom AS site_distribution,
    s.adresse,
    r.first_name AS recipient_first_name,
    r.middle_name AS recipient_middle_name,
    r.last_name AS recipient_last_name,
    (
        SELECT first_name 
        FROM recipients 
        WHERE household_id = h.id 
        AND is_primary = FALSE 
        LIMIT 1
    ) AS nom_suppleant
FROM households h
JOIN sites s ON h.site_id = s.id
JOIN recipients r ON h.id = r.household_id AND r.is_primary = TRUE;

-- Create function for importing household data
CREATE OR REPLACE FUNCTION import_household_data(
    p_site_nom VARCHAR(255),
    p_site_adresse TEXT,
    p_household_id VARCHAR(50),
    p_nom_menage VARCHAR(255),
    p_token_number VARCHAR(50),
    p_nombre_beneficiaires INTEGER,
    p_recipient_first_name VARCHAR(100),
    p_recipient_middle_name VARCHAR(100),
    p_recipient_last_name VARCHAR(100),
    p_nom_suppleant VARCHAR(100)
) RETURNS UUID AS $$
DECLARE
    v_site_id UUID;
    v_recipient_id UUID;
BEGIN
    -- Get or create site
    INSERT INTO sites (nom, adresse)
    VALUES (p_site_nom, p_site_adresse)
    ON CONFLICT (nom) DO UPDATE 
    SET adresse = EXCLUDED.adresse
    RETURNING id INTO v_site_id;
    
    -- Create household
    INSERT INTO households (
        id, site_id, nom_menage, token_number, nombre_beneficiaires
    ) VALUES (
        p_household_id, v_site_id, p_nom_menage, p_token_number, p_nombre_beneficiaires
    );
    
    -- Create primary recipient
    INSERT INTO recipients (
        household_id, first_name, middle_name, last_name, is_primary
    ) VALUES (
        p_household_id, 
        p_recipient_first_name, 
        p_recipient_middle_name, 
        p_recipient_last_name,
        TRUE
    )
    RETURNING id INTO v_recipient_id;
    
    -- Create alternate recipient if provided
    IF p_nom_suppleant IS NOT NULL AND p_nom_suppleant != '' THEN
        INSERT INTO recipients (
            household_id, first_name, is_primary
        ) VALUES (
            p_household_id, p_nom_suppleant, FALSE
        );
    END IF;
    
    RETURN v_recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for recording signatures
CREATE OR REPLACE FUNCTION record_signature(
    p_household_id VARCHAR(50),
    p_signature_data TEXT
) RETURNS UUID AS $$
DECLARE
    v_recipient_id UUID;
    v_signature_id UUID;
BEGIN
    -- Get primary recipient ID
    SELECT id INTO v_recipient_id
    FROM recipients
    WHERE household_id = p_household_id AND is_primary = TRUE
    LIMIT 1;
    
    -- Record signature
    INSERT INTO signatures (
        household_id, recipient_id, signature_data
    ) VALUES (
        p_household_id, v_recipient_id, p_signature_data
    )
    RETURNING id INTO v_signature_id;
    
    -- Create distribution record
    INSERT INTO distributions (
        household_id, recipient_id, signature_id, status
    ) VALUES (
        p_household_id, v_recipient_id, v_signature_id, 'completed'
    );
    
    RETURN v_signature_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON sites
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON households
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON recipients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON signatures
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON distributions
    FOR SELECT TO authenticated USING (true);

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_sites_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sites
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_households_trigger
    AFTER INSERT OR UPDATE OR DELETE ON households
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_recipients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON recipients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_signatures_trigger
    AFTER INSERT OR UPDATE OR DELETE ON signatures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_distributions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON distributions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
