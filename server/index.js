const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration de la base de données
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  user: process.env.VITE_DB_USER || 'root',
  password: process.env.VITE_DB_PASSWORD || '',
  database: process.env.VITE_DB_NAME || 'BenefApp',
  port: parseInt(process.env.VITE_DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
