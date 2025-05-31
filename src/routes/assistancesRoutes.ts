import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Créer le router en utilisant Router directement
const router = Router();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// GET - Récupérer toutes les assistances distribuées
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(`
      SELECT * FROM v_assistances_beneficiaires
      ORDER BY date_reception_effective DESC, heure_reception_effective DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des assistances:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des assistances' 
    });
  }
});

// GET - Récupérer les assistances par événement
router.get('/evenement/:evenementId', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(`
      SELECT * FROM v_assistances_beneficiaires
      WHERE evenement_id = ?
      ORDER BY date_reception_effective DESC, heure_reception_effective DESC
    `, [evenementId]);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des assistances:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des assistances' 
    });
  }
});

// GET - Récupérer les assistances par bénéficiaire
router.get('/beneficiaire/:beneficiaireId', async (req, res) => {
  try {
    const { beneficiaireId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(`
      SELECT * FROM v_assistances_beneficiaires
      WHERE beneficiaire_id = ?
      ORDER BY date_reception_effective DESC, heure_reception_effective DESC
    `, [beneficiaireId]);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des assistances:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des assistances' 
    });
  }
});

// GET - Récupérer une assistance par ID
router.get('/:assistanceId', async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(`
      SELECT * FROM v_assistances_beneficiaires
      WHERE assistance_id = ?
    `, [assistanceId]);
    await connection.end();
    
    if (Array.isArray(rows) && rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Assistance non trouvée' 
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'assistance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'assistance' 
    });
  }
});

// POST - Créer une nouvelle assistance
router.post('/', async (req, res) => {
  let connection;
  try {
    const { 
      evenement_id, 
      beneficiaire_id, 
      household_id, 
      articles_recus, 
      quantite_recue, 
      agent_distributeur_id, 
      mode_verification, 
      notes_distribution 
    } = req.body;
    
    // Validation des champs obligatoires
    if (!evenement_id || !beneficiaire_id || !household_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
    }
    
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    
    // Vérifier si l'événement existe
    const [evenement] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE evenement_id = ?
    `, [evenement_id]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Vérifier si le bénéficiaire existe
    const [beneficiaire] = await connection.query(`
      SELECT * FROM recipients 
      WHERE id = ?
    `, [beneficiaire_id]);
    
    if (Array.isArray(beneficiaire) && beneficiaire.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Bénéficiaire non trouvé' 
      });
    }
    
    // Vérifier si le ménage existe
    const [menage] = await connection.query(`
      SELECT * FROM households 
      WHERE id = ?
    `, [household_id]);
    
    if (Array.isArray(menage) && menage.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Ménage non trouvé' 
      });
    }
    
    // Vérifier si l'assistance existe déjà pour ce bénéficiaire et cet événement
    const [assistanceExistante] = await connection.query(`
      SELECT * FROM assistances_distribuees 
      WHERE evenement_id = ? AND beneficiaire_id = ?
    `, [evenement_id, beneficiaire_id]);
    
    if (Array.isArray(assistanceExistante) && assistanceExistante.length > 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        error: 'Une assistance a déjà été distribuée à ce bénéficiaire pour cet événement' 
      });
    }
    
    // Créer l'assistance
    const assistanceId = uuidv4();
    
    await connection.query(`
      INSERT INTO assistances_distribuees (
        assistance_id,
        evenement_id,
        beneficiaire_id,
        household_id,
        date_reception_effective,
        heure_reception_effective,
        articles_recus,
        quantite_recue,
        agent_distributeur_id,
        mode_verification,
        notes_distribution
      ) VALUES (?, ?, ?, ?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?)
    `, [
      assistanceId,
      evenement_id,
      beneficiaire_id,
      household_id,
      JSON.stringify(articles_recus || {}),
      quantite_recue || 1,
      agent_distributeur_id || null,
      mode_verification || 'Signature',
      notes_distribution || null
    ]);
    
    // Mettre à jour le statut dans la liste éligible
    await connection.query(`
      INSERT INTO listes_eligibles_distribution (
        evenement_id,
        beneficiaire_id,
        household_id,
        statut_eligibilite
      ) VALUES (?, ?, ?, 'Servi')
      ON DUPLICATE KEY UPDATE statut_eligibilite = 'Servi'
    `, [
      evenement_id,
      beneficiaire_id,
      household_id
    ]);
    
    await connection.commit();
    await connection.end();
    
    res.status(201).json({ 
      success: true, 
      message: 'Assistance enregistrée avec succès', 
      assistanceId 
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'assistance:', error);
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'enregistrement de l\'assistance' 
    });
  }
});

// DELETE - Supprimer une assistance
router.delete('/:assistanceId', async (req, res) => {
  let connection;
  try {
    const { assistanceId } = req.params;
    
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    
    // Récupérer les informations de l'assistance
    const [assistance] = await connection.query(`
      SELECT * FROM assistances_distribuees 
      WHERE assistance_id = ?
    `, [assistanceId]);
    
    if (Array.isArray(assistance) && assistance.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Assistance non trouvée' 
      });
    }
    
    const assistanceData = assistance[0] as any;
    
    // Mettre à jour le statut dans la liste éligible
    await connection.query(`
      UPDATE listes_eligibles_distribution 
      SET statut_eligibilite = 'Eligible' 
      WHERE evenement_id = ? AND beneficiaire_id = ?
    `, [
      assistanceData.evenement_id,
      assistanceData.beneficiaire_id
    ]);
    
    // Supprimer l'assistance
    await connection.query(`
      DELETE FROM assistances_distribuees 
      WHERE assistance_id = ?
    `, [assistanceId]);
    
    await connection.commit();
    await connection.end();
    
    res.json({ 
      success: true, 
      message: 'Assistance supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'assistance:', error);
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'assistance' 
    });
  }
});

// GET - Statistiques des assistances par événement
router.get('/statistiques/evenement/:evenementId', async (req, res) => {
  try {
    const { evenementId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    
    // Récupérer les informations de l'événement
    const [evenement] = await connection.query(`
      SELECT 
        ed.*,
        pa.nom_programme,
        s.nom AS nom_site
      FROM 
        evenements_distribution ed
      JOIN 
        programmes_aide pa ON ed.programme_id = pa.programme_id
      JOIN 
        sites s ON ed.site_id = s.id
      WHERE 
        ed.evenement_id = ?
    `, [evenementId]);
    
    if (Array.isArray(evenement) && evenement.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Compter le nombre total de bénéficiaires éligibles
    const [totalEligibles] = await connection.query(`
      SELECT COUNT(*) AS total
      FROM listes_eligibles_distribution
      WHERE evenement_id = ?
    `, [evenementId]);
    
    // Compter le nombre de bénéficiaires servis
    const [servis] = await connection.query(`
      SELECT COUNT(*) AS total
      FROM listes_eligibles_distribution
      WHERE evenement_id = ? AND statut_eligibilite = 'Servi'
    `, [evenementId]);
    
    // Compter le nombre de bénéficiaires non servis
    const [nonServis] = await connection.query(`
      SELECT COUNT(*) AS total
      FROM listes_eligibles_distribution
      WHERE evenement_id = ? AND statut_eligibilite != 'Servi'
    `, [evenementId]);
    
    // Statistiques par sexe (si disponible)
    const [statsParSexe] = await connection.query(`
      SELECT 
        r.sexe,
        COUNT(*) AS total
      FROM 
        assistances_distribuees ad
      JOIN 
        recipients r ON ad.beneficiaire_id = r.id
      WHERE 
        ad.evenement_id = ?
      GROUP BY 
        r.sexe
    `, [evenementId]);
    
    await connection.end();
    
    res.json({
      evenement: evenement[0],
      statistiques: {
        total_eligibles: (totalEligibles as any)[0].total,
        total_servis: (servis as any)[0].total,
        total_non_servis: (nonServis as any)[0].total,
        pourcentage_couverture: ((servis as any)[0].total / (totalEligibles as any)[0].total) * 100,
        stats_par_sexe: statsParSexe
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

export default router;
