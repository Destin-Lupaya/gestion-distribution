import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab
} from '@mui/material';
import { QrReader } from 'react-qr-reader';
import BeneficiaireSearch from '../beneficiaire/BeneficiaireSearch';

interface SignatureCollectionProps {
  onComplete: (result: {
    distributionId: number;
    household: string;
    signature: string;
    items: Array<{
      id: number;
      nom: string;
      quantite: number;
      unite: string;
    }>;
  }) => void;
}

interface DistributionItem {
  id: number;
  nom: string;
  quantite: number;
  unite_mesure: string;
}

export const SignatureCollection: React.FC<SignatureCollectionProps> = ({ onComplete }) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<DistributionItem[]>([]);
  const [availableItems, setAvailableItems] = useState<DistributionItem[]>([]);
  const [step, setStep] = useState<'scan' | 'items' | 'signature'>('scan');
  const [tabValue, setTabValue] = useState<'scanner' | 'manuel'>('scanner');

  // Charger les articles disponibles
  React.useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch('/api/items');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des articles');
        }
        const data = await response.json();
        setAvailableItems(data);
      } catch (err) {
        setError('Erreur lors du chargement des articles');
      }
    };
    loadItems();
  }, []);

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/qr/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qr_data: data }),
        });

        if (!response.ok) {
          throw new Error('QR code invalide');
        }

        const result = await response.json();
        if (!result.est_valide) {
          throw new Error(result.statut);
        }

        setScanData(result);
        setStep('items');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemChange = (itemId: number, quantity: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item =>
          item.id === itemId ? { ...item, quantite: quantity } : item
        );
      }
      const newItem = availableItems.find(item => item.id === itemId);
      if (newItem) {
        return [...prev, { ...newItem, quantite: quantity }];
      }
      return prev;
    });
  };

  const handleSignatureSubmit = async () => {
    if (!signatureRef.current || !scanData) return;

    try {
      setLoading(true);
      setError(null);

      const signatureData = signatureRef.current.toDataURL();
      const response = await fetch('/api/distribution/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: scanData.household_id,
          signature_data: signatureData,
          items: selectedItems.map(item => ({
            id: item.id,
            quantite: item.quantite
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      const result = await response.json();
      onComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const resetSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'scanner' | 'manuel') => {
    setTabValue(newValue);
  };

  const handleSelectBeneficiaire = async (beneficiaire: any) => {
    try {
      setLoading(true);
      setError(null);

      // Simuler les données du QR code à partir des informations du bénéficiaire
      const qrData = {
        est_valide: true,
        household_id: beneficiaire.household_id,
        nom_menage: beneficiaire.nom_du_menage,
        beneficiaire_principal: beneficiaire.nom_complet,
        token_number: beneficiaire.token_number,
        site_id: beneficiaire.site_id,
        site_nom: beneficiaire.site_de_distribution
      };

      setScanData(qrData);
      setStep('items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'scan':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Collection des Signatures
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Scanner QR Code" value="scanner" />
                <Tab label="Enregistrement Manuel" value="manuel" />
              </Tabs>
            </Box>

            {tabValue === 'scanner' ? (
              <Box sx={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={(result) => {
                    if (result) {
                      handleScan(result.getText());
                    }
                  }}
                  scanDelay={500}
                />
              </Box>
            ) : (
              <BeneficiaireSearch onSelectBeneficiaire={handleSelectBeneficiaire} />
            )}
          </Paper>
        );

      case 'items':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sélection des Articles
              </Typography>
              <Grid container spacing={2}>
                {availableItems.map((item) => (
                  <Grid item xs={12} sm={6} key={item.id}>
                    <TextField
                      label={`${item.nom} (${item.unite_mesure})`}
                      type="number"
                      fullWidth
                      value={selectedItems.find(i => i.id === item.id)?.quantite || ''}
                      onChange={(e) => handleItemChange(item.id, Number(e.target.value))}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setStep('signature')}
                  disabled={selectedItems.length === 0}
                >
                  Continuer
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setStep('scan');
                    setScanData(null);
                    setSelectedItems([]);
                  }}
                >
                  Retour
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      case 'signature':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Signature du Bénéficiaire
              </Typography>
              <Paper 
                sx={{ 
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  my: 2,
                  touchAction: 'none'
                }}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas'
                  }}
                />
              </Paper>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSignatureSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Confirmer'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetSignature}
                >
                  Effacer
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setStep('items')}
                >
                  Retour
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {scanData && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
        >
          Bénéficiaire: {scanData.nom_menage} - {scanData.beneficiaire_principal}
        </Alert>
      )}

      {renderStep()}
    </Box>
  );
};

export default SignatureCollection;
