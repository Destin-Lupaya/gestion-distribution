"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
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
        const connection = await promise_1.default.createConnection(dbConfig);
        
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
        try {
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
        } catch (queryError) {
            console.error('Erreur lors de l\'exécution de la requête SQL:', queryError);
            
            // Essayer une requête plus simple pour diagnostiquer le problème
            try {
                const [simpleRows] = await connection.query('SELECT * FROM evenements_distribution LIMIT 1');
                console.log('Structure d\'un enregistrement de la table evenements_distribution:', simpleRows[0]);
                
                // Si nous arrivons ici, c'est que la table existe mais les jointures ou les noms de colonnes posent problème
                await connection.end();
                res.status(500).json({ 
                    success: false, 
                    error: 'Erreur lors de l\'exécution de la requête SQL: ' + queryError.message,
                    suggestion: 'Vérifiez les jointures et les noms de colonnes dans la requête'
                });
            } catch (simpleQueryError) {
                // Si même la requête simple échoue, il y a un problème plus fondamental avec la table
                console.error('Erreur lors de l\'exécution d\'une requête simple:', simpleQueryError);
                await connection.end();
                res.status(500).json({ 
                    success: false, 
                    error: 'Erreur lors de l\'accès à la table evenements_distribution: ' + simpleQueryError.message
                });
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des événements: ' + error.message
        });
    }
});

// Exporter le router
exports.default = router;
