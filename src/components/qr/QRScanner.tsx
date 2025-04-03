import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface QRScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
}

interface ScanResult {
  household_id: string;
  nom_menage: string;
  site_name: string;
  beneficiaire_principal: string;
  nombre_beneficiaires: number;
  est_valide: boolean;
  derniere_distribution: string | null;
  statut: string;
  historique_recent: Array<{
    date: string;
    status: string;
    items: Array<{
      nom: string;
      quantite: number;
      unite: string;
    }>;
  }>;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onResult, onError }) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const theme = useTheme();

  useEffect(() => {
    // Initialiser le scanner
    const qrScanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    setScanner(qrScanner);

    // Nettoyer le scanner lors du démontage
    return () => {
      if (qrScanner) {
        qrScanner.clear();
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      setLoading(true);
      setError(null);

      // Valider le QR code
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_data: decodedText }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation du QR code');
      }

      const data = await response.json();
      setScanResult(data);
      onResult(decodedText);

      // Arrêter le scanner après un scan réussi
      if (scanner) {
        scanner.pause();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (error: string) => {
    setError(error);
    if (onError) {
      onError(error);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    if (scanner) {
      scanner.resume();
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!scanResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Scanner un QR Code
          </Typography>
          <Box id="reader" sx={{ width: '100%', minHeight: 300 }} />
        </Paper>
      )}

      {scanResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Résultat du scan
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Ménage</Typography>
                <Typography>{scanResult.nom_menage}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Site</Typography>
                <Typography>{scanResult.site_name}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Bénéficiaire Principal</Typography>
                <Typography>{scanResult.beneficiaire_principal}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Nombre de Bénéficiaires</Typography>
                <Typography>{scanResult.nombre_beneficiaires}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Alert 
                  severity={scanResult.est_valide ? "success" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {scanResult.statut}
                </Alert>
              </Grid>

              {scanResult.historique_recent && scanResult.historique_recent.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Historique Récent
                  </Typography>
                  {scanResult.historique_recent.map((hist, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: theme.palette.grey[50] }}>
                      <Typography variant="subtitle2">
                        {new Date(hist.date).toLocaleDateString()} - {hist.status}
                      </Typography>
                      <Typography variant="body2">
                        Articles: {hist.items.map(item => 
                          `${item.nom} (${item.quantite} ${item.unite})`
                        ).join(', ')}
                      </Typography>
                    </Paper>
                  ))}
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onResult(JSON.stringify(scanResult))}
                disabled={!scanResult.est_valide}
              >
                Procéder à la Distribution
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Scanner un autre code
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default QRScanner;
