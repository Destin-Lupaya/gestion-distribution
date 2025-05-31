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
// Créer le router en utilisant Router directement
const router = (0, express_1.Router)();
// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_distribution',
    port: parseInt(process.env.DB_PORT || '3306', 10)
};
// GET - Récupérer tous les programmes
router.get('/', async (_req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const [rows] = await connection.query(`
      SELECT * FROM programmes_aide 
      ORDER BY date_debut DESC
    `);
        await connection.end();
        res.json(rows);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des programmes:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des programmes'
        });
    }
});
// GET - Récupérer un programme par ID
router.get('/:programmeId', async (req, res) => {
    try {
        const { programmeId } = req.params;
        const connection = await promise_1.default.createConnection(dbConfig);
        const [rows] = await connection.query(`
      SELECT * FROM programmes_aide 
      WHERE programme_id = ?
    `, [programmeId]);
        await connection.end();
        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Programme non trouvé'
            });
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('Erreur lors de la récupération du programme:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du programme'
        });
    }
});
// POST - Créer un nouveau programme
router.post('/', async (req, res) => {
    try {
        const { nom_programme, organisation_responsable, date_debut, date_fin, description } = req.body;
        // Validation des champs obligatoires
        if (!nom_programme || !organisation_responsable || !date_debut || !date_fin) {
            return res.status(400).json({
                success: false,
                error: 'Tous les champs obligatoires doivent être remplis'
            });
        }
        const programmeId = (0, uuid_1.v4)();
        const connection = await promise_1.default.createConnection(dbConfig);
        await connection.query(`
      INSERT INTO programmes_aide (
        programme_id, 
        nom_programme, 
        organisation_responsable, 
        date_debut, 
        date_fin, 
        description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
            programmeId,
            nom_programme,
            organisation_responsable,
            date_debut,
            date_fin,
            description || null
        ]);
        await connection.end();
        res.status(201).json({
            success: true,
            message: 'Programme créé avec succès',
            programmeId
        });
    }
    catch (error) {
        console.error('Erreur lors de la création du programme:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du programme'
        });
    }
});
// PUT - Mettre à jour un programme
router.put('/:programmeId', async (req, res) => {
    try {
        const { programmeId } = req.params;
        const { nom_programme, organisation_responsable, date_debut, date_fin, description } = req.body;
        // Validation des champs obligatoires
        if (!nom_programme || !organisation_responsable || !date_debut || !date_fin) {
            return res.status(400).json({
                success: false,
                error: 'Tous les champs obligatoires doivent être remplis'
            });
        }
        const connection = await promise_1.default.createConnection(dbConfig);
        // Vérifier si le programme existe
        const [rows] = await connection.query(`
      SELECT * FROM programmes_aide 
      WHERE programme_id = ?
    `, [programmeId]);
        if (Array.isArray(rows) && rows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'Programme non trouvé'
            });
        }
        await connection.query(`
      UPDATE programmes_aide 
      SET 
        nom_programme = ?, 
        organisation_responsable = ?, 
        date_debut = ?, 
        date_fin = ?, 
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE programme_id = ?
    `, [
            nom_programme,
            organisation_responsable,
            date_debut,
            date_fin,
            description || null,
            programmeId
        ]);
        await connection.end();
        res.json({
            success: true,
            message: 'Programme mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour du programme:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du programme'
        });
    }
});
// DELETE - Supprimer un programme
router.delete('/:programmeId', async (req, res) => {
    try {
        const { programmeId } = req.params;
        const connection = await promise_1.default.createConnection(dbConfig);
        // Vérifier si le programme existe
        const [rows] = await connection.query(`
      SELECT * FROM programmes_aide 
      WHERE programme_id = ?
    `, [programmeId]);
        if (Array.isArray(rows) && rows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'Programme non trouvé'
            });
        }
        // Vérifier si le programme est utilisé dans des événements
        const [evenements] = await connection.query(`
      SELECT * FROM evenements_distribution 
      WHERE programme_id = ?
    `, [programmeId]);
        if (Array.isArray(evenements) && evenements.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                error: 'Impossible de supprimer ce programme car il est utilisé dans des événements de distribution'
            });
        }
        await connection.query(`
      DELETE FROM programmes_aide 
      WHERE programme_id = ?
    `, [programmeId]);
        await connection.end();
        res.json({
            success: true,
            message: 'Programme supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression du programme:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du programme'
        });
    }
});
exports.default = router;
//# sourceMappingURL=programmesRoutes.js.map