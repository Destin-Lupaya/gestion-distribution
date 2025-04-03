import { Router, Request, Response } from 'express';
import { validateQRCode, completeDistribution, getAvailableItems } from '../services/distributionService';
import { DistributionRequest } from '../types/distribution';

const router = Router();

// Validation du QR code
router.post('/qr/validate', async (req: Request, res: Response) => {
  try {
    const { qr_data } = req.body;
    const result = await validateQRCode(qr_data);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la validation du QR:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la validation du QR code',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Récupération des articles disponibles
router.get('/items', async (_req: Request, res: Response) => {
  try {
    const items = await getAvailableItems();
    res.json(items);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des articles',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Compléter une distribution
router.post('/distribution/complete', async (req: Request<any, any, DistributionRequest>, res: Response) => {
  try {
    const result = await completeDistribution(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la completion de la distribution:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement de la distribution',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
