const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://10.243.10.228:5173'],
  credentials: true
}));

app.use(express.json());

// Configuration de la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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

// Routes pour les rapports
app.get('/api/reports/distribution', async (req, res) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    let query = `
      SELECT 
        d.distribution_date,
        s.name as site_name,
        s.location,
        COUNT(DISTINCT h.id) as household_count,
        COUNT(DISTINCT r.id) as recipient_count,
        d.items_distributed
      FROM distributions d
      LEFT JOIN sites s ON d.site_id = s.id
      LEFT JOIN households h ON h.site_id = s.id
      LEFT JOIN recipients r ON r.household_id = h.id
      WHERE 1=1
    `;
    
    const params = [];
    if (startDate) {
      query += ` AND d.distribution_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND d.distribution_date <= ?`;
      params.push(endDate);
    }
    if (siteId) {
      query += ` AND s.id = ?`;
      params.push(siteId);
    }
    
    query += ` GROUP BY d.id, d.distribution_date, s.name, s.location ORDER BY d.distribution_date DESC`;
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching distribution report:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/daily', async (req, res) => {
  try {
    const { date, siteId } = req.query;
    let query = `
      SELECT 
        d.distribution_date,
        s.name as site_name,
        COUNT(DISTINCT h.id) as household_count,
        COUNT(DISTINCT r.id) as recipient_count,
        d.items_distributed,
        COUNT(CASE WHEN r.age < 15 THEN 1 END) as children,
        COUNT(CASE WHEN r.age BETWEEN 15 AND 24 THEN 1 END) as youth,
        COUNT(CASE WHEN r.age BETWEEN 25 AND 64 THEN 1 END) as adults,
        COUNT(CASE WHEN r.age >= 65 THEN 1 END) as elderly
      FROM distributions d
      LEFT JOIN sites s ON d.site_id = s.id
      LEFT JOIN households h ON h.site_id = s.id
      LEFT JOIN recipients r ON r.household_id = h.id
      WHERE DATE(d.distribution_date) = ?
    `;
    
    const params = [date];
    if (siteId) {
      query += ` AND s.id = ?`;
      params.push(siteId);
    }
    
    query += ` GROUP BY d.id, d.distribution_date, s.name`;
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/age', async (req, res) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    let query = `
      SELECT 
        COUNT(CASE WHEN age < 15 THEN 1 END) as children_0_14,
        COUNT(CASE WHEN age BETWEEN 15 AND 24 THEN 1 END) as youth_15_24,
        COUNT(CASE WHEN age BETWEEN 25 AND 44 THEN 1 END) as adults_25_44,
        COUNT(CASE WHEN age BETWEEN 45 AND 64 THEN 1 END) as adults_45_64,
        COUNT(CASE WHEN age >= 65 THEN 1 END) as elderly_65_plus,
        s.name as site_name
      FROM recipients r
      JOIN households h ON r.household_id = h.id
      JOIN sites s ON h.site_id = s.id
      JOIN distributions d ON d.site_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    if (startDate) {
      query += ` AND d.distribution_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND d.distribution_date <= ?`;
      params.push(endDate);
    }
    if (siteId) {
      query += ` AND s.id = ?`;
      params.push(siteId);
    }
    
    query += ` GROUP BY s.id, s.name`;
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching age report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test de connexion et démarrage du serveur
async function startServer() {
  try {
    const conn = await pool.getConnection();
    console.log('Connexion à la base de données réussie');
    conn.release();

    app.listen(port, () => {
      console.log(`Serveur démarré sur le port ${port}`);
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
}

startServer();
