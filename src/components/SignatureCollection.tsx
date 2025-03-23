import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert
} from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import CloseIcon from '@mui/icons-material/Close';
import { PageTransition } from './PageTransition';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { QrReader } from 'react-qr-reader';

interface QrCodeData {
  id: string;
}

type ScanError = {
  type: 'camera' | 'parse' | 'validation';
  message: string;
};

export default function SignatureCollection() {
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [beneficiaireId, setBeneficiaireId] = useState('');
  const [beneficiaireInfo, setBeneficiaireInfo] = useState<any>(null);
  const [householdData, setHouseholdData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const handleScan = async (result: any) => {
    if (!result) {
      return; // Silent return for continuous scanning
    }

    try {
      console.log('QR Scan result:', result);
      
      if (!result.text || result.text.trim() === '') {
        setScanError({ type: 'validation', message: 'Code QR vide ou illisible' });
        toast.error('Code QR vide ou illisible');
        return;
      }

      // Parse QR data
      const scannedData: QrCodeData = JSON.parse(result.text);
      console.log('Parsed QR data:', scannedData);

      // Process QR data using Supabase function
      const { data: qrResult, error: qrError } = await supabase
        .rpc('process_qr_scan', { p_qr_data: scannedData });

      if (qrError) {
        console.error('QR processing error:', qrError);
        setScanError({ type: 'validation', message: 'Erreur de traitement du QR code' });
        toast.error('Erreur de traitement du QR code');
        return;
      }

      if (!qrResult || qrResult.length === 0) {
        setScanError({ type: 'validation', message: 'Bénéficiaire non trouvé' });
        toast.error('Bénéficiaire non trouvé');
        return;
      }

      const household = qrResult[0];
      
      // Check if already distributed
      if (household.status === 'Already distributed') {
        setScanError({ type: 'validation', message: 'Distribution déjà effectuée' });
        toast.error('Distribution déjà effectuée pour ce bénéficiaire');
        return;
      }

      // Check if there are any errors in the status
      if (household.status.startsWith('ERROR:')) {
        setScanError({ type: 'validation', message: household.status.replace('ERROR: ', '') });
        toast.error(household.status.replace('ERROR: ', ''));
        return;
      }

      // Set the beneficiary ID and trigger search
      setBeneficiaireId(household.household_id);
      setHouseholdData(household);
      handleSearch();
      setShowScanner(false);
      setScanError(null);
      toast.success('Code scanné avec succès');
      
    } catch (err) {
      console.error('QR parse error:', err);
      setScanError({ type: 'parse', message: 'Format de code QR invalide' });
      toast.error('Format de code QR invalide');
    }
  };

  const handleError = (error: Error) => {
    console.error('QR Scan error:', error);
    setScanError({
      type: 'camera',
      message: 'Erreur de caméra: ' + error.message
    });
    toast.error('Erreur de caméra');
  };

  const handleSearch = async () => {
    if (!beneficiaireId) return;

    try {
      // Check QR status
      const { data: statusData, error: statusError } = await supabase
        .rpc('check_qr_status', { p_household_id: beneficiaireId });

      if (statusError) {
        console.error('Status check error:', statusError);
        toast.error('Erreur lors de la vérification du statut');
        return;
      }

      if (statusData && statusData[0]?.is_distributed) {
        toast.error(`Distribution déjà effectuée le ${new Date(statusData[0].distribution_date).toLocaleDateString()}`);
        return;
      }

      // Continue with signature collection if not distributed
      setShowSignaturePad(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleSave = async () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      try {
        const signatureData = signaturePad.toDataURL();
        
        // Record signature using Supabase function
        const { data, error } = await supabase
          .rpc('record_signature', {
            p_household_id: beneficiaireId,
            p_signature_data: signatureData
          });

        if (error) {
          console.error('Signature save error:', error);
          toast.error('Erreur lors de l\'enregistrement de la signature');
          return;
        }

        toast.success('Signature enregistrée avec succès');
        
        // Reset form
        setBeneficiaireId('');
        setBeneficiaireInfo(null);
        setHouseholdData(null);
        setShowSignaturePad(false);
        if (signaturePad) {
          signaturePad.clear();
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Erreur lors de l\'enregistrement');
      }
    } else {
      toast.error('Veuillez signer avant de sauvegarder');
    }
  };

  return (
    <PageTransition>
      <div>
        <Typography variant="h4" gutterBottom>
          Collection des Signatures
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowScanner(true)}
                >
                  Scanner un code QR
                </Button>
              </Box>

              {beneficiaireInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Information du Bénéficiaire
                  </Typography>
                  <Typography>ID: {beneficiaireId}</Typography>
                  {householdData && (
                    <>
                      <Typography>Nom: {householdData.nom_menage}</Typography>
                      <Typography>Site: {householdData.site_distribution}</Typography>
                      <Typography>Token: {householdData.token_number}</Typography>
                    </>
                  )}
                </Box>
              )}

              {showSignaturePad && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Signature
                  </Typography>
                  <Box 
                    sx={{ 
                      border: 1, 
                      borderColor: 'grey.300', 
                      borderRadius: 1,
                      p: 1,
                      backgroundColor: '#fff'
                    }}
                  >
                    <SignaturePad
                      ref={(ref) => setSignaturePad(ref)}
                      canvasProps={{
                        className: 'signature-canvas',
                        style: { width: '100%', height: '200px' }
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={handleClear}
                    >
                      Effacer
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSave}
                    >
                      Sauvegarder
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Dialog
          open={showScanner}
          onClose={() => setShowScanner(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Scanner un code QR
            <IconButton
              aria-label="close"
              onClick={() => setShowScanner(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
              {showScanner && (
                <QrReader
                  constraints={{
                    facingMode: 'environment'
                  }}
                  onResult={handleScan}
                  scanDelay={500}
                  videoStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </Box>
            {scanError && (
              <Alert severity={scanError.type === 'camera' ? 'error' : 'warning'} sx={{ mt: 2 }}>
                {scanError.message}
              </Alert>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}