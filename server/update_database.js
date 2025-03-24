require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_distribution',
    multipleStatements: true // Important pour exécuter plusieurs requêtes
  });

  try {
    console.log('Lecture du fichier SQL...');
    const sqlFile = await fs.readFile(
      path.join(__dirname, 'update_households.sql'),
      'utf8'
    );

    console.log('Exécution des requêtes SQL...');
    await connection.query(sqlFile);

    console.log('Mise à jour de la base de données terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
  } finally {
    await connection.end();
  }
}

updateDatabase();
