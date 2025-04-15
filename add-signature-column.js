// Script pour ajouter la colonne signature à la table distributions
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSignatureColumn() {
  try {
    // Configuration de la base de données
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    };

    console.log('Connexion à la base de données...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connexion établie');

    // Vérifier si la colonne signature existe déjà
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'distributions' AND COLUMN_NAME = 'signature'
    `, [dbConfig.database]);

    // Si la colonne signature n'existe pas, l'ajouter
    if (columns.length === 0) {
      console.log('Ajout de la colonne signature à la table distributions...');
      await connection.query(`
        ALTER TABLE distributions 
        ADD COLUMN signature LONGTEXT AFTER distribution_date
      `);
      console.log('Colonne signature ajoutée avec succès');
    } else {
      console.log('La colonne signature existe déjà dans la table distributions');
    }

    await connection.end();
    console.log('Opération terminée');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
addSignatureColumn();
