-- Données de test pour la base de données
USE gestion_distribution;

-- Sites de test
INSERT INTO sites (nom, adresse, responsable, telephone, email) VALUES 
('Site Kinshasa', 'Avenue de la Libération, Kinshasa', 'Jean Mukendi', '+243123456789', 'kinshasa@distribution.cd'),
('Site Lubumbashi', 'Boulevard Central, Lubumbashi', 'Marie Kabongo', '+243987654321', 'lubumbashi@distribution.cd'),
('Site Goma', 'Rue Principale, Goma', 'Paul Mutombo', '+243456789123', 'goma@distribution.cd');

-- Articles disponibles
INSERT INTO items (nom, description, unite_mesure, quantite_standard, categorie) VALUES 
('Riz', 'Riz blanc de première qualité', 'kg', 5.00, 'Céréales'),
('Huile', 'Huile végétale', 'litre', 2.00, 'Huiles'),
('Haricots', 'Haricots rouges', 'kg', 2.00, 'Légumineuses'),
('Sel', 'Sel iodé', 'kg', 1.00, 'Condiments'),
('Savon', 'Savon de toilette', 'pièce', 3.00, 'Hygiène');

-- Ménages de test
INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires, adresse, telephone, notes) VALUES 
(UUID(), 1, 'Famille Kabongo', 'TOK001', 4, 'Rue des Fleurs 123', '+243111222333', 'Grande famille'),
(UUID(), 1, 'Famille Mutombo', 'TOK002', 3, 'Avenue du Marché 45', '+243444555666', 'Personnes âgées'),
(UUID(), 2, 'Famille Kalala', 'TOK003', 5, 'Boulevard du Commerce 78', '+243777888999', 'Enfants en bas âge');

-- Bénéficiaires de test
INSERT INTO recipients (household_id, first_name, middle_name, last_name, date_naissance, genre, type_piece_identite, numero_piece_identite, is_primary, telephone)
SELECT 
    h.id,
    CASE 
        WHEN h.token_number = 'TOK001' THEN 'Marie'
        WHEN h.token_number = 'TOK002' THEN 'Jean'
        ELSE 'Paul'
    END,
    NULL,
    CASE 
        WHEN h.token_number = 'TOK001' THEN 'Kabongo'
        WHEN h.token_number = 'TOK002' THEN 'Mutombo'
        ELSE 'Kalala'
    END,
    '1980-01-01',
    'F',
    'Carte d''identité',
    CONCAT('ID-', h.token_number),
    1,
    h.telephone
FROM households h;
