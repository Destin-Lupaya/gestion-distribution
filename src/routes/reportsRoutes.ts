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

// GET - Rapport de distribution
router.get('/distribution', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    
    // Validation des paramètres
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les dates de début et de fin sont requises' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construction de la requête SQL avec des paramètres optionnels
    let query = `
      SELECT 
        s.nom AS site,
        COUNT(DISTINCT d.recipient_id) AS beneficiaries,
        COUNT(DISTINCT d.household_id) AS households,
        c.nom AS commodity_name,
        SUM(dc.quantity) AS quantity
      FROM 
        distributions d
      JOIN 
        sites s ON d.site_id = s.id
      JOIN 
        distribution_commodities dc ON d.id = dc.distribution_id
      JOIN 
        commodities c ON dc.commodity_id = c.id
      WHERE 
        d.distribution_date BETWEEN ? AND ?
    `;
    
    const queryParams: any[] = [startDate, endDate];
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      query += ' AND d.site_id = ?';
      queryParams.push(siteId);
    }
    
    // Grouper par site et commodité
    query += ' GROUP BY s.nom, c.nom';
    
    const [rows] = await connection.query(query, queryParams);
    
    // Transformer les données pour le format attendu par le frontend
    const sitesMap = new Map();
    
    // Parcourir les résultats et organiser par site
    (rows as any[]).forEach(row => {
      if (!sitesMap.has(row.site)) {
        sitesMap.set(row.site, {
          site: row.site,
          beneficiaries: row.beneficiaries,
          households: row.households,
          commodities: []
        });
      }
      
      // Ajouter la commodité au site
      const site = sitesMap.get(row.site);
      site.commodities.push({
        name: row.commodity_name,
        quantity: row.quantity
      });
    });
    
    // Convertir la Map en tableau
    const result = Array.from(sitesMap.values());
    
    await connection.end();
    res.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport de distribution:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport de distribution: ' + error.message 
    });
  }
});

// GET - Rapport journalier
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate, siteId } = req.query;
    
    // Validation des paramètres
    if ((!date && (!startDate || !endDate))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Une date spécifique ou une plage de dates est requise' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construction de la requête SQL avec des paramètres optionnels
    let query = `
      SELECT 
        DATE(d.distribution_date) AS date,
        s.nom AS site,
        COUNT(DISTINCT d.recipient_id) AS total_beneficiaries,
        COUNT(DISTINCT d.household_id) AS total_households,
        c.nom AS commodity_name,
        SUM(dc.quantity) AS quantity
      FROM 
        distributions d
      JOIN 
        sites s ON d.site_id = s.id
      JOIN 
        distribution_commodities dc ON d.id = dc.distribution_id
      JOIN 
        commodities c ON dc.commodity_id = c.id
      WHERE 
    `;
    
    const queryParams: any[] = [];
    
    // Filtrer par date ou plage de dates
    if (date) {
      query += 'DATE(d.distribution_date) = ?';
      queryParams.push(date);
    } else {
      query += 'd.distribution_date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      query += ' AND d.site_id = ?';
      queryParams.push(siteId);
    }
    
    // Grouper par date, site et commodité
    query += ' GROUP BY DATE(d.distribution_date), s.nom, c.nom';
    
    const [rows] = await connection.query(query, queryParams);
    
    // Transformer les données pour le format attendu par le frontend
    const daysMap = new Map();
    
    // Parcourir les résultats et organiser par date
    (rows as any[]).forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, {
          date: dateKey,
          sites: new Map()
        });
      }
      
      const day = daysMap.get(dateKey);
      
      if (!day.sites.has(row.site)) {
        day.sites.set(row.site, {
          site: row.site,
          total_beneficiaries: row.total_beneficiaries,
          total_households: row.total_households,
          commodities: []
        });
      }
      
      // Ajouter la commodité au site
      const site = day.sites.get(row.site);
      site.commodities.push({
        name: row.commodity_name,
        quantity: row.quantity
      });
    });
    
    // Convertir les Maps en tableaux
    const result = Array.from(daysMap.values()).map(day => ({
      date: day.date,
      sites: Array.from(day.sites.values())
    }));
    
    await connection.end();
    res.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport journalier:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport journalier: ' + error.message 
    });
  }
});

// GET - Rapport par âge
router.get('/age', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    
    // Validation des paramètres
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les dates de début et de fin sont requises' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construction de la requête SQL avec des paramètres optionnels
    let query = `
      SELECT 
        CASE 
          WHEN r.age < 5 THEN '0-4'
          WHEN r.age BETWEEN 5 AND 17 THEN '5-17'
          WHEN r.age BETWEEN 18 AND 59 THEN '18-59'
          ELSE '60+'
        END AS age_group,
        COUNT(d.id) AS count,
        r.gender
      FROM 
        distributions d
      JOIN 
        recipients r ON d.recipient_id = r.id
      WHERE 
        d.distribution_date BETWEEN ? AND ?
    `;
    
    const queryParams: any[] = [startDate, endDate];
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      query += ' AND d.site_id = ?';
      queryParams.push(siteId);
    }
    
    // Grouper par groupe d'âge et genre
    query += ' GROUP BY age_group, r.gender';
    
    const [rows] = await connection.query(query, queryParams);
    
    await connection.end();
    res.json(rows);
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport par âge:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport par âge: ' + error.message 
    });
  }
});

// GET - Rapport de comparaison de tonnage
router.get('/tonnage-comparison', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    
    // Validation des paramètres
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les dates de début et de fin sont requises' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Requête pour obtenir le tonnage des waybills
    let waybillQuery = `
      SELECT 
        c.nom AS commodity_name,
        c.type AS commodity_type,
        SUM(rw.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS tonnage
      FROM 
        reception_waybills rw
      JOIN 
        commodities c ON rw.commodity_id = c.id
      WHERE 
        rw.reception_date BETWEEN ? AND ?
    `;
    
    const waybillParams: any[] = [startDate, endDate];
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      waybillQuery += ' AND rw.site_id = ?';
      waybillParams.push(siteId);
    }
    
    // Grouper par commodité
    waybillQuery += ' GROUP BY c.nom, c.type';
    
    // Requête pour obtenir le tonnage des distributions MPOS
    let mposQuery = `
      SELECT 
        c.nom AS commodity_name,
        c.type AS commodity_type,
        SUM(dc.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS tonnage
      FROM 
        distribution_commodities dc
      JOIN 
        distributions d ON dc.distribution_id = d.id
      JOIN 
        commodities c ON dc.commodity_id = c.id
      WHERE 
        d.distribution_date BETWEEN ? AND ?
    `;
    
    const mposParams: any[] = [startDate, endDate];
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      mposQuery += ' AND d.site_id = ?';
      mposParams.push(siteId);
    }
    
    // Grouper par commodité
    mposQuery += ' GROUP BY c.nom, c.type';
    
    // Exécuter les requêtes
    const [waybillRows] = await connection.query(waybillQuery, waybillParams);
    const [mposRows] = await connection.query(mposQuery, mposParams);
    
    // Requête pour obtenir le nombre de bénéficiaires et ménages
    let beneficiariesQuery = `
      SELECT 
        COUNT(DISTINCT d.recipient_id) AS total_beneficiaries,
        COUNT(DISTINCT d.household_id) AS total_households
      FROM 
        distributions d
      WHERE 
        d.distribution_date BETWEEN ? AND ?
    `;
    
    const beneficiariesParams: any[] = [startDate, endDate];
    
    // Ajouter le filtre de site si spécifié
    if (siteId) {
      beneficiariesQuery += ' AND d.site_id = ?';
      beneficiariesParams.push(siteId);
    }
    
    const [beneficiariesRows] = await connection.query(beneficiariesQuery, beneficiariesParams);
    
    // Transformer les données pour le format attendu par le frontend
    const commoditiesMap = new Map();
    
    // Parcourir les résultats des waybills
    (waybillRows as any[]).forEach(row => {
      commoditiesMap.set(row.commodity_name, {
        commodity_name: row.commodity_name,
        commodity_type: row.commodity_type,
        waybill_tonnage: row.tonnage,
        mpos_tonnage: 0,
        difference: 0,
        recommendation: ''
      });
    });
    
    // Parcourir les résultats des MPOS
    (mposRows as any[]).forEach(row => {
      if (commoditiesMap.has(row.commodity_name)) {
        const commodity = commoditiesMap.get(row.commodity_name);
        commodity.mpos_tonnage = row.tonnage;
        commodity.difference = commodity.waybill_tonnage - commodity.mpos_tonnage;
        
        // Générer une recommandation basée sur la différence
        if (commodity.difference > 0) {
          // Calculer le nombre d'unités (sacs ou cartons) à distribuer
          const unitWeight = commodity.commodity_name.toLowerCase().includes('huile') ? 20 : 
                            commodity.commodity_name.toLowerCase().includes('farine') ? 25 :
                            commodity.commodity_name.toLowerCase().includes('haricot') ? 50 : 25;
          
          const units = Math.round(commodity.difference * 1000 / unitWeight);
          const unitType = commodity.commodity_name.toLowerCase().includes('huile') ? 'carton' : 'sac';
          
          commodity.recommendation = `À distribuer en ${unitType}: ${units}`;
        } else if (commodity.difference < 0) {
          // Calculer le nombre d'unités (sacs ou cartons) à récupérer
          const unitWeight = commodity.commodity_name.toLowerCase().includes('huile') ? 20 : 
                            commodity.commodity_name.toLowerCase().includes('farine') ? 25 :
                            commodity.commodity_name.toLowerCase().includes('haricot') ? 50 : 25;
          
          const units = Math.round(Math.abs(commodity.difference) * 1000 / unitWeight);
          const unitType = commodity.commodity_name.toLowerCase().includes('huile') ? 'carton' : 'sac';
          
          commodity.recommendation = `À récupérer en ${unitType}: ${units}`;
        } else {
          commodity.recommendation = 'Aucune action requise';
        }
      } else {
        // Si la commodité n'existe pas dans les waybills, l'ajouter
        commoditiesMap.set(row.commodity_name, {
          commodity_name: row.commodity_name,
          commodity_type: row.commodity_type,
          waybill_tonnage: 0,
          mpos_tonnage: row.tonnage,
          difference: -row.tonnage,
          recommendation: `À récupérer: ${Math.round(row.tonnage * 1000 / (row.commodity_name.toLowerCase().includes('huile') ? 20 : 25))} ${row.commodity_name.toLowerCase().includes('huile') ? 'cartons' : 'sacs'}`
        });
      }
    });
    
    // Calculer les totaux
    const totals = {
      waybill_tonnage: 0,
      mpos_tonnage: 0,
      difference: 0
    };
    
    commoditiesMap.forEach(commodity => {
      totals.waybill_tonnage += commodity.waybill_tonnage;
      totals.mpos_tonnage += commodity.mpos_tonnage;
    });
    
    totals.difference = totals.waybill_tonnage - totals.mpos_tonnage;
    
    // Préparer le résultat final
    const result = {
      commodities: Array.from(commoditiesMap.values()),
      totals,
      beneficiaries: beneficiariesRows[0]
    };
    
    await connection.end();
    res.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport de comparaison de tonnage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport de comparaison de tonnage: ' + error.message 
    });
  }
});

// GET - Rapport par batch et commodité
router.get('/batch-commodity', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, activity, location } = req.query;
    
    // Validation des paramètres
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les dates de début et de fin sont requises' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construction de la requête SQL avec des paramètres optionnels
    let query = `
      SELECT 
        a.nom AS activity,
        b.batch_number,
        c.nom AS commodity_specific,
        SUM(rw.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS tonnage_sent,
        SUM(im.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS internal_movement,
        SUM(r.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS tonnage_received,
        SUM(ret.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS quantity_returned,
        SUM(l.quantity * 
          CASE 
            WHEN c.nom LIKE '%huile%' THEN 20
            WHEN c.nom LIKE '%farine%' THEN 25
            WHEN c.nom LIKE '%haricot%' THEN 50
            WHEN c.nom LIKE '%sel%' THEN 25
            ELSE 1
          END / 1000) AS losses,
        s.nom AS location
      FROM 
        batches b
      JOIN 
        activities a ON b.activity_id = a.id
      JOIN 
        reception_waybills rw ON b.id = rw.batch_id
      JOIN 
        commodities c ON rw.commodity_id = c.id
      JOIN 
        sites s ON rw.site_id = s.id
      LEFT JOIN 
        internal_movements im ON b.id = im.batch_id AND im.commodity_id = c.id
      LEFT JOIN 
        receptions r ON b.id = r.batch_id AND r.commodity_id = c.id
      LEFT JOIN 
        returns ret ON b.id = ret.batch_id AND ret.commodity_id = c.id
      LEFT JOIN 
        losses l ON b.id = l.batch_id AND l.commodity_id = c.id
      WHERE 
        b.created_at BETWEEN ? AND ?
    `;
    
    const queryParams: any[] = [startDate, endDate];
    
    // Ajouter les filtres optionnels
    if (activity) {
      query += ' AND a.id = ?';
      queryParams.push(activity);
    }
    
    if (location) {
      query += ' AND s.id = ?';
      queryParams.push(location);
    }
    
    // Grouper par activité, batch, commodité et emplacement
    query += ' GROUP BY a.nom, b.batch_number, c.nom, s.nom';
    
    const [rows] = await connection.query(query, queryParams);
    
    // Transformer les données pour le format attendu par le frontend
    const batchesMap = new Map();
    
    // Parcourir les résultats et organiser par batch
    (rows as any[]).forEach(row => {
      const batchKey = `${row.activity}-${row.batch_number}`;
      
      if (!batchesMap.has(batchKey)) {
        batchesMap.set(batchKey, {
          activity: row.activity,
          batch_number: row.batch_number,
          commodities: [],
          totals: {
            tonnage_sent: 0,
            internal_movement: 0,
            tonnage_received: 0,
            quantity_returned: 0,
            losses: 0
          }
        });
      }
      
      const batch = batchesMap.get(batchKey);
      
      // Ajouter la commodité au batch
      batch.commodities.push({
        commodity_specific: row.commodity_specific,
        tonnage_sent: row.tonnage_sent || 0,
        internal_movement: row.internal_movement || 0,
        tonnage_received: row.tonnage_received || 0,
        quantity_returned: row.quantity_returned || 0,
        losses: row.losses || 0,
        location: row.location
      });
      
      // Mettre à jour les totaux
      batch.totals.tonnage_sent += row.tonnage_sent || 0;
      batch.totals.internal_movement += row.internal_movement || 0;
      batch.totals.tonnage_received += row.tonnage_received || 0;
      batch.totals.quantity_returned += row.quantity_returned || 0;
      batch.totals.losses += row.losses || 0;
    });
    
    // Calculer le total général
    const grandTotal = {
      tonnage_sent: 0,
      internal_movement: 0,
      tonnage_received: 0,
      quantity_returned: 0,
      losses: 0
    };
    
    batchesMap.forEach(batch => {
      grandTotal.tonnage_sent += batch.totals.tonnage_sent;
      grandTotal.internal_movement += batch.totals.internal_movement;
      grandTotal.tonnage_received += batch.totals.tonnage_received;
      grandTotal.quantity_returned += batch.totals.quantity_returned;
      grandTotal.losses += batch.totals.losses;
    });
    
    // Préparer le résultat final
    const result = {
      batches: Array.from(batchesMap.values()),
      grandTotal
    };
    
    await connection.end();
    res.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport par batch et commodité:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport par batch et commodité: ' + error.message 
    });
  }
});

export default router;
