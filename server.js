// Simple Express server to handle API requests
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const path = require('path');

// Nous implémenterons directement les routes nécessaires dans ce fichier
// au lieu d'essayer d'importer les routes TypeScript

const app = express();
const PORT = process.env.PORT || 3001;

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      multipleStatements: true
    });

    // Créer la table sites si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table sites créée ou vérifiée.');

    // Créer la table programmes si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS programmes (
        id VARCHAR(36) PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        description TEXT,
        date_debut DATE,
        date_fin DATE,
        statut ENUM('actif', 'inactif', 'terminé') DEFAULT 'actif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('Table programmes créée ou vérifiée.');

    // Vérifier si la colonne signature existe dans la table distributions
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'distributions' AND COLUMN_NAME = 'signature'
    `, [process.env.DB_NAME || 'gestion_distribution']);

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
    console.log('Initialisation de la base de données terminée');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Initialiser la base de données au démarrage du serveur
initializeDatabase();

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

// Implémentation directe des routes nécessaires

// Route pour rechercher un bénéficiaire de nutrition par numéro d'enregistrement
app.get('/api/nutrition/beneficiaires/:numeroEnregistrement', async (req, res) => {
  try {
    const { numeroEnregistrement } = req.params;
    console.log(`Recherche du bénéficiaire de nutrition avec le numéro d'enregistrement: '${numeroEnregistrement}'`);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    let rows = [];

    try {
      // Vérifier si la table nutrition_beneficiaires existe
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'nutrition_beneficiaires'"
      );
      
      if (tables.length === 0) {
        console.error("La table nutrition_beneficiaires n'existe pas!");
        await connection.end();
        return res.status(500).json({ error: "Table nutrition_beneficiaires non trouvée" });
      }
      
      // Vérifier les bénéficiaires existants (pour le débogage)
      const [allBeneficiaires] = await connection.query(
        "SELECT numero_enregistrement FROM nutrition_beneficiaires LIMIT 10"
      );
      
      if (allBeneficiaires.length === 0) {
        console.log('Aucun bénéficiaire trouvé dans la base de données');
      } else {
        console.log('Exemples de numéros d\'enregistrement existants:', 
          allBeneficiaires.map(b => b.numero_enregistrement));
      }
      
      // Essayer d'abord avec le numéro exact
      [rows] = await connection.execute(
        `SELECT 
          nb.*, 
          nr.id as ration_id, 
          nr.numero_carte, 
          nr.date_debut, 
          nr.date_fin, 
          nr.statut
        FROM nutrition_beneficiaires nb
        LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
        WHERE nb.numero_enregistrement = ?`,
        [numeroEnregistrement]
      );
      
      console.log(`Recherche avec '${numeroEnregistrement}': ${rows.length} résultat(s)`);
      
      // Si aucun résultat, essayer avec le format alternatif (avec ou sans 'R-')
      if (rows.length === 0) {
        let altFormat;
        if (numeroEnregistrement.startsWith('R-')) {
          // Essayer sans le préfixe 'R-'
          altFormat = numeroEnregistrement.substring(2);
        } else {
          // Essayer avec le préfixe 'R-'
          altFormat = `R-${numeroEnregistrement}`;
        }
        
        console.log(`Tentative avec format alternatif: '${altFormat}'`);
        
        [rows] = await connection.execute(
          `SELECT 
            nb.*, 
            nr.id as ration_id, 
            nr.numero_carte, 
            nr.date_debut, 
            nr.date_fin, 
            nr.statut
          FROM nutrition_beneficiaires nb
          LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
          WHERE nb.numero_enregistrement = ?`,
          [altFormat]
        );
        
        console.log(`Recherche avec '${altFormat}': ${rows.length} résultat(s)`);
      }
    } catch (err) {
      console.error('Erreur lors de la requête SQL:', err);
      await connection.end();
      return res.status(500).json({ error: `Erreur de base de données: ${err.message}` });
    } finally {
      await connection.end();
    }

    if (Array.isArray(rows) && rows.length > 0) {
      // Formater la réponse pour correspondre à ce que le frontend attend
      const beneficiary = rows[0];
      
      // Extraire les données de ration
      const ration = {
        id: beneficiary.ration_id,
        numero_carte: beneficiary.numero_carte,
        date_debut: beneficiary.date_debut,
        date_fin: beneficiary.date_fin,
        statut: beneficiary.statut
      };
      
      // Supprimer les champs de ration de l'objet principal
      delete beneficiary.ration_id;
      delete beneficiary.numero_carte;
      delete beneficiary.date_debut;
      delete beneficiary.date_fin;
      delete beneficiary.statut;
      
      // Ajouter le tableau de rations
      beneficiary.nutrition_rations = ration.id ? [ration] : [];
      
      res.status(200).json({ data: beneficiary });
    } else {
      res.status(404).json({ error: 'Bénéficiaire non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche du bénéficiaire de nutrition:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Endpoint pour récupérer les éléments du waybill
app.get('/api/waybill-items', async (req, res) => {
  try {
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si la table waybill_items existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'waybill_items'
    `, [process.env.DB_NAME || 'gestion_distribution']);
    
    if (tables.length === 0) {
      console.log('La table waybill_items n\'existe pas, retour de données de test');
      // Si la table n'existe pas, retourner des données de test
      const testData = [
        {
          id: 1,
          waybill_number: 'WB001',
          batchnumber: 'B001',
          commodity_specific: 'Farine',
          type: 'Standard',
          quantity_sent: 100,
          unit_sent: 'sacs',
          tonne_sent: 2.5,
          quantity: 98,
          unit_received: 'sacs',
          tonne_received: 2.45,
          obs: 'RAS',
          loss: 2,
          mount_in: 0,
          return_qty: 0,
          activity: 'Distribution',
          date: '2023-01-15',
          location: 'Entrepôt A'
        },
        {
          id: 2,
          waybill_number: 'WB002',
          batchnumber: 'B002',
          commodity_specific: 'Haricot',
          type: 'Premium',
          quantity_sent: 50,
          unit_sent: 'sacs',
          tonne_sent: 2.5,
          quantity: 49,
          unit_received: 'sacs',
          tonne_received: 2.45,
          obs: 'Un sac endommagé',
          loss: 1,
          mount_in: 0,
          return_qty: 0,
          activity: 'Distribution',
          date: '2023-01-20',
          location: 'Entrepôt B'
        },
        {
          id: 3,
          waybill_number: 'WB003',
          batchnumber: 'B003',
          commodity_specific: 'Huile',
          type: 'Standard',
          quantity_sent: 200,
          unit_sent: 'cartons',
          tonne_sent: 4,
          quantity: 195,
          unit_received: 'cartons',
          tonne_received: 3.9,
          obs: 'Cinq cartons endommagés',
          loss: 5,
          mount_in: 0,
          return_qty: 0,
          activity: 'Distribution',
          date: '2023-02-05',
          location: 'Entrepôt C'
        }
      ];
      
      return res.json(testData);
    } else {
      // Si la table existe, récupérer les données réelles
      const [rows] = await connection.query(`
        SELECT * FROM waybill_items
        ORDER BY date DESC
      `);
      
      await connection.end();
      return res.json(rows);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des waybill items:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des waybill items' });
  }
});

// Endpoint pour ajouter un nouvel élément waybill
app.post('/api/waybill-items', async (req, res) => {
  try {
    const waybillItem = req.body;
    console.log('Ajout d\'un nouvel élément waybill:', waybillItem);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si la table waybill_items existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'waybill_items'
    `, [process.env.DB_NAME || 'gestion_distribution']);
    
    if (tables.length === 0) {
      // Si la table n'existe pas, la créer
      console.log('Création de la table waybill_items');
      await connection.query(`
        CREATE TABLE waybill_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          waybill_number VARCHAR(50),
          batchnumber VARCHAR(50),
          commodity_specific VARCHAR(100),
          type VARCHAR(50),
          quantity_sent FLOAT,
          unit_sent VARCHAR(50),
          tonne_sent FLOAT,
          quantity FLOAT,
          unit_received VARCHAR(50),
          tonne_received FLOAT,
          obs TEXT,
          loss FLOAT,
          mount_in FLOAT,
          return_qty FLOAT,
          activity VARCHAR(100),
          date DATE,
          location VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Insérer le nouvel élément
    const [result] = await connection.query(
      `INSERT INTO waybill_items (
        waybill_number, batchnumber, commodity_specific, type, 
        quantity_sent, unit_sent, tonne_sent, quantity, 
        unit_received, tonne_received, obs, loss, 
        mount_in, return_qty, activity, date, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        waybillItem.waybill_number,
        waybillItem.batchnumber,
        waybillItem.commodity_specific,
        waybillItem.type,
        waybillItem.quantity_sent,
        waybillItem.unit_sent,
        waybillItem.tonne_sent,
        waybillItem.quantity,
        waybillItem.unit_received,
        waybillItem.tonne_received,
        waybillItem.obs,
        waybillItem.loss,
        waybillItem.mount_in,
        waybillItem.return_qty,
        waybillItem.activity,
        waybillItem.date,
        waybillItem.location
      ]
    );
    
    // Récupérer l'élément inséré avec son ID
    const [rows] = await connection.query(
      'SELECT * FROM waybill_items WHERE id = ?',
      [result.insertId]
    );
    
    await connection.end();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un waybill item:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout d\'un waybill item' });
  }
});

// Endpoint pour mettre à jour un élément waybill existant
app.put('/api/waybill-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const waybillItem = req.body;
    console.log(`Mise à jour de l'élément waybill ${id}:`, waybillItem);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si la table waybill_items existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'waybill_items'
    `, [process.env.DB_NAME || 'gestion_distribution']);
    
    if (tables.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Table waybill_items non trouvée' });
    }
    
    // Mettre à jour l'élément
    await connection.query(
      `UPDATE waybill_items SET
        waybill_number = ?,
        batchnumber = ?,
        commodity_specific = ?,
        type = ?,
        quantity_sent = ?,
        unit_sent = ?,
        tonne_sent = ?,
        quantity = ?,
        unit_received = ?,
        tonne_received = ?,
        obs = ?,
        loss = ?,
        mount_in = ?,
        return_qty = ?,
        activity = ?,
        date = ?,
        location = ?
      WHERE id = ?`,
      [
        waybillItem.waybill_number,
        waybillItem.batchnumber,
        waybillItem.commodity_specific,
        waybillItem.type,
        waybillItem.quantity_sent,
        waybillItem.unit_sent,
        waybillItem.tonne_sent,
        waybillItem.quantity,
        waybillItem.unit_received,
        waybillItem.tonne_received,
        waybillItem.obs,
        waybillItem.loss,
        waybillItem.mount_in,
        waybillItem.return_qty,
        waybillItem.activity,
        waybillItem.date,
        waybillItem.location,
        id
      ]
    );
    
    // Récupérer l'élément mis à jour
    const [rows] = await connection.query(
      'SELECT * FROM waybill_items WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Élément waybill non trouvé' });
    }
    
    await connection.end();
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour d\'un waybill item:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour d\'un waybill item' });
  }
});

// Endpoint pour supprimer un élément waybill
app.delete('/api/waybill-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Suppression de l'élément waybill ${id}`);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si la table waybill_items existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'waybill_items'
    `, [process.env.DB_NAME || 'gestion_distribution']);
    
    if (tables.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Table waybill_items non trouvée' });
    }
    
    // Vérifier si l'élément existe
    const [rows] = await connection.query(
      'SELECT * FROM waybill_items WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Élément waybill non trouvé' });
    }
    
    // Supprimer l'élément
    await connection.query(
      'DELETE FROM waybill_items WHERE id = ?',
      [id]
    );
    
    await connection.end();
    res.json({ success: true, message: 'Élément waybill supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un waybill item:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression d\'un waybill item' });
  }
});

// Route pour obtenir les distributions par ID de ration
app.get('/api/nutrition/distributions/:rationId', async (req, res) => {
  try {
    const { rationId } = req.params;
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);

    // Requête pour obtenir les distributions pour une ration
    const [rows] = await connection.execute(
      `SELECT * FROM nutrition_distributions 
       WHERE ration_id = ? 
       ORDER BY date_distribution DESC`,
      [rationId]
    );

    await connection.end();
    
    res.status(200).json({ data: rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions de nutrition:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Route pour enregistrer un nouveau bénéficiaire de nutrition
app.post('/api/nutrition/register-beneficiary', async (req, res) => {
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
    
    // Valider les données requises
    if (!numero_enregistrement || !nom_enfant) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro d\'enregistrement et le nom de l\'enfant sont obligatoires'
      });
    }

    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);

    // Démarrer une transaction
    await connection.beginTransaction();
    
    try {
      // Générer un UUID pour le bénéficiaire
      const beneficiaireId = uuidv4();
      
      // Convertir les valeurs undefined en null pour éviter l'erreur "Bind parameters must not contain undefined"
      const params = [
        beneficiaireId,
        numero_enregistrement || null,
        nom_enfant || null,
        nom_mere || null,
        age_mois !== undefined ? age_mois : null,
        sexe || null,
        province || null,
        territoire || null,
        partenaire || null,
        village || null,
        site_cs || null
      ];
      
      console.log('Paramètres d\'insertion:', params);
      
      // Insérer le bénéficiaire
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
          site_cs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      
      // Générer un numéro de carte de ration
      const numeroRation = `NUT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Calculer les dates (par exemple, programme de 6 mois)
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setMonth(dateFin.getMonth() + 6);
      
      // Paramètres pour l'insertion de la ration
      const rationParams = [
        uuidv4(),
        beneficiaireId,
        numeroRation,
        dateDebut.toISOString().split('T')[0],
        dateFin.toISOString().split('T')[0],
        'ACTIF'
      ];
      
      console.log('Paramètres d\'insertion de ration:', rationParams);
      
      // Insérer la ration
      await connection.execute(
        `INSERT INTO nutrition_rations (
          id, 
          beneficiaire_id, 
          numero_carte, 
          date_debut, 
          date_fin, 
          statut
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        rationParams
      );
      
      // Valider la transaction
      await connection.commit();
      
      res.status(201).json({ 
        success: true, 
        message: 'Bénéficiaire enregistré avec succès',
        beneficiaire_id: beneficiaireId
      });
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      console.error('Erreur détaillée:', error);
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du bénéficiaire de nutrition:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Erreur lors de l\'enregistrement du bénéficiaire'
    });
  }
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
    
    // Le code QR peut contenir soit l'ID du ménage, soit le numéro de jeton
    const connection = await mysql.createConnection(dbConfig);
    
    // Essayer d'abord de trouver par ID
    let [rows] = await connection.query(
      'SELECT h.*, s.nom AS site_name, s.adresse AS site_address FROM households h ' +
      'JOIN sites s ON h.site_id = s.id ' +
      'WHERE h.id = ?',
      [qrCode]
    );
    
    // Si aucun résultat, essayer de trouver par numéro de jeton
    if (rows.length === 0) {
      [rows] = await connection.query(
        'SELECT h.*, s.nom AS site_name, s.adresse AS site_address FROM households h ' +
        'JOIN sites s ON h.site_id = s.id ' +
        'WHERE h.token_number = ?',
        [qrCode]
      );
    }
    
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'QR code not found' });
    }
    
    // Récupérer les informations du bénéficiaire principal
    const household = rows[0];
    const recipientConnection = await mysql.createConnection(dbConfig);
    const [recipients] = await recipientConnection.query(
      'SELECT * FROM recipients WHERE household_id = ? AND is_primary = TRUE LIMIT 1',
      [household.id]
    );
    await recipientConnection.end();
    
    // Combiner les informations du ménage et du bénéficiaire
    const result = {
      ...household,
      recipient: recipients.length > 0 ? recipients[0] : null
    };
    
    res.json({ valid: true, data: result });
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

// Endpoint pour les rapports par groupe d'âge
app.get('/api/reports/age', async (req, res) => {
  try {
    console.log('Requête reçue sur /api/reports/age avec les paramètres:', req.query);
    
    const { startDate, endDate, siteId } = req.query;
    let query = `
      SELECT 
        s.nom as site_name,
        s.adresse as location,
        COUNT(DISTINCT h.id) as household_count,
        SUM(CASE WHEN r.age < 15 THEN 1 ELSE 0 END) as children_0_14,
        SUM(CASE WHEN r.age >= 15 AND r.age <= 24 THEN 1 ELSE 0 END) as youth_15_24,
        SUM(CASE WHEN r.age >= 25 AND r.age <= 44 THEN 1 ELSE 0 END) as adults_25_44,
        SUM(CASE WHEN r.age >= 45 AND r.age <= 64 THEN 1 ELSE 0 END) as adults_45_64,
        SUM(CASE WHEN r.age >= 65 THEN 1 ELSE 0 END) as elderly_65_plus
      FROM distributions d
      JOIN households h ON d.household_id = h.id
      JOIN sites s ON h.site_id = s.id
      LEFT JOIN recipients r ON r.household_id = h.id
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
    
    query += ` GROUP BY s.nom, s.adresse ORDER BY s.nom`;
    
    console.log('Exécution de la requête SQL:', query.replace(/\s+/g, ' '));
    console.log('Paramètres:', params);
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.query(query, params);
      console.log(`Rapport par âge: ${rows.length} résultats trouvés`);
      
      // Si aucun résultat, renvoyer un tableau vide plutôt qu'une erreur
      if (rows.length === 0) {
        console.log('Aucun résultat trouvé pour les critères spécifiés');
      } else {
        // Log du premier résultat pour vérifier la structure
        console.log('Premier résultat:', rows[0]);
      }
      
      res.json(rows);
    } catch (dbError) {
      console.error('Erreur SQL:', dbError);
      throw dbError;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching age report:', error);
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

// Route pour enregistrer une distribution manuellement
app.post('/api/register-distribution', async (req, res) => {
  let connection;
  try {
    console.log('Requête reçue sur /api/register-distribution avec les données:', JSON.stringify(req.body, null, 2));
    
    const {
      site_id,
      site_name,
      site_address,
      household_id,
      household_name,
      token_number,
      beneficiary_count,
      first_name,
      middle_name,
      last_name,
      alternate_recipient,
      signature
    } = req.body;
    
    // Validation des champs obligatoires
    if (!household_id || !signature) {
      console.log('Validation échouée: champs obligatoires manquants', {
        household_id,
        signature: signature ? 'présent' : 'manquant'
      });
      return res.status(400).json({ error: 'Identifiant du ménage et signature sont requis' });
    }

    console.log('Validation des champs réussie, connexion à la base de données...');
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true // Permettre plusieurs requêtes en une seule connexion
    });
    
    try {
      // Démarrer une transaction pour assurer l'intégrité des données
      await connection.beginTransaction();
      
      // 1. Vérifier/créer le site si nécessaire
      let actualSiteId = site_id;
      if (!actualSiteId && site_name) {
        const [sites] = await connection.query('SELECT id FROM sites WHERE nom = ?', [site_name]);
        if (sites.length > 0) {
          actualSiteId = sites[0].id;
          console.log('Site existant trouvé:', actualSiteId);
        } else {
          // Créer un nouveau site
          const [result] = await connection.query(
            'INSERT INTO sites (nom, adresse) VALUES (?, ?)',
            [site_name, site_address || '']
          );
          actualSiteId = result.insertId; // Récupérer l'ID auto-incrémenté
          console.log('Nouveau site créé:', actualSiteId);
        }
      }
      
      // 2. Vérifier/créer le ménage (household)
      let actualHouseholdId;
      const [households] = await connection.query(
        'SELECT id FROM households WHERE household_id = ? OR token_number = ?',
        [household_id, token_number || household_id]
      );
      
      if (households.length > 0) {
        actualHouseholdId = households[0].id;
        console.log('Ménage existant trouvé:', actualHouseholdId);
        // Mettre à jour les informations du ménage si nécessaire
        await connection.query(
          'UPDATE households SET household_name = ?, site_id = ?, beneficiary_count = ?, first_name = ?, middle_name = ?, last_name = ?, site_address = ?, alternate_recipient = ? WHERE id = ?',
          [
            household_name || household_id,
            actualSiteId,
            beneficiary_count || 1,
            first_name || '',
            middle_name || null,
            last_name || '',
            site_address || '',
            alternate_recipient || null,
            actualHouseholdId
          ]
        );
      } else {
        // Créer un nouveau ménage
        const householdUuid = uuidv4();
        await connection.query(
          'INSERT INTO households (id, household_id, household_name, token_number, site_id, beneficiary_count, first_name, middle_name, last_name, site_address, alternate_recipient, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            householdUuid,
            household_id,
            household_name || household_id,
            token_number || household_id,
            actualSiteId,
            beneficiary_count || 1,
            first_name || '',
            middle_name || null,
            last_name || '',
            site_address || '',
            alternate_recipient || null,
            new Date()
          ]
        );
        actualHouseholdId = householdUuid;
        console.log('Nouveau ménage créé:', actualHouseholdId);
      }
      
      // 3. Vérifier/créer le bénéficiaire principal (recipient)
      let recipientId;
      const [recipients] = await connection.query(
        'SELECT id FROM recipients WHERE household_id = ?',
        [actualHouseholdId]
      );
      
      if (recipients.length > 0) {
        recipientId = recipients[0].id;
        console.log('Bénéficiaire principal existant trouvé, ID:', recipientId);
        
        // Mettre à jour les informations du bénéficiaire
        await connection.query(
          'UPDATE recipients SET first_name = ?, middle_name = ?, last_name = ? WHERE id = ?',
          [first_name || '', middle_name || null, last_name || '', recipientId]
        );
      } else {
        // Créer un nouveau recipient avec un ID numérique (int)
        const [result] = await connection.query(
          'INSERT INTO recipients (household_id, first_name, middle_name, last_name, genre, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            actualHouseholdId,
            first_name || '',
            middle_name || null,
            last_name || '',
            'M', // Genre par défaut
            new Date(),
            new Date()
          ]
        );
        recipientId = result.insertId; // Récupérer l'ID auto-incrémenté
        console.log('Nouveau recipient créé avec ID:', recipientId);
      }
      
      // 4. Créer la signature
      let signatureId;
      console.log('Enregistrement de la signature');
      try {
        const [result] = await connection.query(
          'INSERT INTO signatures (household_id, recipient_id, signature_data, created_at) VALUES (?, ?, ?, ?)',
          [actualHouseholdId, recipientId, signature, new Date()]
        );
        signatureId = result.insertId; // Récupérer l'ID auto-incrémenté
        console.log('Signature enregistrée avec ID:', signatureId);
      } catch (error) {
        console.log('Erreur lors de l\'enregistrement de la signature:', error.message);
        throw new Error('Impossible d\'enregistrer la signature: ' + error.message);
      }
      
      // 5. Créer la distribution
      const distributionId = uuidv4();
      const now = new Date();
      console.log('Création d\'une nouvelle distribution avec ID:', distributionId);
      
      try {
        await connection.query(
          'INSERT INTO distributions (id, household_id, recipient_id, signature_id, distribution_date, signature, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            distributionId,
            actualHouseholdId,
            recipientId,
            signatureId,
            now,
            signature,
            'pending',
            now,
            now
          ]
        );
        
        console.log('Distribution enregistrée avec succès, ID:', distributionId);
        
        // Valider la transaction
        await connection.commit();
        
        // Répondre avec succès
        res.status(201).json({
          success: true,
          message: 'Distribution enregistrée avec succès',
          data: {
            distribution_id: distributionId,
            household_id: actualHouseholdId,
            distribution_date: now
          }
        });
      } catch (error) {
        // Annuler la transaction en cas d'erreur
        await connection.rollback();
        console.error('Erreur détaillée lors de l\'enregistrement de la distribution:', error);
        console.error('Message d\'erreur:', error.message);
        console.error('Code d\'erreur SQL:', error.code);
        console.error('Numéro d\'erreur SQL:', error.errno);
        console.error('Requête SQL ayant échoué:', error.sql);
        
        throw error; // Propager l'erreur pour être capturée par le bloc catch externe
      }
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      console.error('Erreur lors de l\'enregistrement de la distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement de la distribution: ' + error.message
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  } catch (error) {
    console.error('Erreur globale:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de la distribution: ' + error.message
    });
  }
});

// Route pour rechercher des bénéficiaires par token ou nom
app.get('/api/beneficiaires/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Un terme de recherche est requis' });
    }
    
    console.log(`Recherche de bénéficiaires avec le terme: ${query}`);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Requête pour rechercher les bénéficiaires par token ou nom
    const [rows] = await connection.execute(`
      SELECT 
        h.id as household_id,
        h.nom_menage as nom_du_menage,
        h.token_number,
        r.id as recipient_id,
        r.first_name as prenom,
        r.middle_name as deuxieme_nom,
        r.last_name as nom,
        CONCAT(r.first_name, ' ', IFNULL(r.middle_name, ''), ' ', r.last_name) as nom_complet,
        s.nom as site_de_distribution,
        s.id as site_id,
        s.adresse
      FROM households h
      LEFT JOIN recipients r ON h.id = r.household_id
      LEFT JOIN sites s ON h.site_distribution_id = s.id
      WHERE 
        h.token_number LIKE ? OR
        h.nom_menage LIKE ? OR
        CONCAT(r.first_name, ' ', IFNULL(r.middle_name, ''), ' ', r.last_name) LIKE ?
      LIMIT 20
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
    
    await connection.end();
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la recherche de bénéficiaires:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Routes pour la nutrition
// Récupérer le rapport de nutrition
app.get('/api/nutrition/report', async (req, res) => {
  try {
    console.log('Récupération du rapport de nutrition');
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
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
    
    await connection.end();
    
    // Renvoyer les données
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de nutrition:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Récupérer un bénéficiaire de nutrition par son numéro d'enregistrement
app.get('/api/nutrition/beneficiaires/:numeroEnregistrement', async (req, res) => {
  try {
    const { numeroEnregistrement } = req.params;
    console.log(`Recherche du bénéficiaire de nutrition avec le numéro d'enregistrement: ${numeroEnregistrement}`);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
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
    
    await connection.end();
    
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
    res.status(500).json({ error: String(error) });
  }
});

// Récupérer les distributions de nutrition pour une ration donnée
app.get('/api/nutrition/distributions/:rationId', async (req, res) => {
  try {
    const { rationId } = req.params;
    console.log(`Récupération des distributions de nutrition pour la ration: ${rationId}`);
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Requête pour obtenir les distributions
    const [rows] = await connection.execute(
      `SELECT * FROM nutrition_distributions WHERE ration_id = ? ORDER BY date_distribution`,
      [rationId]
    );
    
    await connection.end();
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des distributions de nutrition:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Enregistrer un nouveau bénéficiaire de nutrition
app.post('/api/nutrition/register-beneficiary', async (req, res) => {
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
    const connection = await mysql.createConnection(dbConfig);
    
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
      
      await connection.end();
      
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
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du bénéficiaire de nutrition:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Enregistrer une distribution de nutrition
app.post('/api/nutrition/distributions', async (req, res) => {
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
    const connection = await mysql.createConnection(dbConfig);
    
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
      
      await connection.end();
      
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
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la distribution de nutrition:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Sites endpoints
app.get('/api/sites', async (_req, res) => {
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

// Endpoint pour récupérer les événements de distribution
app.get('/api/evenements-distribution', async (req, res) => {
  console.log('!!!!!!!!!! /API/EVENEMENTS-DISTRIBUTION ENDPOINT HIT !!!!!!!!!!');
  try {

    // Create a connection for this endpoint
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connection established for /api/evenements-distribution');

    // DEBUG: Log dbConfig and Describe sites and programmes tables
    console.log('Current dbConfig for this endpoint:', JSON.stringify(dbConfig, null, 2));
    const databaseName = dbConfig.database || process.env.DB_NAME || 'gestion_distribution';
    console.log(`Attempting to DESCRIBE tables in database: ${databaseName}...`);
    try {
      console.log(`Executing: DESCRIBE ${databaseName}.sites;`);
      const [sitesDesc] = await connection.query(`DESCRIBE ${databaseName}.sites;`);
      console.log('DESCRIBE sites Result:', JSON.stringify(sitesDesc, null, 2));

      console.log(`Executing: DESCRIBE ${databaseName}.programmes;`);
      const [programmesDesc] = await connection.query(`DESCRIBE ${databaseName}.programmes;`);
      console.log('DESCRIBE programmes Result:', JSON.stringify(programmesDesc, null, 2));
    } catch (describeError) {
      console.error('Error during DESCRIBE tables:', describeError);
      // Log and continue, the main query might still fail and give more info
    }

    // Drop the table if it exists to ensure fresh creation with the correct schema
    try {
      console.log('Attempting to DROP TABLE IF EXISTS evenements_distribution...');
      await connection.query('DROP TABLE IF EXISTS evenements_distribution;');
      console.log('Table evenements_distribution dropped successfully (if it existed).');
    } catch (dropError) {
      console.error('Error dropping evenements_distribution table:', dropError.message);
      // If drop fails, something is seriously wrong, but we might still try to create
    }

    // Vérifier si la table evenements_distribution existe (this check is now somewhat redundant but harmless)
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'evenements_distribution'
    `, [dbConfig.database || 'gestion_distribution']);
    
    // Always attempt to create the table now, as we've dropped it.
    // The original if (tables.length === 0) is effectively always true for the CREATE part.
    // We'll keep the structure for clarity of what was intended for an 'IF NOT EXISTS' scenario.
    if (true) { // Force creation after drop
      // Si la table n'existe pas, la créer
      await connection.query(`
        CREATE TABLE IF NOT EXISTS evenements_distribution (
          evenement_id VARCHAR(36) PRIMARY KEY,
          programme_id VARCHAR(36) NOT NULL,
          site_id INT NOT NULL,
          date_distribution_prevue DATE NOT NULL,
          heure_debut_prevue TIME NULL,
          heure_fin_prevue TIME NULL,
          type_assistance_prevue VARCHAR(255) NOT NULL,
          quantite_totale_prevue JSON NULL,
          statut_evenement ENUM('Planifié', 'En cours', 'Terminé', 'Annulé') DEFAULT 'Planifié',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
        )
      `);
      
      // Insérer quelques données de test
      await connection.query(`
        INSERT INTO evenements_distribution (
          evenement_id, 
          programme_id, 
          site_id, 
          date_distribution_prevue, 
          heure_debut_prevue, 
          heure_fin_prevue, 
          type_assistance_prevue, 
          quantite_totale_prevue,
          statut_evenement
        )
        SELECT 
          UUID(), 
          p.id,
          s.id,
          DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY), 
          '09:00:00',
          '16:00:00',
          'Ration alimentaire standard',
          '{"riz": 500, "huile": 200, "sel": 100}',
          'Planifié'
        FROM sites s, programmes p
        LIMIT 5
      `);
      
      console.log('Table evenements_distribution créée et données de test insérées');
    }
    
    // Récupérer les données
    const [rows] = await connection.query(`
      SELECT 
        evenement_id,
        programme_id,
        site_id,
        date_distribution_prevue,
        heure_debut_prevue,
        heure_fin_prevue,
        type_assistance_prevue,
        quantite_totale_prevue,
        statut_evenement AS statut,
        created_at,
        updated_at
      FROM evenements_distribution
      ORDER BY date_distribution_prevue DESC
    `);
    
    console.log(`${rows.length} événements de distribution trouvés`);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements de distribution:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Route pour récupérer tous les emplacements disponibles
app.get('/api/locations', async (req, res) => {
  try {
    console.log('Récupération des emplacements');
    const connection = await mysql.createConnection(dbConfig);
    
    // Récupérer les emplacements uniques depuis la table appropriée
    // Nous regardons dans les tables distributions et waybill_items pour trouver tous les emplacements
    const [distributionLocations] = await connection.query(
      `SELECT DISTINCT location FROM distributions WHERE location IS NOT NULL`
    );
    
    const [waybillLocations] = await connection.query(
      `SELECT DISTINCT delivery_location FROM waybill_items WHERE delivery_location IS NOT NULL`
    );
    
    // Fusionner les emplacements des deux sources
    const locations = new Set();
    
    distributionLocations.forEach(item => {
      if (item.location && item.location.trim() !== '') {
        locations.add(item.location);
      }
    });
    
    waybillLocations.forEach(item => {
      if (item.delivery_location && item.delivery_location.trim() !== '') {
        locations.add(item.delivery_location);
      }
    });
    
    // Convertir le Set en tableau
    const uniqueLocations = Array.from(locations);
    
    await connection.end();
    res.json(uniqueLocations);
  } catch (error) {
    console.error('Erreur lors de la récupération des emplacements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des emplacements' });
  }
});

// Route pour obtenir les données de comparaison de tonnage entre Waybill et MPOS
app.get('/api/reports/tonnage-comparison', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    
    console.log(`Génération du rapport de comparaison de tonnage du ${startDate} au ${endDate}${location ? ' pour ' + location : ''}`);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construire la clause WHERE pour filtrer par emplacement si nécessaire
    let locationFilter = '';
    if (location && location !== '') {
      locationFilter = ' AND (w.delivery_location = ? OR d.location = ?)';
    }
    
    // Requête pour obtenir les données de tonnage depuis les tables waybill_items et distribution_items
    const queryParams = [startDate, endDate];
    
    if (location && location !== '') {
      queryParams.push(location, location);
    }
    
    // Requête pour obtenir les données de Waybill
    let waybillQuery = `
      SELECT 
        commodity_name,
        SUM(quantity) as total_quantity
      FROM 
        waybill_items w
      WHERE 
        delivery_date BETWEEN ? AND ?${locationFilter}
      GROUP BY 
        commodity_name
    `;
    
    // Requête pour obtenir les données de MPOS
    let mposQuery = `
      SELECT 
        commodity_name,
        SUM(quantity) as total_quantity
      FROM 
        distribution_items di
      JOIN 
        distributions d ON di.distribution_id = d.id
      WHERE 
        d.distribution_date BETWEEN ? AND ?${locationFilter}
      GROUP BY 
        commodity_name
    `;
    
    // Exécuter les requêtes
    const [waybillResults] = await connection.query(waybillQuery, queryParams);
    const [mposResults] = await connection.query(mposQuery, queryParams);
    
    // Construire un objet pour faciliter la comparaison
    const commodities = new Set();
    const waybillData = {};
    const mposData = {};
    
    // Traiter les données de Waybill
    waybillResults.forEach(item => {
      const commodity = item.commodity_name;
      commodities.add(commodity);
      waybillData[commodity] = parseFloat(item.total_quantity || 0);
    });
    
    // Traiter les données de MPOS
    mposResults.forEach(item => {
      const commodity = item.commodity_name;
      commodities.add(commodity);
      mposData[commodity] = parseFloat(item.total_quantity || 0);
    });
    
    // Calculer les métriques
    let totalWaybillTonnage = 0;
    let totalMposTonnage = 0;
    let totalHouseholds = 0;
    let totalBeneficiaries = 0;
    
    // Requête pour obtenir les totaux de ménages et bénéficiaires
    const [totals] = await connection.query(
      `SELECT 
        COUNT(DISTINCT household_id) as total_households,
        SUM(beneficiaries_count) as total_beneficiaries
      FROM 
        distributions
      WHERE 
        distribution_date BETWEEN ? AND ?${locationFilter}`,
      queryParams
    );
    
    if (totals.length > 0) {
      totalHouseholds = parseInt(totals[0].total_households || 0);
      totalBeneficiaries = parseInt(totals[0].total_beneficiaries || 0);
    }
    
    // Créer les données de comparaison
    const data = [];
    commodities.forEach(commodity => {
      const waybillTonnage = waybillData[commodity] || 0;
      const mposTonnage = mposData[commodity] || 0;
      const difference = waybillTonnage - mposTonnage;
      
      totalWaybillTonnage += waybillTonnage;
      totalMposTonnage += mposTonnage;
      
      // Générer une recommandation en fonction de la différence
      let recommendation = '';
      if (difference > 0) {
        recommendation = 'Vérifier l\'utilisation des ressources';
      } else if (difference < 0) {
        recommendation = 'Vérifier les entrées de Waybill';
      } else {
        recommendation = 'Parfait équilibre';
      }
      
      data.push({
        commodity,
        waybillTonnage,
        mposTonnage,
        difference,
        recommendation
      });
    });
    
    // Calculer la différence totale
    const totalDifference = totalWaybillTonnage - totalMposTonnage;
    
    await connection.end();
    
    res.json({
      data,
      totalWaybillTonnage,
      totalMposTonnage,
      totalDifference,
      totalHouseholds,
      totalBeneficiaries
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de comparaison de tonnage:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport de comparaison de tonnage' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
});
