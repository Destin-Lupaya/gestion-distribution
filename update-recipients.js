// Script pour ajouter les colonnes manquantes à la table recipients
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateRecipientsTable() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Vérifier et ajouter les colonnes manquantes à la table recipients
    console.log('Vérification et ajout des colonnes manquantes à la table recipients...');

    // Récupérer les colonnes existantes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'recipients'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
    
    // Liste des colonnes à ajouter avec leurs définitions
    const columnsToAdd = [
      { name: 'date_naissance', definition: 'DATE NULL' },
      { name: 'age', definition: 'INT NULL' },
      { name: 'sexe', definition: "ENUM('M', 'F', 'Autre') NULL" },
      { name: 'identifiant_national', definition: 'VARCHAR(50) NULL' },
      { name: 'criteres_vulnerabilite', definition: 'JSON NULL' },
      { name: 'statut_beneficiaire', definition: "ENUM('Actif', 'Inactif', 'Doublon', 'Décédé', 'Déplacé') DEFAULT 'Actif'" },
      { name: 'photo_id', definition: 'VARCHAR(255) NULL' },
      { name: 'autres_informations_demographiques', definition: 'JSON NULL' },
      { name: 'date_enregistrement', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    // Ajouter chaque colonne si elle n'existe pas déjà
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name.toLowerCase())) {
        console.log(`Ajout de la colonne ${column.name} à la table recipients...`);
        await connection.query(`ALTER TABLE recipients ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`Colonne ${column.name} ajoutée avec succès.`);
      } else {
        console.log(`La colonne ${column.name} existe déjà dans la table recipients.`);
      }
    }

    // Vérifier et ajouter la colonne site_id à la table households si elle n'existe pas
    const [householdColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'households'
      AND COLUMN_NAME = 'site_id'
    `);

    if (householdColumns.length === 0) {
      console.log("Ajout de la colonne site_id à la table households...");
      await connection.query(`ALTER TABLE households ADD COLUMN site_id INT NULL`);
      console.log("Colonne site_id ajoutée avec succès à la table households.");
    } else {
      console.log("La colonne site_id existe déjà dans la table households.");
    }

    // Vérifier si la table sites existe, sinon la créer
    const [sitesTable] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'sites'
    `);

    if (sitesTable[0].count === 0) {
      console.log("Création de la table sites...");
      await connection.query(`
        CREATE TABLE sites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          adresse TEXT,
          province VARCHAR(50),
          region VARCHAR(50),
          district VARCHAR(50),
          responsable_site_id VARCHAR(50) NULL
        )
      `);
      console.log("Table sites créée avec succès.");
      
      // Insérer un site par défaut
      await connection.query(`
        INSERT INTO sites (nom, adresse, province, region, district) 
        VALUES ('Site par défaut', 'Adresse par défaut', 'Province par défaut', 'Région par défaut', 'District par défaut')
      `);
      console.log("Site par défaut créé.");
    } else {
      console.log("La table sites existe déjà.");
    }

    // Mettre à jour les households sans site_id pour utiliser le site par défaut
    console.log("Mise à jour des households sans site_id...");
    await connection.query(`
      UPDATE households 
      SET site_id = (SELECT id FROM sites WHERE nom = 'Site par défaut' LIMIT 1) 
      WHERE site_id IS NULL
    `);
    console.log("Households mis à jour avec le site par défaut.");

    console.log('Mise à jour de la table recipients terminée avec succès!');
    await connection.end();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la table recipients:', error);
    process.exit(1);
  }
}

updateRecipientsTable();
