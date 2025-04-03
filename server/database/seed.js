const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });
const { v4: uuidv4 } = require('uuid');

async function seed() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'gestion_distribution'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connecté à la base de données');

        // Insertion des articles disponibles
        console.log('Ajout des articles...');
        await connection.query(`
            INSERT INTO items (nom, description, unite_mesure, quantite_standard, categorie) VALUES 
            ('Riz', 'Riz blanc de première qualité', 'kg', 5.00, 'Céréales'),
            ('Huile', 'Huile végétale', 'litre', 2.00, 'Huiles'),
            ('Haricots', 'Haricots rouges', 'kg', 2.00, 'Légumineuses'),
            ('Sel', 'Sel iodé', 'kg', 1.00, 'Condiments'),
            ('Savon', 'Savon de toilette', 'pièce', 3.00, 'Hygiène')
        `);

        // Insertion des sites
        console.log('Ajout des sites...');
        const [siteResults] = await connection.query(`
            INSERT INTO sites (nom, adresse, responsable, telephone, email) VALUES 
            ('Site Kinshasa', 'Avenue de la Libération, Kinshasa', 'Jean Mukendi', '+243123456789', 'kinshasa@distribution.cd'),
            ('Site Lubumbashi', 'Boulevard Central, Lubumbashi', 'Marie Kabongo', '+243987654321', 'lubumbashi@distribution.cd'),
            ('Site Goma', 'Rue Principale, Goma', 'Paul Mutombo', '+243456789123', 'goma@distribution.cd')
        `);

        // Insertion des ménages et bénéficiaires
        console.log('Ajout des ménages et bénéficiaires...');
        for (let i = 1; i <= 3; i++) {
            const siteId = i;
            for (let j = 1; j <= 5; j++) {
                const householdId = uuidv4();
                await connection.query(`
                    INSERT INTO households (
                        id, site_id, nom_menage, token_number, 
                        nombre_beneficiaires, adresse, telephone, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    householdId,
                    siteId,
                    `Ménage ${i}-${j}`,
                    `TOKEN-${i}${j}`,
                    Math.floor(Math.random() * 4) + 1,
                    `Adresse du ménage ${i}-${j}`,
                    `+24399${i}${j}${j}${i}${i}${j}`,
                    `Notes pour le ménage ${i}-${j}`
                ]);

                // Bénéficiaires pour chaque ménage
                const numRecipients = Math.floor(Math.random() * 3) + 1;
                for (let k = 1; k <= numRecipients; k++) {
                    const [recipientResult] = await connection.query(`
                        INSERT INTO recipients (
                            household_id, first_name, middle_name, last_name,
                            date_naissance, genre, type_piece_identite,
                            numero_piece_identite, is_primary, telephone
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        householdId,
                        `Prénom${k}`,
                        k === 1 ? 'Middle' : null,
                        `Nom${i}${j}`,
                        '1980-01-01',
                        k % 2 === 0 ? 'F' : 'M',
                        'Carte d\'identité',
                        `ID-${i}${j}${k}`,
                        k === 1,
                        `+24398${k}${i}${j}${j}${i}${k}`
                    ]);

                    if (k === 1) {
                        // Signature pour le bénéficiaire principal
                        const [signatureResult] = await connection.query(`
                            INSERT INTO signatures (
                                household_id, recipient_id, signature_data,
                                type_signature, ip_address, device_info
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            householdId,
                            recipientResult.insertId,
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
                            'manuscrite',
                            '127.0.0.1',
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        ]);

                        // Distribution
                        const [distributionResult] = await connection.query(`
                            INSERT INTO distributions (
                                household_id, recipient_id, signature_id,
                                status, created_by
                            ) VALUES (?, ?, ?, ?, ?)
                        `, [
                            householdId,
                            recipientResult.insertId,
                            signatureResult.insertId,
                            Math.random() > 0.3 ? 'completed' : 'pending',
                            'System'
                        ]);

                        // Articles distribués
                        for (let itemId = 1; itemId <= 5; itemId++) {
                            if (Math.random() > 0.3) {
                                await connection.query(`
                                    INSERT INTO distribution_items (
                                        distribution_id, item_id, quantite
                                    ) VALUES (?, ?, ?)
                                `, [
                                    distributionResult.insertId,
                                    itemId,
                                    Math.floor(Math.random() * 3) + 1
                                ]);
                            }
                        }
                    }
                }
            }
        }

        console.log('Données de test ajoutées avec succès');
        await connection.end();

    } catch (error) {
        console.error('Erreur lors de l\'ajout des données de test:', error);
        process.exit(1);
    }
}

seed();
