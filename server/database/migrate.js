const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

async function migrate() {
    // Configuration des connexions
    const sourceConfig = {
        host: process.env.VITE_DB_HOST,
        user: process.env.VITE_DB_USER,
        password: process.env.VITE_DB_PASSWORD,
        database: 'benefapp'
    };

    const targetConfig = {
        host: process.env.VITE_DB_HOST,
        user: process.env.VITE_DB_USER,
        password: process.env.VITE_DB_PASSWORD,
        database: 'gestion_distribution'
    };

    try {
        // Connexion aux bases de données
        const sourceConn = await mysql.createConnection(sourceConfig);
        const targetConn = await mysql.createConnection(targetConfig);

        console.log('Connected to databases');

        // Migration des sites
        console.log('Migrating sites...');
        const [sites] = await sourceConn.query('SELECT * FROM sites');
        for (const site of sites) {
            await targetConn.query(
                'INSERT INTO sites (id, nom, adresse, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [site.id, site.nom, site.adresse, site.created_at, site.updated_at]
            );
        }

        // Migration des ménages
        console.log('Migrating households...');
        const [households] = await sourceConn.query('SELECT * FROM households');
        for (const household of households) {
            await targetConn.query(
                'INSERT INTO households (id, site_id, nom_menage, token_number, nombre_beneficiaires, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [household.id, household.site_id, household.nom_menage, household.token_number, household.nombre_beneficiaires, household.created_at, household.updated_at]
            );
        }

        // Migration des bénéficiaires
        console.log('Migrating recipients...');
        const [recipients] = await sourceConn.query('SELECT * FROM recipients');
        for (const recipient of recipients) {
            await targetConn.query(
                'INSERT INTO recipients (id, household_id, first_name, middle_name, last_name, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [recipient.id, recipient.household_id, recipient.first_name, recipient.middle_name, recipient.last_name, recipient.is_primary, recipient.created_at, recipient.updated_at]
            );
        }

        // Migration des signatures
        console.log('Migrating signatures...');
        const [signatures] = await sourceConn.query('SELECT * FROM signatures');
        for (const signature of signatures) {
            await targetConn.query(
                'INSERT INTO signatures (id, household_id, recipient_id, signature_data, created_at) VALUES (?, ?, ?, ?, ?)',
                [signature.id, signature.household_id, signature.recipient_id, signature.signature_data, signature.created_at]
            );
        }

        // Migration des distributions
        console.log('Migrating distributions...');
        const [distributions] = await sourceConn.query('SELECT * FROM distributions');
        for (const distribution of distributions) {
            await targetConn.query(
                'INSERT INTO distributions (id, household_id, recipient_id, signature_id, distribution_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [distribution.id, distribution.household_id, distribution.recipient_id, distribution.signature_id, distribution.distribution_date, distribution.status, distribution.notes]
            );
        }

        console.log('Migration completed successfully');

        // Fermeture des connexions
        await sourceConn.end();
        await targetConn.end();

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

migrate();
