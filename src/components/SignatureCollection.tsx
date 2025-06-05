import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Tab, 
  Tabs, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  QrReader
} from 'react-qr-reader';
import SignaturePad from 'react-signature-canvas';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import BeneficiaireSearchTab from './BeneficiaireSearchTab';

interface BeneficiaryInfo {
  id: number;
  site_name: string;
  household_id: string;
  household_name: string;
  token_number: string;
  beneficiary_count: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  site_address?: string;
  alternate_recipient?: string;
}

export default function SignatureCollection() {
  // Styles personnalisés pour le composant
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      backgroundColor: '#ffffff'
    },
    header: {
      marginBottom: '24px',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '16px'
    },
    title: {
      fontWeight: 600,
      color: '#1a365d',
      fontSize: '1.5rem'
    },
    subtitle: {
      color: '#4a5568',
      marginTop: '8px'
    },
    tabsContainer: {
      marginBottom: '24px',
      borderBottom: '1px solid #e0e0e0'
    },
    tab: {
      fontWeight: 500,
      textTransform: 'none',
      minWidth: '120px'
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      borderRadius: '8px',
      padding: '8px 16px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      background: 'linear-gradient(45deg, #1976d2, #2196f3)',
      '&:hover': {
        background: 'linear-gradient(45deg, #1565c0, #1976d2)'
      }
    },
    secondaryButton: {
      textTransform: 'none',
      fontWeight: 500,
      borderRadius: '8px',
      padding: '8px 16px'
    },
    formContainer: {
      marginTop: '24px'
    },
    formField: {
      marginBottom: '16px'
    },
    infoCard: {
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#f0f7ff',
      border: '1px solid #bae6fd',
      marginBottom: '16px'
    },
    errorMessage: {
      color: '#e53e3e',
      marginTop: '8px',
      fontSize: '0.875rem'
    }
  };
  const [activeTab, setActiveTab] = useState(0);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [audioContext] = useState<AudioContext | null>(() => {
    try {
      return new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API not supported:', e);
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const playSuccessSound = () => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  // État pour le formulaire manuel
  const [manualFormData, setManualFormData] = useState<BeneficiaryInfo>({
    id: 0,
    site_name: '',
    household_id: '',
    household_name: '',
    token_number: '',
    beneficiary_count: 0,
    first_name: '',
    middle_name: '',
    last_name: '',
    site_address: '',
    alternate_recipient: ''
  });

  useEffect(() => {
    // Get available cameras
    const getCameras = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices) {
          console.log('MediaDevices API not available');
          setCameras([]);
          setError('Caméra non disponible. Veuillez utiliser un appareil avec une caméra ou autoriser l\'accès à la caméra.');
          return;
        }
        
        // Request camera permission first to ensure mediaDevices is fully initialized
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (permissionError) {
          console.log('Camera permission denied:', permissionError);
          setError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.');
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setError('Aucune caméra détectée sur cet appareil.');
          setCameras([]);
          return;
        }
        
        setCameras(videoDevices);
        
        // Prefer back camera
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId);
      } catch (error) {
        console.error('Error getting cameras:', error);
        setCameras([]);
        setError('Erreur lors de l\'accès à la caméra. Veuillez réessayer ou utiliser un autre appareil.');
      }
    };
    
    getCameras();
  }, []);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({
      ...prev,
      [name]: name === 'beneficiary_count' ? parseInt(value) || 0 : value
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('Veuillez ajouter une signature');
      return;
    }

    setLoading(true);
    try {
      await apiService.registerDistribution({
        ...manualFormData,
        signature
      });

      toast.success('Distribution enregistrée avec succès');
      
      // Reset form
      setManualFormData({
        id: 0,
        site_name: '',
        household_id: '',
        household_name: '',
        token_number: '',
        beneficiary_count: 0,
        first_name: '',
        middle_name: '',
        last_name: '',
        site_address: '',
        alternate_recipient: ''
      });
      setSignature(null);
      setShowSignaturePad(false);
    } catch (err) {
      console.error('Error submitting manual form:', err);
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le scan du QR code avec debounce
  const handleQrCodeScan = async (data: string | null) => {
    // Éviter les traitements multiples du même QR code ou si un scan est déjà en cours
    if (!data || data === lastScannedData || scanning) return;
    
    // Marquer le début du scan et réinitialiser les états
    setLastScannedData(data);
    setScanning(true);
    setScanError(null);
    setRetryCount(0);

    try {
      console.log('Scanned QR code data:', data);

      // Vérifier si les données sont au format JSON
      try {
        const parsedData = JSON.parse(data);
        console.log('QR code data is valid JSON:', parsedData);
        
        // Si c'est du JSON, extraire le token_number s'il existe
        if (parsedData && parsedData.token_number) {
          console.log('Token number from JSON:', parsedData.token_number);
        }
      } catch (e) {
        // Ce n'est pas du JSON, utiliser les données brutes comme token_number
        console.log('QR code data is not valid JSON, using as token_number');
      }

      // Appel à l'API avec gestion des erreurs et des retries
      try {
        const result = await retryApiCall(async () => {
          // Utiliser un timeout pour éviter les blocages indéfinis
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Délai d'attente dépassé")), 10000)
          );
          
          // Appel API avec timeout
          const apiCallPromise = apiService.validateQr({ qrCode: data });
          
          // Race entre l'appel API et le timeout
          const apiResponse = await Promise.race([apiCallPromise, timeoutPromise]) as any;
          
          if (!apiResponse || !apiResponse.valid) {
            throw new Error(apiResponse?.message || 'QR code non valide');
          }
          
          return apiResponse;
        });

        // Traitement du succès
        if (result && result.data) {
          // Jouer le son de succès
          playSuccessSound();
          
          console.log('Beneficiary data from API:', result.data);
          
          // Mettre à jour l'interface utilisateur
          setBeneficiaryInfo(result.data);
          
          // Fermer le scanner et afficher le pad de signature
          // Utiliser requestAnimationFrame pour éviter les problèmes de rendu
          requestAnimationFrame(() => {
            // Fermer d'abord le scanner pour libérer les ressources de la caméra
            setShowScanner(false);
            
            // Attendre un peu avant d'afficher le pad de signature
            setTimeout(() => {
              setShowSignaturePad(true);
              toast.success('Bénéficiaire trouvé');
            }, 300);
          });
        } else {
          throw new Error('Données du bénéficiaire non trouvées dans la réponse de l\'API');
        }
      } catch (error) {
        console.error('Error processing QR code:', error);
        setScanError(error instanceof Error ? error.message : 'Erreur lors du scan');
        toast.error(error instanceof Error ? error.message : 'Erreur lors du scan');
        setBeneficiaryInfo(null);
      }
    } catch (error) {
      console.error('Unexpected error during QR code processing:', error);
      toast.error('Une erreur inattendue s\'est produite');
    } finally {
      // Réinitialiser l'état de scanning après un délai pour éviter les scans multiples trop rapides
      setTimeout(() => {
        setScanning(false);
      }, 1500);
      
      // Réinitialiser lastScannedData après un délai plus long pour permettre de scanner à nouveau le même code
      setTimeout(() => {
        setLastScannedData(null);
        setRetryCount(0);
      }, 5000);
    }
  };

  // Debounce function to prevent multiple rapid scans
  const debounce = (func: Function, wait: number, options = {}) => {
    let timeout: NodeJS.Timeout | null = null;
    const { leading = false, trailing = true } = options as { leading?: boolean, trailing?: boolean };
    
    return (...args: any[]) => {
      const later = () => {
        timeout = null;
        if (trailing) func(...args);
      };
      
      const callNow = leading && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    };
  };

  // Utiliser un debounce plus long pour éviter les appels multiples
  const debouncedHandleQrCodeScan = useCallback(
    debounce((data: string) => handleQrCodeScan(data), 1000, { leading: true, trailing: false }),
    [lastScannedData, scanning]
  );

  const handleCameraSwitch = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].deviceId);
  };

  const retryApiCall = async (apiCall: () => Promise<any>, maxRetries: number = MAX_RETRIES): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        setRetryCount(i + 1);
      }
    }
  };

  // Cette fonction est utilisée directement dans les onClick des boutons d'effacement

  const handleSave = async () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      try {
        setLoading(true);
        const signatureData = signaturePad.toDataURL();
        
        if (!beneficiaryInfo) {
          throw new Error('Informations du bénéficiaire manquantes');
        }
        
        // Enregistrer la distribution avec toutes les données nécessaires
        console.log('Enregistrement de la distribution avec les données:', beneficiaryInfo);
        await apiService.registerDistribution({
          site_name: beneficiaryInfo.site_name || 'Site par défaut',
          household_id: beneficiaryInfo.household_id,
          token_number: beneficiaryInfo.token_number,
          beneficiary_count: beneficiaryInfo.beneficiary_count || 1,
          first_name: beneficiaryInfo.first_name,
          middle_name: beneficiaryInfo.middle_name || '',
          last_name: beneficiaryInfo.last_name,
          site_address: beneficiaryInfo.site_address || '',
          alternate_recipient: beneficiaryInfo.alternate_recipient || '',
          signature: signatureData
        });

        toast.success('Distribution enregistrée avec succès');
        
        // Reset form
        setBeneficiaryInfo(null);
        setSignature(null);
        setShowSignaturePad(false);
        setShowScanner(true);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la distribution:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Veuillez ajouter une signature');
    }
  };

  // Nouvelle fonction pour enregistrer directement la distribution
  const handleRegisterDistribution = async () => {
    if (!beneficiaryInfo) {
      toast.error('Informations du bénéficiaire manquantes');
      return;
    }

    setLoading(true);
    try {
      // Générer une signature par défaut si nécessaire
      const signatureData = signature || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      
      console.log('Enregistrement de la distribution avec les données:', beneficiaryInfo);
      await apiService.registerDistribution({
        site_name: beneficiaryInfo.site_name || 'Site par défaut',
        household_id: beneficiaryInfo.household_id,
        token_number: beneficiaryInfo.token_number,
        beneficiary_count: beneficiaryInfo.beneficiary_count || 1,
        first_name: beneficiaryInfo.first_name,
        middle_name: beneficiaryInfo.middle_name || '',
        last_name: beneficiaryInfo.last_name,
        site_address: beneficiaryInfo.site_address || '',
        alternate_recipient: beneficiaryInfo.alternate_recipient || '',
        signature: signatureData
      });

      toast.success('Distribution enregistrée avec succès');
      
      // Reset form
      setBeneficiaryInfo(null);
      setSignature(null);
      setShowSignaturePad(false);
      setShowScanner(true);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la distribution:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
      <Paper elevation={3} sx={styles.container}>
        <Box sx={styles.header}>
          <Typography variant="h5" sx={styles.title}>
            Collecte de Signatures
          </Typography>
          <Typography variant="body1" sx={styles.subtitle}>
            Recherchez un bénéficiaire et collectez sa signature pour confirmer la distribution
          </Typography>
        </Box>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)} 
          sx={{ 
            mb: 3,
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
              height: 3
            },
            '& .MuiTab-root': styles.tab,
            '& .Mui-selected': {
              color: '#1976d2'
            }
          }}
        >
          <Tab label="Scanner QR" />
          <Tab label="Recherche" />
          <Tab label="Saisie manuelle" />
        </Tabs>

      {activeTab === 0 && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setShowScanner(true)}
            sx={{ ...styles.button, mb: 3 }}
            startIcon={<span role="img" aria-label="scanner">📷</span>}
          >
            Scanner un QR Code
          </Button>

          {beneficiaryInfo && (
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informations du Bénéficiaire
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Site:</strong> {beneficiaryInfo.site_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>ID Ménage:</strong> {beneficiaryInfo.household_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Nom:</strong> {`${beneficiaryInfo.first_name} ${beneficiaryInfo.middle_name || ''} ${beneficiaryInfo.last_name}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Numéro Token:</strong> {beneficiaryInfo.token_number}</Typography>
                </Grid>
              </Grid>
              
              {/* Bouton d'enregistrement de distribution */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleRegisterDistribution}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Enregistrer la distribution'}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={styles.formContainer}>
          <BeneficiaireSearchTab
            onBeneficiaireSelect={(beneficiaire) => {
              setBeneficiaryInfo(beneficiaire);
              setShowSignaturePad(true);
            }}
          />
        </Box>
      )}

      {activeTab === 2 && (
        <Box component="form" onSubmit={handleManualSubmit} sx={styles.formContainer}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom du site"
                name="site_name"
                value={manualFormData.site_name}
                onChange={handleManualChange}
                required
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID du ménage"
                name="household_id"
                value={manualFormData.household_id}
                onChange={handleManualChange}
                required
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de token"
                name="token_number"
                value={manualFormData.token_number}
                onChange={handleManualChange}
                required
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de bénéficiaires"
                name="beneficiary_count"
                type="number"
                value={manualFormData.beneficiary_count}
                onChange={handleManualChange}
                required
                InputProps={{ inputProps: { min: 1 } }}
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Prénom"
                name="first_name"
                value={manualFormData.first_name}
                onChange={handleManualChange}
                required
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Deuxième nom"
                name="middle_name"
                value={manualFormData.middle_name}
                onChange={handleManualChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nom"
                name="last_name"
                value={manualFormData.last_name}
                onChange={handleManualChange}
                required
                sx={styles.formField}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse du site"
                name="site_address"
                value={manualFormData.site_address}
                onChange={handleManualChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bénéficiaire alternatif"
                name="alternate_recipient"
                value={manualFormData.alternate_recipient}
                onChange={handleManualChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowSignaturePad(true)}
              disabled={!manualFormData.first_name || !manualFormData.last_name || !manualFormData.token_number}
              sx={styles.button}
              startIcon={<span role="img" aria-label="signature">✍️</span>}
            >
              Ajouter une signature
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading || !signature}
              sx={{
                ...styles.button,
                background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1b5e20, #2e7d32)'
                }
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <span role="img" aria-label="save">💾</span>}
            >
              {loading ? 'Traitement...' : 'Enregistrer'}
            </Button>
          </Box>

          {showSignaturePad && (
            <Box sx={{ width: '100%', height: 300, border: '1px solid #ccc', mb: 2 }}>
              <SignaturePad
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: 'signature-canvas'
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => {
                    if (signaturePad) signaturePad.clear();
                  }}
                  sx={styles.secondaryButton}
                  startIcon={<span role="img" aria-label="clear">🗑️</span>}
                >
                  Effacer
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSave}
                  disabled={loading}
                  sx={styles.button}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <span role="img" aria-label="save">💾</span>}
                >
                  {loading ? 'Traitement...' : 'Enregistrer'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Scanner Dialog */}
      <Dialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Scanner QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
            {showScanner && (
              <>
                <QrReader
                  constraints={{
                    deviceId: selectedCamera,
                    facingMode: selectedCamera ? undefined : 'environment',
                    aspectRatio: 1,
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                  }}
                  videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  videoContainerStyle={{ 
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  scanDelay={1500} // Augmenter davantage le délai entre les scans
                  onResult={(result) => {
                    // Ne traiter le résultat que si nous ne sommes pas déjà en train de scanner
                    // et si le résultat est différent du dernier résultat traité
                    if (result && !scanning && result.getText() !== lastScannedData) {
                      // Utiliser setTimeout pour éviter les problèmes de concurrence
                      setTimeout(() => {
                        if (!scanning) {
                          debouncedHandleQrCodeScan(result.getText());
                        }
                      }, 100);
                    }
                  }}
                  ViewFinder={() => (
                    <Box
                      component="div"
                      sx={{
                        border: '2px solid #00ff00',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '200px',
                        height: '200px',
                        zIndex: 10, // Ajouter un z-index pour s'assurer que le viseur est au-dessus
                        pointerEvents: 'none', // Éviter les interférences avec les événements de clic
                        '&::before, &::after': {
                          content: '""',
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          borderColor: '#00ff00'
                        },
                        '&::before': {
                          top: 0,
                          left: 0,
                          borderTop: '2px solid',
                          borderLeft: '2px solid'
                        },
                        '&::after': {
                          bottom: 0,
                          right: 0,
                          borderBottom: '2px solid',
                          borderRight: '2px solid'
                        }
                      }}
                    />
                  )}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    gap: 1
                  }}
                >
                  {cameras.length > 1 && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCameraSwitch}
                      size="small"
                    >
                      Changer de caméra
                    </Button>
                  )}
                </Box>
                {scanning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: 2,
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CircularProgress size={30} sx={{ color: 'white' }} />
                    {retryCount > 0 && (
                      <Typography color="white" variant="caption">
                        Tentative {retryCount}/{MAX_RETRIES}...
                      </Typography>
                    )}
                  </Box>
                )}
                {scanError && (
                  <Typography
                    color="error"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: 1,
                      borderRadius: 1
                    }}
                  >
                    {scanError}
                  </Typography>
                )}
                {error && (
                  <Typography
                    color="error"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: 1,
                      borderRadius: 1
                    }}
                  >
                    {error}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScanner(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      </Paper>
      {/* Signature Dialog */}
      <Dialog 
        open={showSignaturePad} 
        onClose={() => setShowSignaturePad(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f0f7ff', 
          borderBottom: '1px solid #e2e8f0',
          fontWeight: 600,
          color: '#1a365d'
        }}>
          Collecte de signatures
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, color: '#475569' }}>
            Veuillez signer dans le cadre ci-dessous pour confirmer la distribution avec des techniques numériques pour garantir la conformité.
          </Typography>
          <Box 
            sx={{ 
              border: '2px solid #e2e8f0', 
              borderRadius: '8px', 
              backgroundColor: '#ffffff',
              mb: 2
            }}
          >
            <SignaturePad
              ref={(ref) => setSignaturePad(ref)}
              canvasProps={{ 
                className: 'signature-canvas',
                style: { 
                  width: '100%', 
                  height: '200px',
                  borderRadius: '6px'
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => {
                if (signaturePad) signaturePad.clear();
              }}
              sx={styles.secondaryButton}
              startIcon={<span role="img" aria-label="clear">🗑️</span>}
            >
              Effacer
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                if (signaturePad) {
                  setSignature(signaturePad.toDataURL());
                  setShowSignaturePad(false);
                }
              }}
              sx={styles.button}
              startIcon={<span role="img" aria-label="save">💾</span>}
            >
              Sauvegarder
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}