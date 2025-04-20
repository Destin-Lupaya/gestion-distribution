import { Request, Response, Router } from 'express';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get nutrition report data
router.get('/report', async (_req: Request, res: Response) => {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Query to get nutrition report data
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
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching nutrition report:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get nutrition beneficiary by registration number
router.get('/beneficiaires/:numeroEnregistrement', async (req: Request, res: Response) => {
  try {
    const { numeroEnregistrement } = req.params;
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Query to get beneficiary and their ration information
    const [rows] = await connection.execute(
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

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      // Format the response to match what the frontend expects
      const beneficiary = rows[0] as any;
      
      // Extract ration data
      const ration = {
        id: beneficiary.ration_id,
        numero_carte: beneficiary.numero_carte,
        date_debut: beneficiary.date_debut,
        date_fin: beneficiary.date_fin,
        statut: beneficiary.statut
      };
      
      // Remove ration fields from the main object
      delete beneficiary.ration_id;
      delete beneficiary.numero_carte;
      delete beneficiary.date_debut;
      delete beneficiary.date_fin;
      delete beneficiary.statut;
      
      // Add rations array
      beneficiary.nutrition_rations = ration.id ? [ration] : [];
      
      res.status(200).json({ data: beneficiary });
    } else {
      res.status(404).json({ error: 'Bénéficiaire non trouvé' });
    }
  } catch (error) {
    console.error('Error fetching nutrition beneficiary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get nutrition distributions by ration ID
router.get('/distributions/:rationId', async (req: Request, res: Response) => {
  try {
    const { rationId } = req.params;
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Query to get distributions for a ration
    const [rows] = await connection.execute(
      `SELECT * FROM nutrition_distributions 
       WHERE ration_id = ? 
       ORDER BY date_distribution DESC`,
      [rationId]
    );

    await connection.end();
    
    res.status(200).json({ data: rows });
  } catch (error) {
    console.error('Error fetching nutrition distributions:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Register a new nutrition beneficiary
router.post('/register-beneficiary', async (req: Request, res: Response) => {
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
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Generate UUID for the beneficiary
      const beneficiaireId = uuidv4();
      
      // Insert beneficiary
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
      
      // Generate a ration card number
      const numeroRation = `NUT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Calculate dates (e.g., 6 months program)
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setMonth(dateFin.getMonth() + 6);
      
      // Insert ration
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
          uuidv4(),
          beneficiaireId,
          numeroRation,
          dateDebut.toISOString().split('T')[0],
          dateFin.toISOString().split('T')[0],
          'ACTIF'
        ]
      );
      
      // Commit transaction
      await connection.commit();
      
      res.status(201).json({ 
        success: true, 
        message: 'Bénéficiaire enregistré avec succès',
        beneficiaire_id: beneficiaireId
      });
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error registering nutrition beneficiary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Record a nutrition distribution
router.post('/distributions', async (req: Request, res: Response) => {
  try {
    const { 
      ration_id, 
      date_distribution, 
      cycle, 
      quantite, 
      pb, 
      observations 
    } = req.body;
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Insert distribution
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
        uuidv4(),
        ration_id,
        date_distribution,
        cycle,
        quantite,
        pb || null,
        observations || null
      ]
    );
    
    await connection.end();
    
    res.status(201).json({ 
      success: true, 
      message: 'Distribution enregistrée avec succès' 
    });
  } catch (error) {
    console.error('Error recording nutrition distribution:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
