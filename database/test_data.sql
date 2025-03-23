-- Insert test site
INSERT INTO sites (id, nom, adresse)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Zone A', 'Rue 123, Quartier Test');

-- Insert test households
INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires)
VALUES
  ('TEST001', '11111111-1111-1111-1111-111111111111', 'Famille Diallo', 'TK001', 4),
  ('TEST002', '11111111-1111-1111-1111-111111111111', 'Famille Camara', 'TK002', 3),
  ('TEST003', '11111111-1111-1111-1111-111111111111', 'Famille Toure', 'TK003', 5);

-- Insert test recipients
INSERT INTO recipients (id, household_id, first_name, middle_name, last_name, is_primary)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'TEST001', 'Amadou', NULL, 'Diallo', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'TEST001', 'Fatima', NULL, 'Diallo', FALSE),
  ('44444444-4444-4444-4444-444444444444', 'TEST002', 'Ibrahim', NULL, 'Camara', TRUE),
  ('55555555-5555-5555-5555-555555555555', 'TEST003', 'Mariama', NULL, 'Toure', TRUE);
