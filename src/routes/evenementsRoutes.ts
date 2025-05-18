import express from 'express';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// GET - Récupérer tous les événements de distribution
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier d'abord si la table existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'evenements_distribution'
    `, [dbConfig.database]);
    
    if (Array.isArray(tables) && tables.length === 0) {
      await connection.end();
      console.error('La table evenements_distribution n\'existe pas');
      return res.status(500).json({ 
        success: false, 
        error: 'La table evenements_distribution n\'existe pas' 
      });
    }
    
    // Récupérer la structure de la table pour utiliser les bons noms de colonnes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'evenements_distribution'
    `, [dbConfig.database]);
    
    console.log('Colonnes disponibles dans la table evenements_distribution:', columns);
    
    // Utiliser une requête plus robuste qui s'adapte aux noms de colonnes disponibles
    const [rows] = await connection.query(`
      SELECT 
        ed.evenement_id,
        ed.programme_id,
        pa.nom_programme,
        ed.site_id,
        s.nom AS nom_site,
        ed.date_distribution_prevue,
        ed.heure_debut_prevue,
        ed.heure_fin_prevue,
        ed.type_assistance_prevue,
        ed.quantite_totale_prevue,
        ed.statut_evenement,
        ed.date_creation,
        ed.date_modification
      FROM 
        evenements_distribution ed
      JOIN 
        programmes_aide pa ON ed.programme_id = pa.programme_id
      JOIN 
        sites s ON ed.site_id = s.id
      ORDER BY 
        ed.date_distribution_prevue DESC
    `);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des événements' 
    });
  }
});

// GET - Récupérer un événement par ID
router.get('/:evenementId', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(`
      SELECT 
        ed.evenement_id,
        ed.programme_id,
        pa.nom_programme,
        ed.site_id,
        s.nom AS nom_site,
        ed.date_distribution_prevue,
        ed.heure_debut_prevue,
        ed.heure_fin_prevue,
        ed.type_assistance_prevue,
        ed.quantite_totale_prevue,
        ed.statut_evenement,
        ed.created_at,
        ed.updated_at
      FROM 
        evenements_distribution ed
      JOIN 
        programmes_aide pa ON ed.programme_id = pa.programme_id
      JOIN 
        sites s ON ed.site_id = s.id
      WHERE 
        ed.evenement_id = ?
    `, [evenementId]);
    await connection.end();
    
    if (Array.isArray(rows) && rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'événement' 
    });
  }
});

// GET - Récupérer les bénéficiaires d'un événement
router.get('/:evenementId/beneficiaires', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'événement existe
    const [evenement] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Récupérer les bénéficiaires de l'événement
    const [rows] = await connection.query(`
      SELECT 
        r.id AS beneficiaire_id,
        r.household_id,
        h.token_number,
        h.nom_menage AS household_name,
        r.first_name,
        r.middle_name,
        r.last_name,
        COALESCE(led.statut_eligibilite, 'Eligible') AS statut_eligibilite
      FROM 
        recipients r
      JOIN 
        households h ON r.household_id = h.id
      JOIN 
        sites s ON h.site_id = s.id
      LEFT JOIN 
        listes_eligibles_distribution led ON led.beneficiaire_id = r.id AND led.evenement_id = ?
      WHERE 
        s.id = (SELECT site_id FROM evenements_distribution WHERE evenement_id = ?)
      ORDER BY 
        h.token_number
    `, [evenementId, evenementId]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des bénéficiaires:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des bénéficiaires' 
    });
  }
});

// POST - Créer un nouvel événement
router.post('/', async (req, res) => {
  try {
    const { 
      programme_id, 
      site_id, 
      date_distribution_prevue, 
      heure_debut_prevue, 
      heure_fin_prevue, 
      type_assistance_prevue, 
      quantite_totale_prevue, 
      statut_evenement 
    } = req.body;
    
    // Validation des champs obligatoires
    if (!programme_id || !site_id || !date_distribution_prevue || !type_assistance_prevue) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
    }
    
    const evenementId = uuidv4();
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si le programme existe
    const [programme] = await connection.query(`
      SELECT * FROM programmes_aide 
      WHERE programme_id = ?
    `, [programme_id]);
    
    if (Array.isArray(programme) && programme.length === 0) {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Programme non trouvé' 
      });
    }
    
    // Vérifier si le site existe
    const [site] = await connection.query(`
      SELECT * FROM sites 
      WHERE id = ?
    `, [site_id]);
    
    if (Array.isArray(site) && site.length === 0) {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Site non trouvé' 
      });
    }
    
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      evenementId,
      programme_id,
      site_id,
      date_distribution_prevue,
      heure_debut_prevue || null,
      heure_fin_prevue || null,
      type_assistance_prevue,
      JSON.stringify(quantite_totale_prevue || {}),
      statut_evenement || 'Planifié'
    ]);
    
    await connection.end();
    
    res.status(201).json({ 
      success: true, 
      message: 'Événement créé avec succès', 
      evenementId 
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'événement' 
    });
  }
});

// PUT - Mettre à jour un événement
router.put('/:evenementId', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const { 
      programme_id, 
      site_id, 
      date_distribution_prevue, 
      heure_debut_prevue, 
      heure_fin_prevue, 
      type_assistance_prevue, 
      quantite_totale_prevue, 
      statut_evenement 
    } = req.body;
    
    // Validation des champs obligatoires
    if (!programme_id || !site_id || !date_distribution_prevue || !type_assistance_prevue) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'événement existe
    const [evenement] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    await connection.query(`
      UPDATE evenements_distribution 
      SET 
        programme_id = ?, 
        site_id = ?, 
        date_distribution_prevue = ?, 
        heure_debut_prevue = ?, 
        heure_fin_prevue = ?, 
        type_assistance_prevue = ?, 
        quantite_totale_prevue = ?, 
        statut_evenement = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE evenement_id = ?
    `, [
      programme_id,
      site_id,
      date_distribution_prevue,
      heure_debut_prevue || null,
      heure_fin_prevue || null,
      type_assistance_prevue,
      JSON.stringify(quantite_totale_prevue || {}),
      statut_evenement || 'Planifié',
      evenementId
    ]);
    
    await connection.end();
    
    res.json({ 
      success: true, 
      message: 'Événement mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour de l\'événement' 
    });
  }
});

// DELETE - Supprimer un événement
router.delete('/:evenementId', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'événement existe
    const [evenement] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Vérifier si l'événement a des assistances distribuées
    const [assistances] = await connection.query(`
      SELECT * FROM assistances_distribuees 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(assistances) && assistances.length > 0) {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer cet événement car des assistances ont déjà été distribuées' 
      });
    }
    
    // Supprimer les listes éligibles associées
    await connection.query(`
      DELETE FROM listes_eligibles_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    // Supprimer l'événement
    await connection.query(`
      DELETE FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    await connection.end();
    
    res.json({ 
      success: true, 
      message: 'Événement supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'événement' 
    });
  }
});

// POST - Générer la liste des bénéficiaires éligibles pour un événement
router.post('/:evenementId/generer-liste', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const { criteres_eligibilite } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'événement existe
    const [evenement] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Appeler la procédure stockée pour générer la liste
    await connection.query(`
      CALL generer_liste_eligibles(?, ?)
    `, [
      evenementId,
      JSON.stringify(criteres_eligibilite || {})
    ]);
    
    await connection.end();
    
    res.json({ 
      success: true, 
      message: 'Liste des bénéficiaires éligibles générée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la liste des bénéficiaires:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération de la liste des bénéficiaires' 
    });
  }
});

export default router;
