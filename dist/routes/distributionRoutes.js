"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const distributionService_1 = require("../services/distributionService");
const router = (0, express_1.Router)();
// Validation du QR code
router.post('/qr/validate', async (req, res) => {
    try {
        const { qr_data } = req.body;
        const result = await (0, distributionService_1.validateQRCode)(qr_data);
        res.json(result);
    }
    catch (error) {
        console.error('Erreur lors de la validation du QR:', error);
        res.status(500).json({
            error: 'Erreur lors de la validation du QR code',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});
// Récupération des articles disponibles
router.get('/items', async (_req, res) => {
    try {
        const items = await (0, distributionService_1.getAvailableItems)();
        res.json(items);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des articles',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});
// Compléter une distribution
router.post('/distribution/complete', async (req, res) => {
    try {
        const result = await (0, distributionService_1.completeDistribution)(req.body);
        res.json(result);
    }
    catch (error) {
        console.error('Erreur lors de la completion de la distribution:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'enregistrement de la distribution',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});
exports.default = router;
//# sourceMappingURL=distributionRoutes.js.map