const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });
const { v4: uuidv4 } = require('uuid');

async function seed() {
    const config = {
        host: process.env.VITE_DB_HOST,
        user: process.env.VITE_DB_USER,
        password: process.env.VITE_DB_PASSWORD,
        database: 'gestion_distribution'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to database');

        // Insertion des sites de test
        console.log('Seeding sites...');
        const [siteResults] = await connection.query(`
            INSERT INTO sites (nom, adresse) VALUES 
            ('Site Kinshasa', 'Avenue de la Libération, Kinshasa'),
            ('Site Lubumbashi', 'Boulevard Central, Lubumbashi'),
            ('Site Goma', 'Rue Principale, Goma')
        `);

        // Insertion des ménages de test
        console.log('Seeding households...');
        for (let i = 1; i <= 3; i++) {
            const siteId = i;
            for (let j = 1; j <= 5; j++) {
                const householdId = uuidv4();
                await connection.query(`
                    INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    householdId,
                    siteId,
                    `Ménage ${i}-${j}`,
                    `TOKEN-${i}${j}`,
                    Math.floor(Math.random() * 4) + 1
                ]);

                // Insertion des bénéficiaires pour chaque ménage
                const numRecipients = Math.floor(Math.random() * 3) + 1;
                for (let k = 1; k <= numRecipients; k++) {
                    const [recipientResult] = await connection.query(`
                        INSERT INTO recipients (household_id, first_name, middle_name, last_name, is_primary)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        householdId,
                        `Prénom${k}`,
                        k === 1 ? 'Middle' : null,
                        `Nom${i}${j}`,
                        k === 1
                    ]);

                    // Ajout d'une signature pour le bénéficiaire principal
                    if (k === 1) {
                        const [signatureResult] = await connection.query(`
                            INSERT INTO signatures (household_id, recipient_id, signature_data)
                            VALUES (?, ?, ?)
                        `, [
                            householdId,
                            recipientResult.insertId,
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
                        ]);

                        // Création d'une distribution
                        await connection.query(`
                            INSERT INTO distributions (household_id, recipient_id, signature_id, status)
                            VALUES (?, ?, ?, ?)
                        `, [
                            householdId,
                            recipientResult.insertId,
                            signatureResult.insertId,
                            Math.random() > 0.3 ? 'completed' : 'pending'
                        ]);
                    }
                }
            }
        }

        console.log('Seeding completed successfully');
        await connection.end();

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seed();
