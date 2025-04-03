const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Créer l'application Express
const app = express();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  try {
    // Créer une connexion sans spécifier la base de données
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    console.log('Création de la base de données si elle n\'existe pas...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.execute(`USE ${dbConfig.database}`);
    
    console.log('Création des tables...');
    
    // Créer les tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sites (
        id VARCHAR(36) PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menages (
        id VARCHAR(36) PRIMARY KEY,
        household_id VARCHAR(255) UNIQUE NOT NULL,
        nom_menage VARCHAR(255) NOT NULL,
        token_number VARCHAR(255) UNIQUE NOT NULL,
        site_id VARCHAR(36) NOT NULL,
        nombre_beneficiaires INT NOT NULL CHECK (nombre_beneficiaires > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS beneficiaires (
        id VARCHAR(36) PRIMARY KEY,
        menage_id VARCHAR(36) NOT NULL,
        prenom VARCHAR(255) NOT NULL,
        post_nom VARCHAR(255),
        nom VARCHAR(255) NOT NULL,
        est_principal BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (menage_id) REFERENCES menages(id)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS distributions (
        id VARCHAR(36) PRIMARY KEY,
        menage_id VARCHAR(36) NOT NULL,
        date_distribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        signature TEXT NOT NULL,
        beneficiaire_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (menage_id) REFERENCES menages(id),
        FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id)
      )
    `);
    
    console.log('Création des index...');
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_menages_household_id ON menages(household_id)`);
    
    console.log('Base de données initialisée avec succès');
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fonction pour importer les données ménage
async function importHouseholdData(
  siteNom,
  siteAdresse,
  householdId,
  nomMenage,
  tokenNumber,
  nombreBeneficiaires,
  recipientFirstName,
  recipientMiddleName,
  recipientLastName,
  nomSuppleant
) {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    await conn.beginTransaction();
    
    // Vérifier si le site existe déjà
    const [sites] = await conn.execute(
      'SELECT * FROM sites WHERE nom = ?',
      [siteNom]
    );
    
    let siteId;
    
    if (sites.length > 0) {
      // Site existe déjà
      siteId = sites[0].id;
    } else {
      // Créer un nouveau site
      siteId = uuidv4();
      await conn.execute(
        'INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)',
        [siteId, siteNom, siteAdresse]
      );
    }
    
    // Vérifier si le ménage existe déjà
    const [menages] = await conn.execute(
      'SELECT * FROM menages WHERE household_id = ?',
      [householdId]
    );
    
    let menageId;
    
    if (menages.length > 0) {
      // Ménage existe déjà, mettre à jour
      menageId = menages[0].id;
      await conn.execute(
        'UPDATE menages SET nom_menage = ?, token_number = ?, site_id = ?, nombre_beneficiaires = ? WHERE id = ?',
        [nomMenage, tokenNumber, siteId, nombreBeneficiaires, menageId]
      );
    } else {
      // Créer un nouveau ménage
      menageId = uuidv4();
      await conn.execute(
        'INSERT INTO menages (id, household_id, nom_menage, token_number, site_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)',
        [menageId, householdId, nomMenage, tokenNumber, siteId, nombreBeneficiaires]
      );
    }
    
    // Ajouter le bénéficiaire principal
    const beneficiaireId = uuidv4();
    await conn.execute(
      'INSERT INTO beneficiaires (id, menage_id, prenom, post_nom, nom, est_principal) VALUES (?, ?, ?, ?, ?, ?)',
      [beneficiaireId, menageId, recipientFirstName, recipientMiddleName || null, recipientLastName, true]
    );
    
    // Ajouter le suppléant si fourni
    if (nomSuppleant) {
      const suppleantId = uuidv4();
      await conn.execute(
        'INSERT INTO beneficiaires (id, menage_id, nom, est_principal) VALUES (?, ?, ?, ?)',
        [suppleantId, menageId, nomSuppleant, false]
      );
    }
    
    await conn.commit();
    return { success: true, menageId, householdId };
  } catch (error) {
    await conn.rollback();
    console.error('Error importing household data:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

// Endpoint de vérification de santé
app.get('/api/health', async (req, res) => {
  try {
    // Test de connexion MySQL
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    
    res.status(200).json({ 
      status: 'ok',
      message: 'Backend server is running and database connection is successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: String(error)
    });
  }
});

// Endpoint de suggestion de mapping de colonnes
app.post('/api/suggest-mapping', (req, res) => {
  try {
    const { headers } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid headers format. Expected an array of strings.'
      });
    }
    
    // Définir les mappings de colonnes possibles
    const columnMappings = {
      'site_name': ['Site', 'Nom du site', 'Site de distribution', 'site_name'],
      'site_address': ['Adresse', 'Adresse du site', 'Address', 'site_address'],
      'household_id': ['household_id', 'Household ID', 'ID Ménage', 'Code Ménage'],
      'household_name': ['household_name', 'Nom du Ménage', 'Ménage', 'Household', 'Nom Menage'],
      'token_number': ['token_number', 'Token', 'Numéro de jeton', 'Jeton'],
      'beneficiary_count': ['beneficiary_count', 'Bénéficiaires', 'Nombre de bénéficiaires', 'Beneficiaries'],
      'first_name': ['first_name', 'Prénom', 'Prénom du bénéficiaire', 'First name'],
      'middle_name': ['middle_name', 'Post-Nom', 'Deuxième prénom', 'Middle name'],
      'last_name': ['last_name', 'Nom', 'Nom de famille', 'Last name'],
      'alternate_recipient': ['alternate_recipient', 'Suppléant', 'Bénéficiaire suppléant', 'Alternate']
    };
    
    const requiredColumns = ['site_name', 'household_id', 'household_name', 'token_number', 'beneficiary_count', 'first_name', 'last_name'];
    
    const mapping = {};
    const missingColumns = [];
    
    for (const [field, possibleNames] of Object.entries(columnMappings)) {
      // Trouver si un des noms possibles correspond à un en-tête
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          name.toLowerCase() === header.toLowerCase()
        )
      );
      
      if (matchedHeader) {
        mapping[field] = matchedHeader;
      } else if (requiredColumns.includes(field)) {
        missingColumns.push(field);
      }
    }
    
    const isValid = missingColumns.length === 0;
    
    res.status(200).json({
      mapping,
      isValid,
      missingColumns
    });
  } catch (error) {
    console.error('Error suggesting mapping:', error);
    res.status(500).json({ 
      success: false,
      error: String(error)
    });
  }
});

// Endpoint de validation des données
app.post('/api/validate-data', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format. Expected an array of objects.'
      });
    }
    
    const errors = [];
    
    // Valider chaque ligne
    data.forEach((row, index) => {
      const rowNum = index + 1;
      
      // Vérifier les champs requis
      if (!row.site_name) {
        errors.push(`Ligne ${rowNum}: Le nom du site est requis`);
      }
      
      if (!row.household_id) {
        errors.push(`Ligne ${rowNum}: L'ID du ménage est requis`);
      }
      
      if (!row.household_name) {
        errors.push(`Ligne ${rowNum}: Le nom du ménage est requis`);
      }
      
      if (!row.token_number) {
        errors.push(`Ligne ${rowNum}: Le numéro de jeton est requis`);
      }
      
      if (row.beneficiary_count === undefined || row.beneficiary_count < 0) {
        errors.push(`Ligne ${rowNum}: Le nombre de bénéficiaires doit être un nombre positif`);
      }
      
      if (!row.first_name) {
        errors.push(`Ligne ${rowNum}: Le prénom est requis`);
      }
      
      if (!row.last_name) {
        errors.push(`Ligne ${rowNum}: Le nom est requis`);
      }
    });
    
    res.status(200).json({
      isValid: errors.length === 0,
      errors
    });
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({
      isValid: false,
      errors: [String(error)]
    });
  }
});

// Endpoint d'importation des données
app.post('/api/import', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid data format. Expected an array of objects.'
      });
    }

    const results = [];
    
    // Traiter chaque ligne dans le tableau de données
    for (const row of data) {
      try {
        // Extraire les champs des données de la ligne
        // Supporter plusieurs noms de champs possibles pour rendre l'endpoint plus flexible
        const siteNom = row.site_name || row.siteNom || '';
        const siteAdresse = row.site_address || row.siteAdresse || '';
        const householdId = row.household_id || row.householdId || '';
        const nomMenage = row.household_name || row.nomMenage || '';
        const tokenNumber = row.token_number || row.tokenNumber || '';
        const nombreBeneficiaires = parseInt(row.beneficiary_count || row.nombreBeneficiaires || '0');
        const recipientFirstName = row.first_name || row.recipientFirstName || '';
        const recipientMiddleName = row.middle_name || row.recipientMiddleName || null;
        const recipientLastName = row.last_name || row.recipientLastName || '';
        const nomSuppleant = row.alternate_recipient || row.nomSuppleant || null;

        // Importer les données du ménage
        await importHouseholdData(
          siteNom,
          siteAdresse,
          householdId,
          nomMenage,
          tokenNumber,
          nombreBeneficiaires,
          recipientFirstName,
          recipientMiddleName,
          recipientLastName,
          nomSuppleant
        );

        results.push({
          success: true,
          householdId,
          message: 'Household imported successfully'
        });
      } catch (error) {
        console.error('Error importing row:', error);
        results.push({
          success: false,
          error: String(error),
          data: row
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Import completed',
      results 
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ 
      success: false,
      error: String(error)
    });
  }
});

// Initialisation de la base de données
initializeDatabase();

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
