import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import * as databaseService from '../services/databaseService';
import { Site, Household, Recipient } from '../types';

interface ManualRegistrationProps {
  onRegistrationComplete?: () => void;
}

type ScannerType = 'mobile' | 'webcam';

function ManualRegistration({ onRegistrationComplete }: ManualRegistrationProps) {
  const [formData, setFormData] = useState({
    siteName: '',
    siteAddress: '',
    householdName: '',
    tokenNumber: '',
    recipientFirstName: '',
    recipientMiddleName: '',
    recipientLastName: '',
    beneficiaryCount: '',
    alternateRecipient: ''
  });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerType, setScannerType] = useState<ScannerType>('mobile');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (html5QrCode.current) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Créer ou récupérer le site
      const site = await databaseService.createSite({
        nom: formData.siteName,
        adresse: formData.siteAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 2. Créer le ménage
      const household = await databaseService.createHousehold({
        site_id: site.id,
        nom_menage: formData.householdName,
        token_number: formData.tokenNumber,
        nombre_beneficiaires: parseInt(formData.beneficiaryCount),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 3. Créer le bénéficiaire principal
      await databaseService.createRecipient({
        household_id: household.id,
        first_name: formData.recipientFirstName,
        middle_name: formData.recipientMiddleName || undefined,
        last_name: formData.recipientLastName,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 4. Créer le bénéficiaire suppléant si spécifié
      if (formData.alternateRecipient) {
        const [firstName, ...lastNameParts] = formData.alternateRecipient.split(' ');
        await databaseService.createRecipient({
          household_id: household.id,
          first_name: firstName,
          last_name: lastNameParts.join(' '),
          is_primary: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Bénéficiaire enregistré avec succès');
      setFormData({
        siteName: '',
        siteAddress: '',
        householdName: '',
        tokenNumber: '',
        recipientFirstName: '',
        recipientMiddleName: '',
        recipientLastName: '',
        beneficiaryCount: '',
        alternateRecipient: ''
      });

      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (error) {
      console.error('Error registering beneficiary:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement');
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializeScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices.map(device => ({
        id: device.id,
        label: device.label
      })));
      
      if (devices.length > 0) {
        setSelectedCamera(devices[0].id);
      }
    } catch (err) {
      console.error('Error getting cameras:', err);
      toast.error('Erreur lors de l\'accès à la caméra');
    }
  };

  const startScanner = async () => {
    setScannerOpen(true);
    await initializeScanner();
  };

  const startScanningProcess = async () => {
    if (!selectedCamera || !qrReaderRef.current) return;

    try {
      setIsScanning(true);
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      if (!html5QrCode.current) {
        html5QrCode.current = new Html5Qrcode("qr-reader");
      }
      
      await html5QrCode.current.start(
        selectedCamera,
        config,
        (decodedText) => {
          handleQrCodeSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      toast.error('Erreur lors du démarrage du scanner');
      setIsScanning(false);
    }
  };

  const handleQrCodeSuccess = (decodedText: string) => {
    try {
      const scannedData = JSON.parse(decodedText);
      setFormData(prev => ({
        ...prev,
        ...scannedData
      }));
      stopScanner();
      toast.success('Code scanné avec succès');
    } catch (err) {
      toast.error('Format de code invalide');
    }
  };

  const stopScanner = async () => {
    if (html5QrCode.current) {
      try {
        await html5QrCode.current.stop();
        html5QrCode.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setScannerOpen(false);
  };

  const handleScannerTypeChange = (event: React.MouseEvent<HTMLElement>, newType: ScannerType | null) => {
    if (newType !== null) {
      setScannerType(newType);
      if (isScanning) {
        stopScanner();
      }
    }
  };

  return (
    <Paper component={motion.div} elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Enregistrement Manuel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom du Site"
              name="siteName"
              value={formData.siteName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Adresse du Site"
              name="siteAddress"
              value={formData.siteAddress}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom du Ménage"
              name="householdName"
              value={formData.householdName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Numéro Token"
              name="tokenNumber"
              value={formData.tokenNumber}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Prénom du Bénéficiaire"
              name="recipientFirstName"
              value={formData.recipientFirstName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Deuxième Prénom"
              name="recipientMiddleName"
              value={formData.recipientMiddleName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom du Bénéficiaire"
              name="recipientLastName"
              value={formData.recipientLastName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Nombre de Bénéficiaires"
              name="beneficiaryCount"
              value={formData.beneficiaryCount}
              onChange={handleInputChange}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nom du Suppléant"
              name="alternateRecipient"
              value={formData.alternateRecipient}
              onChange={handleInputChange}
              helperText="Optionnel - Format: Prénom Nom"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setScannerOpen(true)}
            disabled={isSubmitting}
          >
            Scanner QR Code
          </Button>
        </Box>
      </form>

      {/* Scanner Dialog */}
      <Dialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Scanner QR Code
          <IconButton
            aria-label="close"
            onClick={() => setScannerOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={scannerType}
              exclusive
              onChange={(e, value) => value && setScannerType(value)}
              aria-label="scanner type"
            >
              <ToggleButton value="mobile" aria-label="mobile">
                <CameraAltIcon sx={{ mr: 1 }} /> Mobile
              </ToggleButton>
              <ToggleButton value="webcam" aria-label="webcam">
                <VideocamIcon sx={{ mr: 1 }} /> Webcam
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {cameras.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Sélectionner la caméra"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label}
                  </option>
                ))}
              </TextField>
            </Box>
          )}
          <Box 
            ref={scannerContainerRef}
            sx={{ 
              position: 'relative', 
              width: '100%', 
              height: 300,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}
          >
            {!isScanning ? (
              <Button
                variant="contained"
                onClick={startScanningProcess}
                disabled={!selectedCamera}
                startIcon={<QrCodeScannerIcon />}
              >
                Démarrer le scan
              </Button>
            ) : (
              <>
                <div 
                  id="qr-reader" 
                  ref={qrReaderRef}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    position: 'relative'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScannerOpen(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ManualRegistration;