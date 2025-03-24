USE gestion_distribution;

-- Insert test site
INSERT INTO sites (nom, adresse)
VALUES ('Zone A', 'Rue 123, Quartier Test');

-- Insert test households
INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires)
VALUES
  ('TEST001', 1, 'Famille Diallo', 'TK001', 4),
  ('TEST002', 1, 'Famille Camara', 'TK002', 3),
  ('TEST003', 1, 'Famille Toure', 'TK003', 5);

-- Insert test recipients
INSERT INTO recipients (household_id, first_name, middle_name, last_name, is_primary)
VALUES
  ('TEST001', 'Amadou', NULL, 'Diallo', TRUE),
  ('TEST001', 'Fatima', NULL, 'Diallo', FALSE),
  ('TEST002', 'Ibrahim', NULL, 'Camara', TRUE),
  ('TEST003', 'Mariama', NULL, 'Toure', TRUE);
