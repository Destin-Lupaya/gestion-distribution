const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '../../.env' });

async function setupDatabase() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    try {
        // Connexion à MySQL
        const connection = await mysql.createConnection(config);
        console.log('Connecté à MySQL');

        // Lecture du fichier schema.sql
        console.log('Lecture du fichier schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');

        // Exécution du schema
        console.log('Création de la base de données et des tables...');
        await connection.query(schemaSql);
        console.log('Schema créé avec succès');

        // Exécution du seed
        console.log('Chargement des données de test...');
        require('./seed.js');

        console.log('Configuration de la base de données terminée avec succès');
    } catch (error) {
        console.error('Erreur lors de la configuration de la base de données:', error);
        process.exit(1);
    }
}

setupDatabase();
