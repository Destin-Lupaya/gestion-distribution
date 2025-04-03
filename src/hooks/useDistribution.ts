import { useState, useCallback } from 'react';

interface DistributionItem {
  id: number;
  nom: string;
  quantite: number;
  unite: string;
}

interface Distribution {
  distributionId: number;
  household: string;
  signature: string;
  items: DistributionItem[];
}

interface QRValidationResult {
  household_id: string;
  nom_menage: string;
  site_name: string;
  beneficiaire_principal: string;
  est_valide: boolean;
  statut: string;
  historique_recent: any[];
}

interface UseDistributionReturn {
  loading: boolean;
  error: string | null;
  scanResult: QRValidationResult | null;
  currentDistribution: Distribution | null;
  validateQRCode: (qrData: string) => Promise<void>;
  completeDistribution: (signature: string, items: DistributionItem[]) => Promise<void>;
  reset: () => void;
}

export const useDistribution = (): UseDistributionReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<QRValidationResult | null>(null);
  const [currentDistribution, setCurrentDistribution] = useState<Distribution | null>(null);

  const validateQRCode = useCallback(async (qrData: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_data: qrData }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation du QR code');
      }

      const data = await response.json();
      if (!data.est_valide) {
        throw new Error(data.statut);
      }

      setScanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeDistribution = useCallback(async (signature: string, items: DistributionItem[]) => {
    if (!scanResult) {
      setError('Aucun QR code scanné');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/distribution/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: scanResult.household_id,
          signature_data: signature,
          items: items.map(item => ({
            id: item.id,
            quantite: item.quantite
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement de la distribution');
      }

      const data = await response.json();
      setCurrentDistribution({
        distributionId: data.distribution_id,
        household: scanResult.nom_menage,
        signature,
        items
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [scanResult]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setScanResult(null);
    setCurrentDistribution(null);
  }, []);

  return {
    loading,
    error,
    scanResult,
    currentDistribution,
    validateQRCode,
    completeDistribution,
    reset
  };
};

export default useDistribution;
