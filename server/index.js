const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { REQUIRED_COLUMNS, suggestColumnMapping, validateExcelColumns, validateExcelData } = require('./lib/excelMapping');
require('dotenv').config();

console.log('Configuration de l\'environnement:', {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_NAME: process.env.DB_NAME || 'gestion_distribution',
  DB_PORT: process.env.DB_PORT || '3306'
});

const app = express();

// Configuration CORS plus permissive en développement
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://10.243.10.228:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306'),
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

// Test de la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connexion à la base de données réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    throw error;
  }
}

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  let connection;
  try {
    console.log('Tentative de connexion à MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connexion à MySQL établie avec succès');

    // Créer la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Base de données "${process.env.DB_NAME}" créée ou vérifiée`);

    // Utiliser la base de données
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Base de données "${process.env.DB_NAME}" sélectionnée`);

    // Créer les tables
    await connection.query(`DROP TABLE IF EXISTS distributions`);
    await connection.query(`DROP TABLE IF EXISTS recipients`);
    await connection.query(`DROP TABLE IF EXISTS households`);
    await connection.query(`DROP TABLE IF EXISTS sites`);

    // Créer la table sites
    await connection.query(`
      CREATE TABLE sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table sites créée avec succès');

    // Créer la table households sans clé étrangère
    await connection.query(`
      CREATE TABLE households (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_id INT,
        household_number VARCHAR(50) NOT NULL,
        head_name VARCHAR(255) NOT NULL,
        members_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table households créée avec succès');

    // Créer la table recipients sans clé étrangère
    await connection.query(`
      CREATE TABLE recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        household_id INT,
        name VARCHAR(255) NOT NULL,
        age INT,
        gender VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table recipients créée avec succès');

    // Créer la table distributions sans clé étrangère
    await connection.query(`
      CREATE TABLE distributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_id INT,
        distribution_date DATE NOT NULL,
        items_distributed TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Table distributions créée avec succès');

    // Ajouter les clés étrangères
    await connection.query(`
      ALTER TABLE households
      ADD CONSTRAINT fk_households_site
      FOREIGN KEY (site_id) REFERENCES sites(id)
    `);
    console.log('Clé étrangère ajoutée à households');

    await connection.query(`
      ALTER TABLE recipients
      ADD CONSTRAINT fk_recipients_household
      FOREIGN KEY (household_id) REFERENCES households(id)
    `);
    console.log('Clé étrangère ajoutée à recipients');

    await connection.query(`
      ALTER TABLE distributions
      ADD CONSTRAINT fk_distributions_site
      FOREIGN KEY (site_id) REFERENCES sites(id)
    `);
    console.log('Clé étrangère ajoutée à distributions');

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
    console.log('Tentative de connexion à la base de données...');
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Connexion à la base de données réussie');
    
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
    process.exit(1);
  });

// Appliquer le middleware de vérification de connexion à toutes les routes API
app.use('/api', checkDatabaseConnection);

// Middleware de journalisation
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Route de test de santé
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Vérifier si la table sites existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'sites'
    `, [dbConfig.database]);

    // Vérifier la structure de la table sites si elle existe
    let tableStructure = null;
    if (tables.length > 0) {
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM sites
      `);
      tableStructure = columns;
    }

    connection.release();
    res.json({ 
      status: 'ok', 
      message: 'Server is healthy',
      database: dbConfig.database,
      sitesTableExists: tables.length > 0,
      tableStructure
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      details: error.message 
    });
  }
});

// Routes API
app.get('/api/sites', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/households', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM households ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recipients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recipients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/distributions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM distributions ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching distributions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer un ménage
app.delete('/api/households/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Supprimer le ménage
    const [result] = await connection.execute(
      'DELETE FROM households WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Ménage non trouvé');
    }

    await connection.commit();
    res.json({ message: 'Ménage supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting household:', error);
    res.status(error.message === 'Ménage non trouvé' ? 404 : 500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Route pour créer des ménages et des bénéficiaires à partir des données Excel
app.post('/api/import', async (req, res) => {
  console.log('Requête reçue pour /api/import:', req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { data } = req.body;
    const results = [];

    for (const row of data) {
      // Vérifier si le ménage existe déjà
      const [existingHouseholds] = await connection.query(
        'SELECT id FROM households WHERE site_name = ? AND household_id = ?',
        [row.site_name, row.household_id]
      );

      if (existingHouseholds.length > 0) {
        // Mettre à jour le ménage existant
        await connection.query(
          `UPDATE households 
           SET token_number = ?,
               beneficiary_count = ?,
               first_name = ?,
               middle_name = ?,
               last_name = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            row.token_number,
            parseInt(row.beneficiary_count) || 0,
            row.first_name,
            row.middle_name,
            row.last_name,
            existingHouseholds[0].id
          ]
        );

        results.push({
          success: true,
          householdId: existingHouseholds[0].id,
          message: 'Household updated successfully'
        });
      } else {
        // Créer un nouveau ménage
        const [householdResult] = await connection.query(
          `INSERT INTO households (
            site_name,
            household_id,
            token_number,
            beneficiary_count,
            first_name,
            middle_name,
            last_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            row.site_name,
            row.household_id,
            row.token_number,
            parseInt(row.beneficiary_count) || 0,
            row.first_name,
            row.middle_name,
            row.last_name
          ]
        );

        results.push({
          success: true,
          householdId: householdResult.insertId,
          message: 'Household created successfully'
        });
      }
    }

    await connection.commit();
    console.log('Import terminé avec succès:', results);
    res.json({ 
      success: true, 
      message: 'Import completed successfully',
      results 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error importing data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'importation',
      details: error.message
    });
  } finally {
    connection.release();
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

// Route pour obtenir les statistiques de distribution
app.get('/api/distribution-stats', async (req, res) => {
  console.log('GET /api/distribution-stats called');
  try {
    const connection = await pool.getConnection();
    console.log('Database connection obtained');
    
    const query = `
      SELECT 
        h.site_name as site_distribution,
        COUNT(CASE WHEN d.status = 'distributed' THEN 1 END) as distributed_count,
        COUNT(DISTINCT h.id) as total_count
      FROM households h
      LEFT JOIN distributions d ON h.id = d.household_id
      GROUP BY h.site_name
      ORDER BY h.site_name
    `;
    
    console.log('Executing query:', query);
    const [stats] = await connection.query(query);
    console.log('Query results:', stats);

    connection.release();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching distribution stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Route pour traiter le scan QR
app.post('/api/process-qr-scan', async (req, res) => {
  let connection;
  try {
    console.log('Received QR scan data:', req.body);
    const qrData = req.body.qrData;

    // Essayer de parser les données QR si c'est une chaîne JSON
    let parsedData;
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      console.log('QR data is not JSON, using as is:', qrData);
      parsedData = qrData;
    }

    connection = await pool.getConnection();

    // Rechercher le bénéficiaire avec plusieurs critères possibles
    const [rows] = await connection.query(
      `SELECT * FROM households 
       WHERE id = ? 
       OR (site_name = ? AND household_id = ?)
       OR token_number = ?`,
      [
        parsedData.id || null,
        parsedData.site_name || '',
        parsedData.household_id || '',
        parsedData.token_number || ''
      ]
    );

    console.log('Database query result:', rows);

    if (rows && rows.length > 0) {
      res.json({
        success: true,
        data: rows[0]
      });
    } else {
      console.log('No beneficiary found for data:', parsedData);
      res.status(404).json({
        error: 'Bénéficiaire non trouvé',
        details: 'Aucun bénéficiaire trouvé avec les données fournies'
      });
    }
  } catch (error) {
    console.error('Error processing QR scan:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement du scan QR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Route pour vérifier le statut QR
app.post('/api/check-qr-status', async (req, res) => {
  try {
    const { householdId } = req.body;
    const connection = await pool.getConnection();

    const [distribution] = await connection.query(
      `SELECT d.*, h.site_name 
       FROM distributions d
       JOIN households h ON d.household_id = h.id
       WHERE d.household_id = ? 
       ORDER BY d.distribution_date DESC 
       LIMIT 1`,
      [householdId]
    );

    connection.release();
    res.json(distribution);
  } catch (error) {
    console.error('Error checking QR status:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

// Route pour enregistrer la signature
app.post('/api/record-signature', async (req, res) => {
  try {
    const { householdId, signatureData } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      `INSERT INTO distributions (household_id, signature_data, distribution_date, status) 
       VALUES (?, ?, NOW(), 'distributed')`,
      [householdId, signatureData]
    );

    connection.release();
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording signature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la signature' });
  }
});

// Route pour enregistrer un bénéficiaire manuellement
app.post('/api/register-beneficiary', async (req, res) => {
  let connection;
  try {
    const {
      site_name,
      household_id,
      token_number,
      beneficiary_count,
      first_name,
      middle_name,
      last_name,
      site_address,
      alternate_recipient
    } = req.body;

    // Validation des champs requis
    if (!site_name || !household_id || !token_number || !beneficiary_count || !first_name || !last_name) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    connection = await pool.getConnection();

    // Vérifier si le ménage existe déjà
    const [existing] = await connection.query(
      'SELECT id FROM households WHERE household_id = ? AND site_name = ?',
      [household_id, site_name]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Ce ménage existe déjà' });
    }

    // Insérer le nouveau ménage
    const [result] = await connection.query(
      `INSERT INTO households (
        site_name,
        household_id,
        token_number,
        beneficiary_count,
        first_name,
        middle_name,
        last_name,
        site_address,
        alternate_recipient
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        site_name,
        household_id,
        token_number,
        beneficiary_count,
        first_name,
        middle_name || '',
        last_name,
        site_address || null,
        alternate_recipient || null
      ]
    );

    // Générer le QR code avec toutes les informations
    const qrData = {
      id: result.insertId,
      site_name,
      household_id,
      household_name: `${first_name} ${last_name}`,
      token_number,
      beneficiary_count,
      first_name,
      middle_name,
      last_name,
      site_address,
      alternate_recipient
    };

    res.json({
      success: true,
      message: 'Bénéficiaire enregistré avec succès',
      data: {
        ...qrData,
        qrData: JSON.stringify(qrData)
      }
    });
  } catch (error) {
    console.error('Error registering beneficiary:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement du bénéficiaire',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Route pour enregistrer une distribution manuellement
app.post('/api/register-distribution', async (req, res) => {
  let connection;
  try {
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
    if (!site_name || !household_id || !token_number || !beneficiary_count || !first_name || !last_name || !signature) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    connection = await pool.getConnection();

    // Vérifier si le ménage existe déjà
    const [existing] = await connection.query(
      'SELECT id FROM households WHERE household_id = ? AND site_name = ?',
      [household_id, site_name]
    );

    let householdId;

    // Si le ménage n'existe pas, on le crée
    if (!existing || existing.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO households (
          site_name,
          household_id,
          token_number,
          beneficiary_count,
          first_name,
          middle_name,
          last_name,
          site_address,
          alternate_recipient
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          site_name,
          household_id,
          token_number,
          beneficiary_count,
          first_name,
          middle_name || '',
          last_name,
          site_address || null,
          alternate_recipient || null
        ]
      );
      householdId = result.insertId;
    } else {
      householdId = existing[0].id;
    }

    // Enregistrer la distribution
    await connection.query(
      `INSERT INTO distributions (
        household_id,
        distribution_date,
        status,
        signature_data
      ) VALUES (?, NOW(), 'distributed', ?)`,
      [householdId, signature]
    );

    res.json({
      success: true,
      message: 'Distribution enregistrée avec succès',
      data: {
        household_id: householdId
      }
    });
  } catch (error) {
    console.error('Error registering distribution:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement de la distribution',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3001;
testConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  });
