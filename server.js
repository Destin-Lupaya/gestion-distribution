// Simple Express server to handle API requests
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://10.243.10.228:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Test database connection
async function testDbConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

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
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM sites');
    await connection.end();
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
    
    const connection = await mysql.createConnection(dbConfig);
    const id = uuidv4();
    await connection.query(
      'INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)',
      [id, name, address || '']
    );
    await connection.end();
    
    res.status(201).json({ id, name, address });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Get all households
app.get('/api/households', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM households');
    await connection.end();
    
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
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM households WHERE token_number = ?',
      [token]
    );
    await connection.end();
    
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
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM households WHERE site_id = ?',
      [siteId]
    );
    await connection.end();
    
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
    
    const connection = await mysql.createConnection(dbConfig);
    const id = uuidv4();
    await connection.query(
      'INSERT INTO households (id, site_id, household_name, token_number, beneficiary_count) VALUES (?, ?, ?, ?, ?)',
      [id, site_id, household_name, token_number, beneficiary_count || 1]
    );
    await connection.end();
    
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

// Get all recipients
app.get('/api/recipients', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM recipients');
    await connection.end();
    
    // If no recipients exist yet, return empty array instead of error
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

// Get recipients by household
app.get('/api/recipients/household/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM recipients WHERE household_id = ?',
      [householdId]
    );
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipients by household:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

// Create a new recipient
app.post('/api/recipients', async (req, res) => {
  try {
    const { household_id, first_name, middle_name, last_name, is_alternate } = req.body;
    
    if (!household_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'Household ID, first name, and last name are required' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    const id = uuidv4();
    await connection.query(
      'INSERT INTO recipients (id, household_id, first_name, middle_name, last_name, is_alternate) VALUES (?, ?, ?, ?, ?, ?)',
      [id, household_id, first_name, middle_name || '', last_name, is_alternate || false]
    );
    await connection.end();
    
    res.status(201).json({ 
      id, 
      household_id, 
      first_name, 
      middle_name, 
      last_name, 
      is_alternate 
    });
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({ error: 'Failed to create recipient' });
  }
});

// Delete a recipient
app.delete('/api/recipients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    await connection.query('DELETE FROM recipients WHERE id = ?', [id]);
    await connection.end();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ error: 'Failed to delete recipient' });
  }
});

// Get all distributions
app.get('/api/distributions', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM distributions');
    await connection.end();
    
    // If no distributions exist yet, return empty array instead of error
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching distributions:', error);
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

// Get distribution by ID
app.get('/api/distributions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM distributions WHERE id = ?',
      [id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// Create a new distribution
app.post('/api/distributions', async (req, res) => {
  try {
    const { household_id, recipient_id, site_id, distribution_date, items, signature } = req.body;
    
    if (!household_id || !site_id) {
      return res.status(400).json({ error: 'Household ID and site ID are required' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    const id = uuidv4();
    await connection.query(
      'INSERT INTO distributions (id, household_id, recipient_id, site_id, distribution_date, items, signature) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        household_id, 
        recipient_id || null, 
        site_id, 
        distribution_date || new Date().toISOString().split('T')[0], 
        JSON.stringify(items || []), 
        signature || null
      ]
    );
    await connection.end();
    
    res.status(201).json({ 
      id, 
      household_id, 
      recipient_id, 
      site_id, 
      distribution_date, 
      items, 
      signature 
    });
  } catch (error) {
    console.error('Error creating distribution:', error);
    res.status(500).json({ error: 'Failed to create distribution' });
  }
});

// Validate QR code
app.post('/api/validate-qr', async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM households WHERE household_id = ?',
      [qrCode]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'QR code not found' });
    }
    
    res.json({ valid: true, data: rows[0] });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({ error: 'Failed to validate QR code' });
  }
});

// Suggest column mapping for CSV import
app.post('/api/suggest-mapping', (req, res) => {
  try {
    const { headers } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: 'Headers array is required' });
    }
    
    // Define required columns for a valid import
    const requiredColumns = [
      'household_id',
      'site_name',
      'household_name',
      'token_number',
      'beneficiary_count',
      'first_name',
      'last_name'
    ];
    
    // Define possible header variations for each required column
    const headerMappings = {
      'household_id': ['household_id', 'id', 'menage_id', 'household id', 'id menage', 'identifiant'],
      'site_name': ['site_name', 'site', 'nom_site', 'site name', 'nom du site', 'location'],
      'household_name': ['household_name', 'nom_menage', 'household name', 'nom du menage', 'family name', 'nom de famille'],
      'token_number': ['token_number', 'token', 'numero_jeton', 'token number', 'numero de jeton', 'jeton'],
      'beneficiary_count': ['beneficiary_count', 'beneficiaries', 'nombre_beneficiaires', 'beneficiary count', 'nombre de beneficiaires', 'count'],
      'first_name': ['first_name', 'prenom', 'firstname', 'given name', 'prenom'],
      'last_name': ['last_name', 'nom', 'lastname', 'family name', 'nom de famille']
    };
    
    // Normalize headers (lowercase, remove spaces)
    const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
    
    // Create mapping
    const mapping = {};
    const missingColumns = [];
    
    // For each required column, find a matching header
    for (const requiredCol of requiredColumns) {
      const possibleMatches = headerMappings[requiredCol];
      const matchIndex = normalizedHeaders.findIndex(h => 
        possibleMatches.some(match => h.includes(match))
      );
      
      if (matchIndex !== -1) {
        mapping[headers[matchIndex]] = requiredCol;
      } else {
        missingColumns.push(requiredCol);
      }
    }
    
    // Return the mapping, validity status, and missing columns if any
    res.json({
      mapping,
      isValid: missingColumns.length === 0,
      missingColumns
    });
    
  } catch (error) {
    console.error('Error suggesting mapping:', error);
    res.status(500).json({ error: 'Failed to suggest mapping' });
  }
});

// Validate imported data
app.post('/api/validate-data', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        isValid: false, 
        errors: ['Aucune donnée à valider'] 
      });
    }
    
    const errors = [];
    const requiredFields = [
      'household_id', 
      'site_name', 
      'household_name', 
      'token_number', 
      'beneficiary_count'
    ];
    
    // Validate each row
    data.forEach((row, index) => {
      // Check required fields
      for (const field of requiredFields) {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push(`Ligne ${index + 1}: Le champ "${field}" est obligatoire`);
        }
      }
      
      // Validate beneficiary_count is a number
      if (row.beneficiary_count && isNaN(Number(row.beneficiary_count))) {
        errors.push(`Ligne ${index + 1}: Le nombre de bénéficiaires doit être un nombre`);
      }
      
      // Validate token_number format (if present)
      if (row.token_number && !/^[A-Za-z0-9-]+$/.test(row.token_number)) {
        errors.push(`Ligne ${index + 1}: Le numéro de jeton contient des caractères invalides`);
      }
    });
    
    // Check for duplicate household_id
    const householdIds = new Set();
    data.forEach((row, index) => {
      if (row.household_id) {
        if (householdIds.has(row.household_id)) {
          errors.push(`Ligne ${index + 1}: ID de ménage en double "${row.household_id}"`);
        } else {
          householdIds.add(row.household_id);
        }
      }
    });
    
    // Return validation result
    res.json({
      isValid: errors.length === 0,
      errors: errors
    });
    
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ 
      isValid: false, 
      errors: ['Erreur lors de la validation des données'] 
    });
  }
});

// Endpoint d'importation des données (GET pour vérification de disponibilité)
app.get('/api/import', async (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Import API is available',
    timestamp: new Date().toISOString()
  });
});

// Endpoint pour les rapports de distribution
app.get('/api/reports/distribution', async (req, res) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    let query = `
      SELECT 
        d.distribution_date as distribution_date,
        s.nom as site_name,
        s.adresse as location,
        COUNT(DISTINCT h.id) as household_count,
        COUNT(DISTINCT r.id) as recipient_count,
        GROUP_CONCAT(DISTINCT i.nom SEPARATOR ', ') as items_distributed
      FROM distributions d
      JOIN households h ON d.household_id = h.id
      JOIN sites s ON h.site_id = s.id
      LEFT JOIN recipients r ON r.household_id = h.id
      LEFT JOIN distribution_items di ON d.id = di.distribution_id
      LEFT JOIN items i ON di.item_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    if (startDate) {
      query += ` AND DATE(d.distribution_date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(d.distribution_date) <= ?`;
      params.push(endDate);
    }
    if (siteId) {
      query += ` AND s.id = ?`;
      params.push(siteId);
    }
    
    query += ` GROUP BY d.id, d.distribution_date, s.nom, s.adresse ORDER BY d.distribution_date DESC`;
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(query, params);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching distribution report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour les rapports quotidiens
app.get('/api/reports/daily', async (req, res) => {
  try {
    const { date, startDate, endDate, siteId } = req.query;
    let query = `
      SELECT 
        DATE(d.distribution_date) as distribution_date,
        s.nom as site_name,
        s.adresse as location,
        COUNT(DISTINCT h.id) as household_count,
        SUM(h.beneficiary_count) as total_beneficiaries,
        COUNT(DISTINCT d.id) as distribution_count,
        COUNT(DISTINCT di.id) as items_count
      FROM distributions d
      JOIN households h ON d.household_id = h.id
      JOIN sites s ON h.site_id = s.id
      LEFT JOIN distribution_items di ON d.id = di.distribution_id
      WHERE 1=1
    `;
    
    const params = [];
    if (date) {
      query += ` AND DATE(d.distribution_date) = ?`;
      params.push(date);
    }
    if (startDate) {
      query += ` AND DATE(d.distribution_date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(d.distribution_date) <= ?`;
      params.push(endDate);
    }
    if (siteId) {
      query += ` AND s.id = ?`;
      params.push(siteId);
    }
    
    query += ` GROUP BY DATE(d.distribution_date), s.nom, s.adresse ORDER BY distribution_date DESC`;
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(query, params);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint simple pour vérifier les données dans la table distributions
app.get('/api/distributions/check', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM distributions');
    const [sample] = await connection.query('SELECT * FROM distributions LIMIT 5');
    await connection.end();
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
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM households');
    const [sample] = await connection.query('SELECT * FROM households LIMIT 5');
    await connection.end();
    res.json({
      count: rows[0].count,
      sample: sample
    });
  } catch (error) {
    console.error('Error checking households:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint d'importation des données (POST pour l'importation réelle)
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
    const connection = await mysql.createConnection(dbConfig);
    
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
          // Ne pas générer d'ID, laisser MySQL utiliser l'auto-increment
          await connection.query(
            'INSERT INTO sites (nom, adresse) VALUES (?, ?)',
            [siteName, siteAddress]
          );
          
          // Récupérer l'ID généré
          const [newSites] = await connection.query(
            'SELECT id FROM sites WHERE nom = ?',
            [siteName]
          );
          siteId = newSites[0].id;
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
            'INSERT INTO households (id, household_id, household_name, nom_menage, token_number, site_id, beneficiary_count, nombre_beneficiaires, first_name, middle_name, last_name, site_address, alternate_recipient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              householdDbId, 
              householdIdFromExcel, 
              householdName, 
              householdName, 
              tokenNumber, 
              siteId, 
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
    
    await connection.end();
    
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
});
