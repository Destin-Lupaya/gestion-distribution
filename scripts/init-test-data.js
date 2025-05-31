/**
 * Script d'initialisation des données de test pour l'application de gestion de distribution
 * 
 * Ce script crée des bénéficiaires de test dans la base de données pour faciliter les tests
 * de l'application, notamment la fonctionnalité de recherche de bénéficiaires.
 */

const path = require('path');
const mysql = require('mysql2/promise');

// Configuration de la base de données - utilise les mêmes paramètres que le serveur
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

// Liste des bénéficiaires de test à créer
const testBeneficiaires = [
  {
    numero_enregistrement: 'R-6752',
    nom_enfant: 'Kabongo Jean',
    nom_mere: 'Kabongo Marie',
    age_mois: 24,
    sexe: 'M',
    province: 'Kinshasa',
    territoire: 'Kinshasa',
    partenaire: 'UNICEF',
    village: 'Gombe',
    site_cs: 'CS Gombe',
    date_enregistrement: '2023-01-15'
  },
  {
    numero_enregistrement: 'R-3704',
    nom_enfant: 'Mbala Marie',
    nom_mere: 'Mbala Jeanne',
    age_mois: 18,
    sexe: 'F',
    province: 'Kinshasa',
    territoire: 'Kinshasa',
    partenaire: 'OMS',
    village: 'Limete',
    site_cs: 'CS Limete',
    date_enregistrement: '2023-02-20'
  },
  {
    numero_enregistrement: 'R-5327',
    nom_enfant: 'Lukaku David',
    nom_mere: 'Lukaku Sarah',
    age_mois: 36,
    sexe: 'M',
    province: 'Kinshasa',
    territoire: 'Kinshasa',
    partenaire: 'PAM',
    village: 'Ngaliema',
    site_cs: 'CS Ngaliema',
    date_enregistrement: '2023-03-10'
  },
  {
    numero_enregistrement: '8901',
    nom_enfant: 'Mutombo Sophie',
    nom_mere: 'Mutombo Claire',
    age_mois: 12,
    sexe: 'F',
    province: 'Kinshasa',
    territoire: 'Kinshasa',
    partenaire: 'UNICEF',
    village: 'Masina',
    site_cs: 'CS Masina',
    date_enregistrement: '2023-04-05'
  }
];

async function initTestData() {
  let connection;
  
  try {
    // Établir la connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('Connexion à la base de données établie');
    
    // Vérifier si la table nutrition_beneficiaires existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'nutrition_beneficiaires'"
    );
    
    if (tables.length === 0) {
      console.log('Création de la table nutrition_beneficiaires...');
      await connection.execute(`
        CREATE TABLE nutrition_beneficiaires (
          id INT AUTO_INCREMENT PRIMARY KEY,
          numero_enregistrement VARCHAR(20) NOT NULL,
          nom_enfant VARCHAR(100) NOT NULL,
          nom_mere VARCHAR(100) NOT NULL,
          age_mois INT,
          sexe ENUM('M', 'F'),
          province VARCHAR(100),
          territoire VARCHAR(100),
          partenaire VARCHAR(100),
          village VARCHAR(100),
          site_cs VARCHAR(100),
          date_enregistrement DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY (numero_enregistrement)
        )
      `);
      console.log('Table nutrition_beneficiaires créée');
    }
    
    // Vérifier si la table nutrition_rations existe
    const [rationTables] = await connection.query(
      "SHOW TABLES LIKE 'nutrition_rations'"
    );
    
    if (rationTables.length === 0) {
      console.log('Création de la table nutrition_rations...');
      await connection.execute(`
        CREATE TABLE nutrition_rations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          beneficiaire_id INT NOT NULL,
          numero_carte VARCHAR(20),
          date_debut DATE,
          date_fin DATE,
          statut VARCHAR(20),
          FOREIGN KEY (beneficiaire_id) REFERENCES nutrition_beneficiaires(id)
        )
      `);
      console.log('Table nutrition_rations créée');
    }
    
    // Insérer les bénéficiaires de test
    for (const beneficiaire of testBeneficiaires) {
      try {
        // Vérifier si le bénéficiaire existe déjà
        const [existingBenef] = await connection.execute(
          'SELECT id FROM nutrition_beneficiaires WHERE numero_enregistrement = ?',
          [beneficiaire.numero_enregistrement]
        );
        
        let beneficiaireId;
        
        if (existingBenef.length > 0) {
          console.log(`Le bénéficiaire ${beneficiaire.numero_enregistrement} existe déjà`);
          beneficiaireId = existingBenef[0].id;
        } else {
          // Insérer le nouveau bénéficiaire
          const [result] = await connection.execute(
            'INSERT INTO nutrition_beneficiaires (numero_enregistrement, nom_enfant, nom_mere, age_mois, sexe, province, territoire, partenaire, village, site_cs, date_enregistrement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              beneficiaire.numero_enregistrement,
              beneficiaire.nom_enfant,
              beneficiaire.nom_mere,
              beneficiaire.age_mois,
              beneficiaire.sexe,
              beneficiaire.province,
              beneficiaire.territoire,
              beneficiaire.partenaire,
              beneficiaire.village,
              beneficiaire.site_cs,
              beneficiaire.date_enregistrement
            ]
          );
          beneficiaireId = result.insertId;
          console.log(`Bénéficiaire ${beneficiaire.numero_enregistrement} créé avec ID: ${beneficiaireId}`);
        }
        
        // Vérifier si une ration existe déjà pour ce bénéficiaire
        const [existingRations] = await connection.execute(
          'SELECT id FROM nutrition_rations WHERE beneficiaire_id = ?',
          [beneficiaireId]
        );
        
        if (existingRations.length === 0) {
          // Créer une ration pour ce bénéficiaire
          const [rationResult] = await connection.execute(
            'INSERT INTO nutrition_rations (beneficiaire_id, numero_carte, date_debut, date_fin, statut) VALUES (?, ?, ?, ?, ?)',
            [
              beneficiaireId,
              `CARD-${beneficiaire.numero_enregistrement}`,
              '2025-01-01',
              '2025-12-31',
              'actif'
            ]
          );
          console.log(`Ration créée pour le bénéficiaire ${beneficiaire.numero_enregistrement} avec ID: ${rationResult.insertId}`);
        } else {
          console.log(`Une ration existe déjà pour le bénéficiaire ${beneficiaire.numero_enregistrement}`);
        }
      } catch (err) {
        console.error(`Erreur lors de l'insertion du bénéficiaire ${beneficiaire.numero_enregistrement}:`, err);
      }
    }
    
    // Afficher les bénéficiaires existants
    const [beneficiaires] = await connection.query(
      'SELECT id, numero_enregistrement, nom, prenom FROM nutrition_beneficiaires'
    );
    
    console.log('\nBénéficiaires dans la base de données:');
    console.table(beneficiaires);
    
    console.log('\nInitialisation des données de test terminée avec succès!');
    
  } catch (err) {
    console.error('Erreur lors de l\'initialisation des données de test:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connexion à la base de données fermée');
    }
  }
}

// Exécuter la fonction d'initialisation
initTestData();
