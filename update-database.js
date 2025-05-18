// Script pour mettre à jour la base de données avec les nouvelles tables et fonctionnalités
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function updateDatabase() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      multipleStatements: true // Important pour exécuter plusieurs requêtes SQL
    });

    console.log('Lecture du fichier SQL de mise à jour...');
    const sqlFilePath = path.join(__dirname, 'database', 'update_schema.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Exécution des requêtes SQL...');
    await connection.query(sqlScript);

    console.log('Mise à jour de la base de données terminée avec succès!');
    await connection.end();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la base de données:', error);
    process.exit(1);
  }
}

updateDatabase();
