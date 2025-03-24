const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { REQUIRED_COLUMNS, suggestColumnMapping, validateExcelColumns, validateExcelData } = require('./lib/excelMapping');
require('dotenv').config();

const app = express();

// Configuration CORS plus permissive en développement
const corsOptions = {
  origin: true, // Permet toutes les origines en développement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les gros fichiers
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

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour initialiser la base de données
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database successfully');
    
    // Créer la table sites si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Sites table checked/created');

    // Créer la table households si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS households (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_name VARCHAR(255) NOT NULL,
        household_id VARCHAR(255) NOT NULL,
        token_number VARCHAR(50) NOT NULL,
        beneficiary_count INT NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_token (token_number),
        UNIQUE KEY unique_household (site_name, household_id)
      )
    `);
    console.log('Households table checked/created');

    // Mettre à jour la table si elle existe déjà
    try {
      // Vérifier si les nouvelles colonnes existent
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'households'
      `);
      
      const columnNames = columns.map(col => col.COLUMN_NAME.toLowerCase());
      
      // Ajouter les nouvelles colonnes si elles n'existent pas
      if (!columnNames.includes('first_name')) {
        await connection.query('ALTER TABLE households ADD COLUMN first_name VARCHAR(255) NOT NULL AFTER beneficiary_count');
      }
      if (!columnNames.includes('middle_name')) {
        await connection.query('ALTER TABLE households ADD COLUMN middle_name VARCHAR(255) NOT NULL AFTER first_name');
      }
      if (!columnNames.includes('last_name')) {
        await connection.query('ALTER TABLE households ADD COLUMN last_name VARCHAR(255) NOT NULL AFTER middle_name');
      }
      
      // Renommer les colonnes existantes
      if (columnNames.includes('site_id')) {
        await connection.query('ALTER TABLE households CHANGE COLUMN site_id site_name VARCHAR(255) NOT NULL');
      }
      if (columnNames.includes('household_name')) {
        await connection.query('ALTER TABLE households CHANGE COLUMN household_name household_id VARCHAR(255) NOT NULL');
      }
      if (columnNames.includes('number_of_beneficiaries')) {
        await connection.query('ALTER TABLE households CHANGE COLUMN number_of_beneficiaries beneficiary_count INT NOT NULL');
      }
      
      console.log('Households table structure updated');
    } catch (error) {
      console.error('Error updating households table:', error);
    }

    // Créer la table recipients si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recipients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        household_id INT NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      )
    `);
    console.log('Recipients table checked/created');

    // Créer la table distributions si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS distributions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_id INT,
        distribution_date DATE NOT NULL,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
      )
    `);
    console.log('Distributions table checked/created');

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1); // Arrêter le serveur en cas d'erreur de base de données
  }
};

// Initialiser la base de données au démarrage
initializeDatabase();

// Middleware pour vérifier la connexion à la base de données
const checkDatabaseConnection = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
};

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
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Appliquer le middleware de vérification de connexion à toutes les routes API
app.use('/api', checkDatabaseConnection);

// Routes API
app.get('/api/sites', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM sites ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sites', async (req, res) => {
  try {
    const { nom, adresse } = req.body;
    if (!nom) {
      return res.status(400).json({ error: 'Le nom du site est requis' });
    }

    const [result] = await pool.execute(
      'INSERT INTO sites (name, address) VALUES (?, ?)',
      [nom, adresse || null]
    );

    const [newSite] = await pool.execute(
      'SELECT * FROM sites WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSite[0]);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/households', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM households ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recipients', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM recipients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/distributions', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM distributions ORDER BY distribution_date DESC');
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

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
