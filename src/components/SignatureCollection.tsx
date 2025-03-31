import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { QrReader } from 'react-qr-reader';
import SignaturePad from 'react-signature-canvas';
import toast from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState(0);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<BeneficiaryInfo | null>(null);
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
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          // Prefer back camera
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
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
      const response = await fetch('http://localhost:3001/api/register-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...manualFormData,
          signature
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement');
      }

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

  // Debounce function to prevent multiple rapid scans
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

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

  const handleQrCodeScan = async (data: string | null) => {
    if (!data || data === lastScannedData) return;
    setLastScannedData(data);
    setScanning(true);
    setScanError(null);
    setRetryCount(0);

    try {
      console.log('Scanned QR code data:', data);

      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        qrData = { token_number: data };
      }

      const result = await retryApiCall(async () => {
        const response = await fetch('http://localhost:3001/api/process-qr-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrData }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur de connexion au serveur' }));
          throw new Error(errorData.error || 'Erreur lors du traitement du QR code');
        }

        return response.json();
      });

      // Play success sound
      playSuccessSound();
      
      setBeneficiaryInfo(result.data);
      setShowScanner(false);
      setShowSignaturePad(true);
      toast.success('Bénéficiaire trouvé');
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanError(error instanceof Error ? error.message : 'Erreur lors du scan');
      toast.error(error instanceof Error ? error.message : 'Erreur lors du scan');
      setBeneficiaryInfo(null);
    } finally {
      setScanning(false);
      setTimeout(() => {
        setLastScannedData(null);
        setRetryCount(0);
      }, 2000);
    }
  };

  const debouncedHandleQrCodeScan = debounce(handleQrCodeScan, 500);

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleSave = async () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      try {
        const signatureData = signaturePad.toDataURL();
        
        // Record signature using API
        const response = await fetch('http://localhost:3001/api/record-signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ householdId: beneficiaryInfo?.household_id, signatureData }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement de la signature');
        }

        toast.success('Signature enregistrée avec succès');
        
        // Reset form
        setBeneficiaryInfo(null);
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Collection des Signatures
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
        sx={{ mb: 3 }}
      >
        <Tab label="Scanner QR Code" />
        <Tab label="Émargement Manuel" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setShowScanner(true)}
            sx={{ mb: 3 }}
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
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleManualSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nom du site"
                  name="site_name"
                  value={manualFormData.site_name}
                  onChange={handleManualChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="ID du ménage"
                  name="household_id"
                  value={manualFormData.household_id}
                  onChange={handleManualChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Numéro de jeton"
                  name="token_number"
                  value={manualFormData.token_number}
                  onChange={handleManualChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Nombre de bénéficiaires"
                  name="beneficiary_count"
                  value={manualFormData.beneficiary_count}
                  onChange={handleManualChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  label="Prénom"
                  name="first_name"
                  value={manualFormData.first_name}
                  onChange={handleManualChange}
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
                  required
                  fullWidth
                  label="Nom"
                  name="last_name"
                  value={manualFormData.last_name}
                  onChange={handleManualChange}
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

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowSignaturePad(true)}
                disabled={loading}
              >
                {signature ? 'Modifier la signature' : 'Ajouter une signature'}
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !signature}
              >
                {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
              </Button>
            </Box>

            {showSignaturePad && (
              <Box sx={{ width: '100%', height: 300, border: '1px solid #ccc', mb: 2 }}>
                <SignaturePad
                  ref={(ref) => setSignaturePad(ref)}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas'
                  }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="outlined" onClick={handleClear}>
                    Effacer
                  </Button>
                  <Button variant="contained" onClick={handleSave}>
                    Sauvegarder
                  </Button>
                </Box>
              </Box>
            )}

            {signature && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <img src={signature} alt="Signature" style={{ maxWidth: 300, border: '1px solid #ccc' }} />
              </Box>
            )}
          </form>
        </Paper>
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
                  scanDelay={300}
                  onResult={(result) => {
                    if (result) {
                      debouncedHandleQrCodeScan(result.getText());
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
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScanner(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog 
        open={showSignaturePad} 
        onClose={() => setShowSignaturePad(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Signature</DialogTitle>
        <DialogContent>
          <Box sx={{ border: '1px solid #ccc', mt: 2 }}>
            <SignaturePad
              ref={(ref) => setSignaturePad(ref)}
              canvasProps={{
                width: 500,
                height: 200,
                style: { width: '100%', height: '200px' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (signaturePad) signaturePad.clear();
          }}>
            Effacer
          </Button>
          <Button onClick={() => setShowSignaturePad(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => {
              if (signaturePad) {
                setSignature(signaturePad.toDataURL());
                setShowSignaturePad(false);
              }
            }}
            variant="contained" 
            color="primary"
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}