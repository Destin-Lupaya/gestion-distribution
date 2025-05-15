// Serveur Express combiné pour la gestion des distributions
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Importer les modules nécessaires pour la validation des données Excel
const { REQUIRED_COLUMNS, suggestColumnMapping, validateExcelColumns, validateExcelData } = require('./lib/excelMapping');

// Importer les modules nécessaires pour la validation des données Excel
try {
  const { REQUIRED_COLUMNS, suggestColumnMapping, validateExcelColumns, validateExcelData } = require('./server/lib/excelMapping');
  // Rendre ces fonctions disponibles globalement
  global.REQUIRED_COLUMNS = REQUIRED_COLUMNS;
  global.suggestColumnMapping = suggestColumnMapping;
  global.validateExcelColumns = validateExcelColumns;
  global.validateExcelData = validateExcelData;
} catch (error) {
  console.warn('Module de validation Excel non trouvé dans /server/lib:', error.message);
}

console.log('Configuration de l\'environnement:', {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_NAME: process.env.DB_NAME || 'gestion_distribution',
  DB_PORT: process.env.DB_PORT || '3306'
});

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS plus permissive
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true
}));

// Augmenter la limite de taille pour les requêtes JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ajouter des en-têtes CORS à toutes les réponses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Gérer les requêtes preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Configuration de la base de données:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : ''
});

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de la connexion à la base de données
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connexion à la base de données réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
}

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  let connection;
  try {
    console.log('Tentative de connexion à MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connexion à MySQL établie avec succès');

    // Créer la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gestion_distribution'}`);
    console.log(`Base de données "${process.env.DB_NAME || 'gestion_distribution'}" créée ou vérifiée`);

    // Utiliser la base de données
    await connection.query(`USE ${process.env.DB_NAME || 'gestion_distribution'}`);
    console.log(`Base de données "${process.env.DB_NAME || 'gestion_distribution'}" sélectionnée`);

    // Vérifier si les tables existent déjà
    const [tables] = await connection.query(`SHOW TABLES`);
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    if (tableNames.includes('sites') && tableNames.includes('households') && 
        tableNames.includes('distributions')) {
      console.log('Les tables existent déjà, pas besoin de les recréer');
      return;
    }

    // Créer les tables si elles n'existent pas
    // Créer la table sites
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table sites créée avec succès');

    // Créer la table households
    await connection.query(`
      CREATE TABLE IF NOT EXISTS households (
        id VARCHAR(36) PRIMARY KEY,
        site_id INT,
        household_id VARCHAR(50),
        household_name VARCHAR(255),
        nom_menage VARCHAR(255),
        token_number VARCHAR(50) NOT NULL,
        beneficiary_count INT DEFAULT 1,
        nombre_beneficiaires INT DEFAULT 1,
        first_name VARCHAR(255),
        middle_name VARCHAR(255),
        last_name VARCHAR(255),
        site_name VARCHAR(255),
        site_address VARCHAR(255),
        alternate_recipient VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table households créée avec succès');

    // Créer la table distributions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS distributions (
        id VARCHAR(36) PRIMARY KEY,
        household_id VARCHAR(36),
        distribution_date DATETIME NOT NULL,
        signature LONGTEXT,
        signature_data LONGTEXT,
        status VARCHAR(50) DEFAULT 'distributed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table distributions créée avec succès');

    console.log('Initialisation de la base de données terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Middleware pour vérifier la connexion à la base de données
const checkDatabaseConnection = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    next();
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Unable to connect to database',
      details: error.message 
    });
  }
};

// Initialiser la base de données au démarrage
initializeDatabase()
  .then(() => {
    console.log('Initialisation de la base de données terminée avec succès');
  })
  .catch(error => {
    console.error('Erreur lors de l\'initialisation:', error);
  });

// Appliquer le middleware de vérification de connexion à toutes les routes API
app.use('/api', checkDatabaseConnection);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testDbConnection();
    if (dbConnected) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'Server is healthy, database connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all sites
app.get('/api/sites', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM sites');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Create a new site
app.post('/api/sites', async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Site name is required' });
    }
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO sites (nom, adresse) VALUES (?, ?)',
      [name, address || '']
    );
    connection.release();
    
    res.status(201).json({ id: result.insertId, name, address });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Get all households
app.get('/api/households', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM households');
    connection.release();
    
    // If no households exist yet, return empty array instead of error
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// Get household by token number
app.get('/api/households/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM households WHERE token_number = ?',
      [token]
    );
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching household by token:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Get households by site
app.get('/api/households/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM households WHERE site_id = ?',
      [siteId]
    );
    connection.release();
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households by site:', error);
    res.status(500).json({ error: 'Failed to fetch households by site' });
  }
});

// Create a new household
app.post('/api/households', async (req, res) => {
  try {
    const { site_id, household_name, token_number, beneficiary_count } = req.body;
    
    if (!site_id || !household_name) {
      return res.status(400).json({ error: 'Site ID and household name are required' });
    }
    
    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      'INSERT INTO households (id, site_id, household_name, token_number, beneficiary_count) VALUES (?, ?, ?, ?, ?)',
      [id, site_id, household_name, token_number, beneficiary_count || 1]
    );
    connection.release();
    
    res.status(201).json({ 
      id, 
      site_id, 
      household_name, 
      token_number, 
      beneficiary_count 
    });
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

// Endpoint simple pour vérifier les données dans la table distributions
app.get('/api/distributions/check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM distributions');
    const [sample] = await connection.query('SELECT * FROM distributions LIMIT 5');
    connection.release();
    res.json({
      count: rows[0].count,
      sample: sample
    });
  } catch (error) {
    console.error('Error checking distributions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint simple pour vérifier les données dans la table households
app.get('/api/households/check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM households');
    const [sample] = await connection.query('SELECT * FROM households LIMIT 5');
    connection.release();
    res.json({
      count: rows[0].count,
      sample: sample
    });
  } catch (error) {
    console.error('Error checking households:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GET pour vérifier la disponibilité de l'importation
app.get('/api/import', async (req, res) => {
  try {
    // Simplement retourner un statut OK pour confirmer que l'endpoint est disponible
    res.status(200).json({ 
      status: 'ok',
      message: 'Import endpoint is available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking import endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour suggérer le mapping des colonnes
app.post('/api/suggest-mapping', async (req, res) => {
  try {
    console.log('Requête reçue pour /api/suggest-mapping:', req.body);
    const { headers } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ 
        error: 'Les en-têtes de colonnes sont requis et doivent être un tableau' 
      });
    }

    const validation = validateExcelColumns(headers);
    console.log('Validation des colonnes:', validation);

    res.json({
      mapping: validation.mapping,
      isValid: validation.isValid,
      missingColumns: validation.missingColumns
    });
  } catch (error) {
    console.error('Erreur lors de la suggestion du mapping:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suggestion du mapping des colonnes',
      details: error.message 
    });
  }
});

// Route pour valider les données Excel
app.post('/api/validate-data', (req, res) => {
  console.log('Requête reçue pour /api/validate-data:', req.body);
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const validation = validateExcelData(data);
    res.json(validation);
  } catch (error) {
    console.error('Erreur lors de la validation des données:', error);
    res.status(500).json({ error: 'Erreur lors de la validation des données' });
  }
});

// Route pour valider un QR code
app.post('/api/validate-qr', async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ 
        valid: false,
        message: 'QR code est requis' 
      });
    }
    
    let tokenNumber;
    
    // Essayer de parser le QR code comme JSON
    try {
      const qrData = JSON.parse(qrCode);
      tokenNumber = qrData.token_number;
      
      if (!tokenNumber) {
        return res.status(400).json({ 
          valid: false,
          message: 'Numéro de jeton manquant dans le QR code' 
        });
      }
    } catch (error) {
      // Si ce n'est pas du JSON valide, considérer que c'est directement le numéro de jeton
      console.log('QR code is not valid JSON, using as token_number:', qrCode);
      tokenNumber = qrCode;
    }
    
    console.log('Searching for household with token number:', tokenNumber);
    
    const connection = await pool.getConnection();
    const [households] = await connection.query(
      'SELECT * FROM households WHERE token_number = ?',
      [tokenNumber]
    );
    connection.release();
    
    if (households.length === 0) {
      return res.status(404).json({ 
        valid: false,
        message: 'Ménage non trouvé avec ce numéro de jeton' 
      });
    }
    
    const household = households[0];
    
    // Récupérer les informations du site associé au ménage
    const connection2 = await pool.getConnection();
    const [sites] = await connection2.query(
      'SELECT * FROM sites WHERE id = ?',
      [household.site_id]
    );
    
    // Vérifier si une distribution a déjà été effectuée aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [distributions] = await connection2.query(
      'SELECT * FROM distributions WHERE household_id = ? AND DATE(date_distribution) = DATE(?)',
      [household.id, today]
    );
    connection2.release();
    
    // Construire l'objet de réponse avec toutes les informations nécessaires
    const beneficiaryData = {
      id: household.id,
      household_id: household.id,
      site_id: household.site_id,
      site_name: sites.length > 0 ? sites[0].name : 'Site inconnu',
      site_address: sites.length > 0 ? sites[0].address : '',
      token_number: household.token_number,
      beneficiary_count: household.beneficiary_count,
      first_name: household.first_name,
      middle_name: household.middle_name,
      last_name: household.last_name,
      alternate_recipient: household.alternate_recipient || ''
    };
    
    res.json({
      valid: true,
      message: 'Bénéficiaire trouvé',
      data: beneficiaryData,
      alreadyDistributed: distributions.length > 0,
      distributions: distributions
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Erreur lors de la validation du QR code: ' + error.message 
    });
  }
});

// Route pour enregistrer une distribution manuellement
app.post('/api/register-distribution', async (req, res) => {
  let connection;
  try {
    console.log('Début de la requête /api/register-distribution');
    console.log('Données reçues:', JSON.stringify(req.body, null, 2));
    
    const {
      site_name,
      household_id,
      token_number,
      beneficiary_count,
      first_name,
      middle_name,
      last_name,
      site_address,
      alternate_recipient,
      signature
    } = req.body;

    // Validation des champs requis
    if (!site_name) {
      console.log('Validation échouée: site_name manquant');
      return res.status(400).json({ error: 'Le nom du site est requis' });
    }
    if (!household_id) {
      console.log('Validation échouée: household_id manquant');
      return res.status(400).json({ error: 'L\'ID du ménage est requis' });
    }
    if (!token_number) {
      console.log('Validation échouée: token_number manquant');
      return res.status(400).json({ error: 'Le numéro de jeton est requis' });
    }
    if (!beneficiary_count) {
      console.log('Validation échouée: beneficiary_count manquant');
      return res.status(400).json({ error: 'Le nombre de bénéficiaires est requis' });
    }
    if (!first_name) {
      console.log('Validation échouée: first_name manquant');
      return res.status(400).json({ error: 'Le prénom est requis' });
    }
    if (!last_name) {
      console.log('Validation échouée: last_name manquant');
      return res.status(400).json({ error: 'Le nom de famille est requis' });
    }
    if (!signature) {
      console.log('Validation échouée: signature manquante');
      return res.status(400).json({ error: 'La signature est requise' });
    }

    console.log('Connexion à la base de données...');
    connection = await pool.getConnection();
    
    // Commencer une transaction
    console.log('Début de la transaction');
    await connection.beginTransaction();
    
    try {
      // 1. Vérifier/créer le site
      console.log('Recherche du site:', site_name);
      const [sites] = await connection.query(
        'SELECT id FROM sites WHERE nom = ?',
        [site_name]
      );
      
      let siteId;
      if (sites.length > 0) {
        siteId = sites[0].id;
        console.log('Site existant trouvé, ID:', siteId);
      } else {
        // Pour sites, utiliser NULL pour l'ID car c'est un AUTO_INCREMENT
        console.log('Création d\'un nouveau site');
        const [result] = await connection.query(
          'INSERT INTO sites (nom, adresse) VALUES (?, ?)',
          [site_name, site_address || '']
        );
        siteId = result.insertId; // Récupérer l'ID auto-incrémenté
        console.log('Nouveau site créé, ID:', siteId);
      }
      
      // 2. Vérifier/créer le ménage
      console.log('Recherche du ménage avec token_number:', token_number);
      const [households] = await connection.query(
        'SELECT id FROM households WHERE token_number = ?',
        [token_number]
      );
      
      let householdId;
      if (households.length > 0) {
        householdId = households[0].id;
        console.log('Ménage existant trouvé, ID:', householdId);
        
        // Mettre à jour les informations du ménage si nécessaire
        console.log('Mise à jour des informations du ménage');
        try {
          await connection.query(
            'UPDATE households SET household_name = ?, nom_menage = ?, site_id = ?, beneficiary_count = ?, nombre_beneficiaires = ?, first_name = ?, middle_name = ?, last_name = ?, site_address = ?, alternate_recipient = ? WHERE id = ?',
            [
              household_id, 
              household_id, 
              siteId, 
              beneficiary_count, 
              beneficiary_count, 
              first_name, 
              middle_name || null, 
              last_name, 
              site_address || '', 
              alternate_recipient || null, 
              householdId
            ]
          );
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du ménage:', updateError);
          console.error('SQL Error:', updateError.sqlMessage);
          console.error('SQL State:', updateError.sqlState);
          throw updateError;
        }
      } else {
        householdId = uuidv4(); // Utiliser UUID pour households car c'est un VARCHAR(36)
        console.log('Création d\'un nouveau ménage avec ID:', householdId);
        try {
          await connection.query(
            'INSERT INTO households (id, site_id, household_id, household_name, nom_menage, token_number, beneficiary_count, nombre_beneficiaires, first_name, middle_name, last_name, site_address, alternate_recipient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              householdId, 
              siteId, 
              household_id, 
              household_id, 
              household_id, 
              token_number, 
              beneficiary_count, 
              beneficiary_count, 
              first_name, 
              middle_name || null, 
              last_name, 
              site_address || '', 
              alternate_recipient || null
            ]
          );
        } catch (insertError) {
          console.error('Erreur lors de la création du ménage:', insertError);
          console.error('SQL Error:', insertError.sqlMessage);
          console.error('SQL State:', insertError.sqlState);
          throw insertError;
        }
      }
      
      // 3. Vérifier/créer le bénéficiaire principal
      console.log('Recherche du bénéficiaire principal pour le ménage:', householdId);
      const [recipients] = await connection.query(
        'SELECT id FROM recipients WHERE household_id = ? AND est_principal = TRUE',
        [householdId]
      );
      
      let recipientId;
      if (recipients.length > 0) {
        recipientId = recipients[0].id;
        console.log('Bénéficiaire principal existant trouvé, ID:', recipientId);
        
        // Mettre à jour les informations du bénéficiaire
        console.log('Mise à jour des informations du bénéficiaire');
        try {
          await connection.query(
            'UPDATE recipients SET first_name = ?, middle_name = ?, last_name = ? WHERE id = ?',
            [first_name, middle_name || null, last_name, recipientId]
          );
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du bénéficiaire:', updateError);
          console.error('SQL Error:', updateError.sqlMessage);
          console.error('SQL State:', updateError.sqlState);
          throw updateError;
        }
      } else {
        recipientId = uuidv4(); // Utiliser UUID pour recipients car c'est un VARCHAR(36)
        console.log('Création d\'un nouveau bénéficiaire principal avec ID:', recipientId);
        try {
          await connection.query(
            'INSERT INTO recipients (id, household_id, first_name, middle_name, last_name, est_principal, genre) VALUES (?, ?, ?, ?, ?, TRUE, ?)',
            [recipientId, householdId, first_name, middle_name || null, last_name, 'M'] // Genre par défaut à 'M' si non spécifié
          );
        } catch (insertError) {
          console.error('Erreur lors de la création du bénéficiaire:', insertError);
          console.error('SQL Error:', insertError.sqlMessage);
          console.error('SQL State:', insertError.sqlState);
          throw insertError;
        }
      }
      
      // 4. Créer la distribution directement avec la signature
      const distributionId = uuidv4(); // Utiliser UUID pour distributions car c'est un VARCHAR(36)
      const now = new Date();
      console.log('Création d\'une nouvelle distribution avec ID:', distributionId);
      
      try {
        await connection.query(
          'INSERT INTO distributions (id, household_id, distribution_date, signature, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [distributionId, householdId, now, signature, 'completee', now]
        );
      } catch (insertError) {
        console.error('Erreur lors de la création de la distribution:', insertError);
        console.error('SQL Error:', insertError.sqlMessage);
        console.error('SQL State:', insertError.sqlState);
        throw insertError;
      }
      
      // 5. Enregistrer également la signature dans la table signatures pour référence future
      const signatureId = uuidv4(); // Utiliser UUID pour signatures car c'est un VARCHAR(36)
      console.log('Enregistrement de la signature avec ID:', signatureId);
      try {
        await connection.query(
          'INSERT INTO signatures (id, recipient_id, signature_data, date_signature, created_at) VALUES (?, ?, ?, ?, ?)',
          [signatureId, recipientId, signature, now, now]
        );
      } catch (insertError) {
        console.error('Erreur lors de l\'enregistrement de la signature:', insertError);
        console.error('SQL Error:', insertError.sqlMessage);
        console.error('SQL State:', insertError.sqlState);
        throw insertError;
      }
      
      // Valider la transaction
      console.log('Validation de la transaction');
      await connection.commit();
      
      console.log('Distribution enregistrée avec succès:', distributionId);
      res.status(201).json({
        success: true,
        message: 'Distribution enregistrée avec succès',
        data: {
          distribution_id: distributionId,
          household_id: householdId,
          distribution_date: now
        }
      });
    } catch (sqlError) {
      // Annuler la transaction en cas d'erreur SQL
      console.log('Erreur SQL détectée, annulation de la transaction');
      await connection.rollback();
      throw sqlError; // Rethrow pour être capturé par le catch externe
    }
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    if (connection) {
      try {
        console.log('Erreur détectée, annulation de la transaction');
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors de l\'annulation de la transaction:', rollbackError);
      }
    }
    
    console.error('Erreur lors de l\'enregistrement de la distribution:', error);
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Vérifier si c'est une erreur SQL et extraire plus d'informations
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
      console.error('SQL Error Number:', error.errno);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'enregistrement de la distribution: ' + error.message,
      details: error.sqlMessage ? {
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        sqlErrorNumber: error.errno
      } : undefined
    });
  } finally {
    // Libérer la connexion dans tous les cas
    if (connection) {
      console.log('Libération de la connexion à la base de données');
      connection.release();
    }
  }
});

// Route pour rechercher des bénéficiaires par token ou nom
app.get('/api/beneficiaires/search', async (req, res) => {
  let connection;
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Un terme de recherche est requis' });
    }
    
    console.log(`Recherche de bénéficiaires avec le terme: ${query}`);
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Vérifier la structure de la table households pour s'assurer que les colonnes existent
    const [columns] = await connection.query('SHOW COLUMNS FROM households');
    const columnNames = columns.map(col => col.Field);
    console.log('Colonnes disponibles dans la table households:', columnNames);
    
    // Construire la requête dynamiquement en fonction des colonnes disponibles
    let selectFields = ['h.id as household_id', 'h.token_number'];
    let whereConditions = ['h.token_number LIKE ?'];
    let queryParams = [`%${query}%`];
    
    // Ajouter les champs conditionnellement s'ils existent
    if (columnNames.includes('nom_menage')) {
      selectFields.push('h.nom_menage as nom_du_menage');
      whereConditions.push('h.nom_menage LIKE ?');
      queryParams.push(`%${query}%`);
    } else if (columnNames.includes('household_name')) {
      selectFields.push('h.household_name as nom_du_menage');
      whereConditions.push('h.household_name LIKE ?');
      queryParams.push(`%${query}%`);
    }
    
    // Ajouter les champs de nom
    if (columnNames.includes('first_name')) selectFields.push('h.first_name as prenom');
    if (columnNames.includes('middle_name')) selectFields.push('h.middle_name as deuxieme_nom');
    if (columnNames.includes('last_name')) selectFields.push('h.last_name as nom');
    
    // Ajouter le nom complet si les champs existent
    if (columnNames.includes('first_name') && columnNames.includes('last_name')) {
      selectFields.push('CONCAT(h.first_name, " ", IFNULL(h.middle_name, ""), " ", h.last_name) as nom_complet');
      whereConditions.push('CONCAT(h.first_name, " ", IFNULL(h.middle_name, ""), " ", h.last_name) LIKE ?');
      queryParams.push(`%${query}%`);
    }
    
    // Ajouter les champs de site
    if (columnNames.includes('site_name')) selectFields.push('h.site_name as site_de_distribution');
    if (columnNames.includes('site_id')) selectFields.push('h.site_id');
    if (columnNames.includes('site_address')) selectFields.push('h.site_address as adresse');
    
    // Construire la requête SQL
    const sql = `
      SELECT 
        ${selectFields.join(',\n        ')}
      FROM households h
      WHERE 
        ${whereConditions.join(' OR\n        ')}
      LIMIT 20
    `;
    
    console.log('Requête SQL générée:', sql);
    console.log('Paramètres:', queryParams);
    
    // Exécuter la requête
    const [rows] = await connection.query(sql, queryParams);
    
    connection.release();
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la recherche de bénéficiaires:', error);
    res.status(500).json({ error: String(error) });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint pour récupérer tous les bénéficiaires
app.get('/api/recipients', async (req, res) => {
  let connection;
  try {
    console.log('Récupération de tous les bénéficiaires');
    connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT r.*, h.nom_menage as household_name, h.token_number, s.nom as site_name ' +
      'FROM recipients r ' +
      'LEFT JOIN households h ON r.household_id = h.id ' +
      'LEFT JOIN sites s ON h.site_distribution_id = s.id ' +
      'ORDER BY r.created_at DESC'
    );
    
    console.log(`${rows.length} bénéficiaires trouvés`);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des bénéficiaires:', error);
    res.status(500).json({ error: String(error) });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint pour récupérer toutes les distributions
app.get('/api/distributions', async (req, res) => {
  let connection;
  try {
    console.log('Récupération de toutes les distributions');
    connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT d.*, r.first_name, r.middle_name, r.last_name, r.site_name, r.household_name, r.token_number, r.beneficiary_count ' +
      'FROM distributions d ' +
      'JOIN recipients r ON d.recipient_id = r.id ' +
      'ORDER BY d.created_at DESC'
    );
    
    console.log(`${rows.length} distributions trouvées`);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions:', error);
    res.status(500).json({ error: String(error) });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint pour récupérer les distributions en attente
app.get('/api/distributions/pending', async (req, res) => {
  let connection;
  try {
    console.log('Récupération des distributions en attente');
    connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT d.*, r.first_name, r.middle_name, r.last_name, r.site_name, r.household_name, r.token_number, r.beneficiary_count ' +
      'FROM distributions d ' +
      'JOIN recipients r ON d.recipient_id = r.id ' +
      'WHERE d.status = "pending" ' +
      'ORDER BY d.created_at DESC'
    );
    
    console.log(`${rows.length} distributions en attente trouvées`);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des distributions en attente',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint pour approuver une distribution
app.put('/api/distributions/:id/approve', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log(`Approbation de la distribution ${id}`);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Vérifier si la distribution existe et est en attente
    const [distributions] = await connection.query(
      'SELECT * FROM distributions WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (distributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée ou déjà traitée'
      });
    }
    
    // Mettre à jour le statut de la distribution
    await connection.query(
      'UPDATE distributions SET status = "completed", updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Distribution approuvée avec succès'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur lors de l\'approbation de la distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la distribution',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint pour annuler une distribution
app.put('/api/distributions/:id/cancel', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log(`Annulation de la distribution ${id}`);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Vérifier si la distribution existe et est en attente
    const [distributions] = await connection.query(
      'SELECT * FROM distributions WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (distributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée ou déjà traitée'
      });
    }
    
    // Mettre à jour le statut de la distribution
    await connection.query(
      'UPDATE distributions SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Distribution annulée avec succès'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur lors de l\'annulation de la distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la distribution',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
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
    const connection = await pool.getConnection();
    
    // Traiter chaque ligne dans le tableau de données
    for (const row of data) {
      try {
        // Extraire les champs des données de la ligne
        const siteName = row.site_name || '';
        const siteAddress = row.site_address || '';
        const householdIdFromExcel = row.household_id || '';
        const householdName = row.household_name || '';
        const tokenNumber = row.token_number || '';
        const beneficiaryCount = parseInt(row.beneficiary_count || '0');
        
        // Vérifier si le site existe déjà
        const [sites] = await connection.query(
          'SELECT id FROM sites WHERE nom = ?',
          [siteName]
        );
        
        let siteId;
        if (sites.length > 0) {
          // Utiliser le site existant
          siteId = sites[0].id;
        } else {
          // Créer un nouveau site
          const [result] = await connection.query(
            'INSERT INTO sites (nom, adresse) VALUES (?, ?)',
            [siteName, siteAddress]
          );
          siteId = result.insertId; // Récupérer l'ID auto-incrémenté
        }
        
        // Vérifier si le ménage existe déjà
        const [households] = await connection.query(
          'SELECT id FROM households WHERE token_number = ?',
          [tokenNumber]
        );
        
        let householdDbId;
        if (households.length > 0) {
          // Mettre à jour le ménage existant
          householdDbId = households[0].id;
          
          // Mettre à jour les informations du ménage si nécessaire
          await connection.query(
            'UPDATE households SET household_name = ?, nom_menage = ?, site_id = ?, beneficiary_count = ?, nombre_beneficiaires = ?, first_name = ?, middle_name = ?, last_name = ?, site_address = ?, alternate_recipient = ? WHERE id = ?',
            [
              householdName, 
              householdName, 
              siteId, 
              beneficiaryCount, 
              beneficiaryCount, 
              row.first_name || '', 
              row.middle_name || null, 
              row.last_name || '', 
              siteAddress, 
              row.alternate_recipient || null, 
              householdDbId
            ]
          );
        } else {
          // Créer un nouveau ménage
          householdDbId = uuidv4();
          await connection.query(
            'INSERT INTO households (id, site_id, household_id, household_name, nom_menage, token_number, beneficiary_count, nombre_beneficiaires, first_name, middle_name, last_name, site_address, alternate_recipient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              householdDbId, 
              siteId, 
              householdIdFromExcel, 
              householdName, 
              householdName, 
              tokenNumber, 
              beneficiaryCount, 
              beneficiaryCount, 
              row.first_name || '', 
              row.middle_name || null, 
              row.last_name || '', 
              siteAddress, 
              row.alternate_recipient || null
            ]
          );
        }
        
        results.push({
          success: true,
          row: row,
          message: 'Data imported successfully'
        });
      } catch (error) {
        console.error('Error importing row:', error, row);
        results.push({
          success: false,
          row: row,
          error: error.message
        });
      }
    }
    
    connection.release();
    
    // Calculer les statistiques d'importation
    const totalRows = results.length;
    const successRows = results.filter(r => r.success).length;
    const errorRows = totalRows - successRows;
    
    res.json({
      success: true,
      stats: {
        totalRows,
        successRows,
        errorRows
      },
      results
    });
  } catch (error) {
    console.error('Error processing import:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process import: ' + error.message
    });
  }
});

// Routes pour la nutrition
// Récupérer le rapport de nutrition
app.get('/api/nutrition/report', async (req, res) => {
  let connection;
  try {
    console.log('Récupération du rapport de nutrition');
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Requête pour obtenir les données du rapport de nutrition
    const [rows] = await connection.execute(`
      SELECT 
        nb.numero_enregistrement,
        nb.nom_enfant,
        nb.nom_mere,
        nb.age_mois,
        nb.sexe,
        nb.province,
        nb.territoire,
        nb.partenaire,
        nb.village,
        nb.site_cs,
        nr.numero_carte,
        nr.statut,
        COUNT(nd.id) as nombre_distributions,
        MAX(nd.date_distribution) as derniere_distribution
      FROM nutrition_beneficiaires nb
      LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
      LEFT JOIN nutrition_distributions nd ON nr.id = nd.ration_id
      GROUP BY nb.id, nr.id
      ORDER BY nb.nom_enfant
    `);
    
    // Libérer la connexion
    connection.release();
    
    // Renvoyer les données
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de nutrition:', error);
    
    // Libérer la connexion en cas d'erreur
    if (connection) connection.release();
    
    res.status(500).json({ error: String(error) });
  }
});

// Récupérer un bénéficiaire de nutrition par son numéro d'enregistrement
app.get('/api/nutrition/beneficiaires/:numeroEnregistrement', async (req, res) => {
  let connection;
  try {
    const { numeroEnregistrement } = req.params;
    console.log(`Recherche du bénéficiaire de nutrition avec le numéro d'enregistrement: ${numeroEnregistrement}`);
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Requête pour obtenir le bénéficiaire et ses informations de ration
    const [rows] = await connection.execute(
      `SELECT 
        nb.*, 
        nr.id as ration_id, 
        nr.numero_carte as numero_ration, 
        nr.date_debut, 
        nr.date_fin, 
        nr.statut
      FROM nutrition_beneficiaires nb
      LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
      WHERE nb.numero_enregistrement = ?`,
      [numeroEnregistrement]
    );
    
    // Libérer la connexion
    connection.release();
    
    if (rows.length > 0) {
      // Formater la réponse pour correspondre à ce que le frontend attend
      const beneficiary = rows[0];
      
      // Extraire les données de ration
      const ration = {
        id: beneficiary.ration_id,
        numero_ration: beneficiary.numero_ration,
        date_debut: beneficiary.date_debut,
        date_fin: beneficiary.date_fin,
        statut: beneficiary.statut
      };
      
      // Supprimer les champs de ration de l'objet principal
      delete beneficiary.ration_id;
      delete beneficiary.numero_ration;
      delete beneficiary.date_debut;
      delete beneficiary.date_fin;
      delete beneficiary.statut;
      
      // Ajouter les rations comme un tableau
      beneficiary.nutrition_rations = [ration];
      
      res.status(200).json(beneficiary);
    } else {
      res.status(404).json({ error: 'Bénéficiaire non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche du bénéficiaire de nutrition:', error);
    
    // Libérer la connexion en cas d'erreur
    if (connection) connection.release();
    
    res.status(500).json({ error: String(error) });
  }
});

// Récupérer les distributions de nutrition pour une ration donnée
app.get('/api/nutrition/distributions/:rationId', async (req, res) => {
  let connection;
  try {
    const { rationId } = req.params;
    console.log(`Récupération des distributions de nutrition pour la ration: ${rationId}`);
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Requête pour obtenir les distributions
    const [rows] = await connection.execute(
      `SELECT * FROM nutrition_distributions WHERE ration_id = ? ORDER BY date_distribution`,
      [rationId]
    );
    
    // Libérer la connexion
    connection.release();
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions de nutrition:', error);
    
    // Libérer la connexion en cas d'erreur
    if (connection) connection.release();
    
    res.status(500).json({ error: String(error) });
  }
});

// Enregistrer un nouveau bénéficiaire de nutrition
app.post('/api/nutrition/register-beneficiary', async (req, res) => {
  let connection;
  try {
    const {
      numero_enregistrement,
      nom_enfant,
      nom_mere,
      age_mois,
      sexe,
      province,
      territoire,
      partenaire,
      village,
      site_cs
    } = req.body;
    
    console.log('Enregistrement d\'un nouveau bénéficiaire de nutrition:', req.body);
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Démarrer une transaction
    await connection.beginTransaction();
    
    try {
      // Insérer le bénéficiaire
      const beneficiaireId = uuidv4();
      await connection.execute(
        `INSERT INTO nutrition_beneficiaires (
          id,
          numero_enregistrement,
          nom_enfant,
          nom_mere,
          age_mois,
          sexe,
          province,
          territoire,
          partenaire,
          village,
          site_cs,
          date_enregistrement
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          beneficiaireId,
          numero_enregistrement,
          nom_enfant,
          nom_mere,
          age_mois,
          sexe,
          province,
          territoire,
          partenaire,
          village,
          site_cs
        ]
      );
      
      // Calculer la date de fin (6 mois après l'enregistrement)
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setMonth(dateFin.getMonth() + 6);
      
      // Générer un numéro de ration
      const numeroRation = `R-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Insérer la ration
      const rationId = uuidv4();
      await connection.execute(
        `INSERT INTO nutrition_rations (
          id,
          beneficiaire_id,
          numero_carte,
          date_debut,
          date_fin,
          statut
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rationId,
          beneficiaireId,
          numeroRation,
          dateDebut,
          dateFin,
          'ACTIF'
        ]
      );
      
      // Valider la transaction
      await connection.commit();
      
      // Récupérer les données complètes du bénéficiaire
      const [rows] = await connection.execute(
        `SELECT 
          nb.*, 
          nr.id as ration_id, 
          nr.numero_carte as numero_ration, 
          nr.date_debut, 
          nr.date_fin, 
          nr.statut
        FROM nutrition_beneficiaires nb
        LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
        WHERE nb.id = ?`,
        [beneficiaireId]
      );
      
      // Libérer la connexion
      connection.release();
      
      if (rows.length > 0) {
        // Formater la réponse
        const beneficiary = rows[0];
        
        // Extraire les données de ration
        const ration = {
          id: beneficiary.ration_id,
          numero_ration: beneficiary.numero_ration,
          date_debut: beneficiary.date_debut,
          date_fin: beneficiary.date_fin,
          statut: beneficiary.statut
        };
        
        // Supprimer les champs de ration de l'objet principal
        delete beneficiary.ration_id;
        delete beneficiary.numero_ration;
        delete beneficiary.date_debut;
        delete beneficiary.date_fin;
        delete beneficiary.statut;
        
        // Ajouter les rations comme un tableau
        beneficiary.nutrition_rations = [ration];
        
        res.status(201).json({
          success: true,
          message: 'Bénéficiaire de nutrition enregistré avec succès',
          data: beneficiary
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des données du bénéficiaire après enregistrement'
        });
      }
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du bénéficiaire de nutrition:', error);
    
    // Libérer la connexion en cas d'erreur
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Enregistrer une distribution de nutrition
app.post('/api/nutrition/distributions', async (req, res) => {
  let connection;
  try {
    const {
      ration_id,
      date_distribution,
      cycle,
      quantite,
      pb,
      observations
    } = req.body;
    
    console.log('Enregistrement d\'une nouvelle distribution de nutrition:', req.body);
    
    // Créer une connexion à la base de données
    connection = await pool.getConnection();
    
    // Démarrer une transaction
    await connection.beginTransaction();
    
    try {
      // Insérer la distribution
      const distributionId = uuidv4();
      await connection.execute(
        `INSERT INTO nutrition_distributions (
          id,
          ration_id,
          date_distribution,
          cycle,
          quantite,
          pb,
          observations
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          distributionId,
          ration_id,
          date_distribution,
          cycle,
          quantite,
          pb,
          observations
        ]
      );
      
      // Valider la transaction
      await connection.commit();
      
      // Récupérer les données de la distribution
      const [rows] = await connection.execute(
        `SELECT * FROM nutrition_distributions WHERE id = ?`,
        [distributionId]
      );
      
      // Libérer la connexion
      connection.release();
      
      if (rows.length > 0) {
        res.status(201).json({
          success: true,
          message: 'Distribution de nutrition enregistrée avec succès',
          data: rows[0]
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des données de la distribution après enregistrement'
        });
      }
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la distribution de nutrition:', error);
    
    // Libérer la connexion en cas d'erreur
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Endpoint pour récupérer les distributions
app.get('/api/distributions', async (req, res) => {
  let connection;
  try {
    console.log('Récupération des distributions');
    
    connection = await pool.getConnection();
    
    // Récupérer les distributions avec les informations des ménages et des bénéficiaires
    const [distributions] = await connection.query(`
      SELECT d.id, d.household_id, d.distribution_date, d.status,
             h.token_number, h.household_name, h.first_name, h.last_name,
             s.name as site_name, s.id as site_id
      FROM distributions d
      JOIN households h ON d.household_id = h.id
      JOIN sites s ON h.site_id = s.id
      ORDER BY d.distribution_date DESC
      LIMIT 100
    `);
    
    console.log(`${distributions.length} distributions récupérées`);
    
    res.status(200).json({
      success: true,
      data: distributions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des distributions: ' + error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Point de contrôle de santé: http://localhost:${PORT}/api/health`);
});
