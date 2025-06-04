import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Créer le router
const router = Router();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// GET - Rapport des waybills
router.get('/report', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, location, page = '1', limit = '10' } = req.query;
    
    // Validation des paramètres
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les dates de début et de fin sont requises' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Calcul de l'offset pour la pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Construction de la requête SQL avec des paramètres optionnels
    let countQuery = `
      SELECT COUNT(*) as total
      FROM waybill_items
      WHERE 1=1
    `;
    
    let query = `
      SELECT *
      FROM waybill_items
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Ajouter les conditions de date
    if (startDate && endDate) {
      countQuery += ` AND (reception_date BETWEEN ? AND ? OR date BETWEEN ? AND ?)`;
      query += ` AND (reception_date BETWEEN ? AND ? OR date BETWEEN ? AND ?)`;
      queryParams.push(startDate, endDate, startDate, endDate);
    }
    
    // Ajouter la condition de lieu si spécifiée
    if (location) {
      countQuery += ` AND location = ?`;
      query += ` AND location = ?`;
      queryParams.push(location);
    }
    
    // Ajouter l'ordre et la pagination
    query += ` ORDER BY reception_date DESC, waybill_number ASC LIMIT ? OFFSET ?`;
    queryParams.push(limitNum, offset);
    
    // Exécuter la requête de comptage
    const [countRows] = await connection.execute(countQuery, queryParams.slice(0, -2));
    const total = (countRows as any[])[0].total;
    
    // Exécuter la requête principale
    const [rows] = await connection.execute(query, queryParams);
    
    await connection.end();
    
    // Calculer le tonnage pour chaque élément en fonction du type de produit
    const waybillItems = (rows as any[]).map(item => {
      // Déterminer le poids unitaire en fonction du type de produit
      let poidsUnitaire = 0;
      const commodityLower = (item.commodity_specific || '').toLowerCase();
      
      if (commodityLower.includes('huile')) {
        poidsUnitaire = 20; // 20kg par carton d'huile
      } else if (commodityLower.includes('farine')) {
        poidsUnitaire = 25; // 25kg par sac de farine
      } else if (commodityLower.includes('haricot')) {
        poidsUnitaire = 50; // 50kg par sac de haricot
      } else if (commodityLower.includes('sel')) {
        poidsUnitaire = 25; // 25kg par sac de sel
      } else if (item.unit_received === 'kg') {
        poidsUnitaire = 1; // Conversion directe pour les kg
      }
      
      // Calculer le tonnage reçu si ce n'est pas déjà fait
      if (!item.tonne_received && item.quantity) {
        item.tonne_received = (item.quantity * poidsUnitaire) / 1000;
      }
      
      return item;
    });
    
    res.json({
      success: true,
      data: waybillItems,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport des waybills:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport des waybills: ' + error.message 
    });
  }
});

// GET - Exporter les waybills en Excel
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, location } = req.query;
    
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
        waybill_number as 'Waybill #',
        batch_number as 'Batch #',
        commodity_specific as 'Commodity',
        quantity as 'Quantité',
        unit_received as 'Unité',
        tonne_received as 'Tonnage',
        location as 'Site',
        reception_date as 'Date de réception'
      FROM waybill_items
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Ajouter les conditions de date
    if (startDate && endDate) {
      query += ` AND (reception_date BETWEEN ? AND ? OR date BETWEEN ? AND ?)`;
      queryParams.push(startDate, endDate, startDate, endDate);
    }
    
    // Ajouter la condition de lieu si spécifiée
    if (location) {
      query += ` AND location = ?`;
      queryParams.push(location);
    }
    
    // Ajouter l'ordre
    query += ` ORDER BY reception_date DESC, waybill_number ASC`;
    
    // Exécuter la requête
    const [rows] = await connection.execute(query, queryParams);
    
    await connection.end();
    
    // Convertir en CSV
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Waybills');
    
    // Définir les colonnes
    worksheet.columns = [
      { header: 'Waybill #', key: 'Waybill #', width: 15 },
      { header: 'Batch #', key: 'Batch #', width: 15 },
      { header: 'Commodity', key: 'Commodity', width: 20 },
      { header: 'Quantité', key: 'Quantité', width: 10 },
      { header: 'Unité', key: 'Unité', width: 10 },
      { header: 'Tonnage', key: 'Tonnage', width: 10 },
      { header: 'Site', key: 'Site', width: 15 },
      { header: 'Date de réception', key: 'Date de réception', width: 15 }
    ];
    
    // Ajouter les données
    worksheet.addRows(rows as any[]);
    
    // Définir le style de l'en-tête
    worksheet.getRow(1).font = { bold: true };
    
    // Générer le fichier Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rapport_Waybills_${startDate}_${endDate}.xlsx`);
    
    await workbook.xlsx.write(res);
    
  } catch (error: any) {
    console.error('Erreur lors de l\'exportation des waybills:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'exportation des waybills: ' + error.message 
    });
  }
});

export default router;
