import React, { useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { 
  Paper, 
  Button, 
  Typography, 
  TextField,
  Grid,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { PageTransition } from './PageTransition';
import toast from 'react-hot-toast';

function SignatureCollection() {
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [beneficiaireId, setBeneficiaireId] = useState('');
  const [beneficiaireInfo, setBeneficiaireInfo] = useState<any>(null);

  const handleSearch = () => {
    // Simuler une recherche
    if (beneficiaireId) {
      setBeneficiaireInfo({
        nom: 'Diallo',
        prenom: 'Amadou',
        localite: 'Zone A',
        statut: 'Déplacé'
      });
      toast.success('Bénéficiaire trouvé');
    }
  };

  const handleClear = () => {
    signaturePad?.clear();
    toast.success('Signature effacée');
  };

  const handleSave = () => {
    if (signaturePad && beneficiaireId) {
      const signatureData = signaturePad.toDataURL();
      console.log('Signature sauvegardée pour le bénéficiaire:', beneficiaireId);
      console.log('Données de signature:', signatureData);
      
      toast.success('Signature enregistrée avec succès');
      
      setBeneficiaireId('');
      setBeneficiaireInfo(null);
      signaturePad.clear();
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Émargement Électronique
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="card-hover">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recherche du Bénéficiaire
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <TextField
                      fullWidth
                      label="ID du Bénéficiaire"
                      value={beneficiaireId}
                      onChange={(e) => setBeneficiaireId(e.target.value)}
                      variant="outlined"
                    />
                    <Box component="span">
                      <Tooltip title={!beneficiaireId ? "Veuillez saisir un ID" : "Rechercher"}>
                        <span>
                          <IconButton 
                            color="primary" 
                            onClick={handleSearch}
                            disabled={!beneficiaireId}
                          >
                            <PersonSearchIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>

                  {beneficiaireInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Typography variant="subtitle2">Informations du bénéficiaire:</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography>
                          Nom: <strong>{beneficiaireInfo.nom}</strong>
                        </Typography>
                        <Typography>
                          Prénom: <strong>{beneficiaireInfo.prenom}</strong>
                        </Typography>
                        <Typography>
                          Localité: <strong>{beneficiaireInfo.localite}</strong>
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={beneficiaireInfo.statut}
                            color={beneficiaireInfo.statut === 'Déplacé' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="card-hover">
                <CardContent>
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
                      startIcon={<DeleteIcon />}
                      onClick={handleClear}
                    >
                      Effacer
                    </Button>
                    <Box component="span">
                      <Tooltip title={!beneficiaireId || !signaturePad?.toData().length ? "Veuillez saisir un ID et une signature" : "Sauvegarder"}>
                        <span>
                          <Button 
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={!beneficiaireId || !signaturePad?.toData().length}
                          >
                            Sauvegarder
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </div>
    </PageTransition>
  );
}

export default SignatureCollection;