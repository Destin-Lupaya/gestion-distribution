USE gestion_distribution;

-- Insert additional test sites
INSERT INTO sites (nom, adresse) VALUES
('Zone B', 'Avenue Principale, Quartier Commercial'),
('Zone C', 'Route du Marché, Quartier Résidentiel'),
('Zone D', 'Rue des Écoles, Quartier Central');

-- Insert test items
INSERT INTO items (nom, description, unite_mesure) VALUES
('Riz', 'Riz de première qualité', 'kg'),
('Huile', 'Huile végétale', 'litre'),
('Farine', 'Farine de blé', 'kg'),
('Sucre', 'Sucre blanc', 'kg'),
('Sel', 'Sel iodé', 'kg'),
('Savon', 'Savon de toilette', 'pièce'),
('Couverture', 'Couverture chaude', 'pièce'),
('Kit Hygiène', 'Kit hygiène de base', 'kit');

-- Insert additional test households
INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires) VALUES
('TEST004', 2, 'Famille Keita', 'TK004', 6),
('TEST005', 2, 'Famille Sylla', 'TK005', 4),
('TEST006', 3, 'Famille Barry', 'TK006', 5),
('TEST007', 3, 'Famille Bah', 'TK007', 3),
('TEST008', 4, 'Famille Sow', 'TK008', 7),
('TEST009', 4, 'Famille Diallo', 'TK009', 4),
('TEST010', 4, 'Famille Camara', 'TK010', 5);

-- Insert additional recipients with age groups
INSERT INTO recipients (household_id, first_name, middle_name, last_name, is_primary, age_group_id) VALUES
-- Famille Keita
('TEST004', 'Moussa', NULL, 'Keita', TRUE, 3),
('TEST004', 'Aminata', NULL, 'Keita', FALSE, 2),
-- Famille Sylla
('TEST005', 'Oumar', NULL, 'Sylla', TRUE, 3),
('TEST005', 'Aissata', NULL, 'Sylla', FALSE, 1),
-- Famille Barry
('TEST006', 'Mamadou', NULL, 'Barry', TRUE, 4),
('TEST006', 'Kadiatou', NULL, 'Barry', FALSE, 2),
-- Famille Bah
('TEST007', 'Ibrahima', NULL, 'Bah', TRUE, 3),
-- Famille Sow
('TEST008', 'Souleymane', NULL, 'Sow', TRUE, 3),
('TEST008', 'Mariame', NULL, 'Sow', FALSE, 2),
-- Famille Diallo
('TEST009', 'Abdoulaye', NULL, 'Diallo', TRUE, 4),
-- Famille Camara
('TEST010', 'Fatoumata', NULL, 'Camara', TRUE, 2);

-- Insert test signatures
INSERT INTO signatures (household_id, recipient_id, signature_data) VALUES
('TEST004', 8, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'),
('TEST005', 10, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'),
('TEST006', 12, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');

-- Insert test distributions
INSERT INTO distributions (household_id, recipient_id, signature_id, distribution_date, status) VALUES
('TEST004', 8, 1, DATE_SUB(NOW(), INTERVAL 7 DAY), 'completed'),
('TEST005', 10, 2, DATE_SUB(NOW(), INTERVAL 6 DAY), 'completed'),
('TEST006', 12, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), 'completed'),
('TEST007', 14, NULL, NOW(), 'pending'),
('TEST008', 15, NULL, NOW(), 'pending');

-- Insert test distribution items
INSERT INTO distribution_items (distribution_id, item_id, quantite) VALUES
-- Distribution pour TEST004
(1, 1, 25.0),  -- 25kg de riz
(1, 2, 5.0),   -- 5L d'huile
(1, 3, 10.0),  -- 10kg de farine
(1, 6, 5.0),   -- 5 savons
-- Distribution pour TEST005
(2, 1, 20.0),  -- 20kg de riz
(2, 2, 4.0),   -- 4L d'huile
(2, 3, 8.0),   -- 8kg de farine
(2, 6, 4.0),   -- 4 savons
-- Distribution pour TEST006
(3, 1, 25.0),  -- 25kg de riz
(3, 2, 5.0),   -- 5L d'huile
(3, 3, 10.0),  -- 10kg de farine
(3, 6, 5.0),   -- 5 savons
(3, 7, 2.0);   -- 2 couvertures

-- Insert audit logs
INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id) VALUES
('households', 'TEST004', 'insert', NULL, '{"id": "TEST004", "nom_menage": "Famille Keita"}', 'SYSTEM'),
('distributions', '1', 'update', '{"status": "pending"}', '{"status": "completed"}', 'SYSTEM'),
('recipients', '8', 'update', '{"age_group_id": null}', '{"age_group_id": 3}', 'SYSTEM');

-- Exemple d'utilisation des procédures stockées
CALL generate_distribution_report(
    DATE_SUB(NOW(), INTERVAL 30 DAY),
    NOW(),
    NULL
);

-- Exemple d'utilisation des fonctions QR
SELECT * FROM process_qr_scan('{"id": "TEST004"}'::JSONB);
SELECT * FROM check_qr_status('TEST004');
