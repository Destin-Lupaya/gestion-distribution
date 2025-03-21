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
import { typedSupabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ManualRegistrationProps {
  onRegistrationComplete?: () => void;
}

type ScannerType = 'mobile' | 'webcam';

function ManualRegistration({ onRegistrationComplete }: ManualRegistrationProps) {
  const [formData, setFormData] = useState({
    siteDistribution: '',
    adresse: '',
    householdId: '',
    nomMenage: '',
    tokenNumber: '',
    recipientFirstName: '',
    recipientMiddleName: '',
    recipientLastName: '',
    nombreBeneficiaires: '',
    nomSuppleant: ''
  });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerType, setScannerType] = useState<ScannerType>('mobile');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  
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

    try {
      const { data, error: dbError } = await typedSupabase.rpc('import_household_data', {
        p_site_nom: formData.siteDistribution,
        p_site_adresse: formData.adresse,
        p_household_id: formData.householdId,
        p_nom_menage: formData.nomMenage,
        p_token_number: formData.tokenNumber,
        p_nombre_beneficiaires: parseInt(formData.nombreBeneficiaires),
        p_recipient_first_name: formData.recipientFirstName,
        p_recipient_middle_name: formData.recipientMiddleName || null,
        p_recipient_last_name: formData.recipientLastName,
        p_nom_suppleant: formData.nomSuppleant || null
      });

      if (dbError) throw dbError;

      toast.success('Bénéficiaire enregistré avec succès');
      setFormData({
        siteDistribution: '',
        adresse: '',
        householdId: '',
        nomMenage: '',
        tokenNumber: '',
        recipientFirstName: '',
        recipientMiddleName: '',
        recipientLastName: '',
        nombreBeneficiaires: '',
        nomSuppleant: ''
      });

      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (err) {
      console.error('Error registering beneficiary:', err);
      setError('Erreur lors de l\'enregistrement du bénéficiaire');
      toast.error('Erreur lors de l\'enregistrement');
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper className="p-6">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Enregistrement Manuel</Typography>
          <Button
            startIcon={<QrCodeScannerIcon />}
            onClick={startScanner}
            variant="outlined"
          >
            Scanner QR/Code-barres
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site de distribution"
                name="siteDistribution"
                value={formData.siteDistribution}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Household ID"
                name="householdId"
                value={formData.householdId}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom du Ménage"
                name="nomMenage"
                value={formData.nomMenage}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token Number"
                name="tokenNumber"
                value={formData.tokenNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de Bénéficiaires"
                name="nombreBeneficiaires"
                type="number"
                value={formData.nombreBeneficiaires}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prénom du Bénéficiaire"
                name="recipientFirstName"
                value={formData.recipientFirstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Deuxième Prénom"
                name="recipientMiddleName"
                value={formData.recipientMiddleName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nom de Famille"
                name="recipientLastName"
                value={formData.recipientLastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du Suppléant"
                name="nomSuppleant"
                value={formData.nomSuppleant}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
            >
              Enregistrer
            </Button>
          </Box>
        </form>

        <Dialog
          open={scannerOpen}
          onClose={stopScanner}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Scanner le QR Code ou Code-barres
            <IconButton
              onClick={stopScanner}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={scannerType}
                exclusive
                onChange={handleScannerTypeChange}
                aria-label="scanner type"
              >
                <ToggleButton value="mobile" aria-label="mobile camera">
                  <CameraAltIcon sx={{ mr: 1 }} />
                  Caméra Mobile
                </ToggleButton>
                <ToggleButton value="webcam" aria-label="webcam">
                  <VideocamIcon sx={{ mr: 1 }} />
                  Webcam
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
            <Button onClick={stopScanner} color="primary">
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </motion.div>
  );
}

export default ManualRegistration;