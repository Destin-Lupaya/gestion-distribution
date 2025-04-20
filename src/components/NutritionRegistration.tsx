import React, { useState, useRef } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { motion } from 'framer-motion';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

function NutritionRegistration() {
  const [formData, setFormData] = useState({
    numeroEnregistrement: '',
    nomEnfant: '',
    nomMere: '',
    ageMois: '',
    sexe: '',
    province: '',
    territoire: '',
    partenaire: '',
    village: '',
    siteCs: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRationCard, setShowRationCard] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);
  const rationCardRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrint = () => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les paramètres de votre navigateur.');
      return;
    }

    // Créer les données pour le QR code
    const qrData = JSON.stringify({
      id: registeredData?.numeroEnregistrement,
      nom: registeredData?.nomEnfant,
      mere: registeredData?.nomMere,
      age: registeredData?.ageMois,
      sexe: registeredData?.sexe,
      site: registeredData?.siteCs
    });

    // Contenu HTML de la carte de ration
    const cardContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carte de Ration - ${registeredData?.numeroEnregistrement || 'Nutrition'}</title>
        <meta charset="UTF-8">
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <style>
          @page {
            size: A5 landscape;
            margin: 0;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background-color: #f9f9f9;
          }
          .print-container {
            padding: 15px;
            background-color: white;
          }
          .card { 
            border: 2px solid #000; 
            padding: 15px; 
            max-width: 100%; 
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: relative;
            page-break-inside: avoid;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            width: 80px;
            height: 80px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .logo img {
            max-width: 100%;
            max-height: 100%;
          }
          .title-container {
            flex-grow: 1;
            text-align: center;
          }
          .title { 
            font-size: 22px; 
            font-weight: bold; 
            margin: 0;
            color: #00457C;
          }
          .subtitle { 
            font-size: 18px; 
            margin: 5px 0 0;
            color: #0072BC;
          }
          .row { 
            display: flex; 
            margin-bottom: 10px;
            flex-wrap: wrap;
          }
          .col { 
            flex: 1; 
            min-width: 200px;
          }
          .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 10px;
          }
          .enfant-box { 
            border: 2px dashed #00457C; 
            padding: 10px; 
            text-align: center; 
            margin-bottom: 10px;
            background-color: #f0f7ff;
          }
          .enfant-title { 
            font-size: 18px; 
            margin: 0;
            color: #00457C;
          }
          .info-label { 
            font-weight: bold;
            color: #00457C;
          }
          .info-value {
            color: #333;
          }
          .divider { 
            border-top: 2px solid #00457C; 
            margin: 15px 0; 
            padding-top: 10px; 
            text-align: center;
            background-color: #f0f7ff;
          }
          .warning { 
            font-weight: bold;
            color: #d32f2f;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            border: 2px solid #00457C;
          }
          th { 
            border: 1px solid #00457C; 
            padding: 8px; 
            text-align: center;
            background-color: #e3f2fd;
            color: #00457C;
          }
          td { 
            border: 1px solid #00457C; 
            padding: 8px; 
            text-align: center;
          }
          .empty-cell { 
            height: 30px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.05;
            color: #00457C;
            pointer-events: none;
            z-index: 0;
          }
          .info-item {
            margin-bottom: 5px;
            display: flex;
          }
          .info-item .info-label {
            min-width: 120px;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              background-color: white;
            }
            .card { 
              border: 2px solid #000;
              box-shadow: none;
            }
            .print-container {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .print-button {
            background-color: #00457C;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .print-button:hover {
            background-color: #003366;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="card">
            <div class="watermark">WFP/PAM</div>
            <div class="header">
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60" height="60">
                  <path fill="#00457C" d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M256,472 c-119.3,0-216-96.7-216-216S136.7,40,256,40s216,96.7,216,216S375.3,472,256,472z"/>
                  <path fill="#00457C" d="M256,96c-88.4,0-160,71.6-160,160s71.6,160,160,160s160-71.6,160-160S344.4,96,256,96z M256,376 c-66.3,0-120-53.7-120-120s53.7-120,120-120s120,53.7,120,120S322.3,376,256,376z"/>
                  <path fill="#00457C" d="M256,192c-35.3,0-64,28.7-64,64s28.7,64,64,64s64-28.7,64-64S291.3,192,256,192z"/>
                </svg>
              </div>
              <div class="title-container">
                <h1 class="title">CARTE DE RATION N° ${registeredData?.numeroRation || ''}</h1>
                <h2 class="subtitle">Blanket Feeding</h2>
              </div>
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60" height="60">
                  <path fill="#00457C" d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M256,472 c-119.3,0-216-96.7-216-216S136.7,40,256,40s216,96.7,216,216S375.3,472,256,472z"/>
                  <path fill="#00457C" d="M256,96c-88.4,0-160,71.6-160,160s71.6,160,160,160s160-71.6,160-160S344.4,96,256,96z M256,376 c-66.3,0-120-53.7-120-120s53.7-120,120-120s120,53.7,120,120S322.3,376,256,376z"/>
                  <path fill="#00457C" d="M256,192c-35.3,0-64,28.7-64,64s28.7,64,64,64s64-28.7,64-64S291.3,192,256,192z"/>
                </svg>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="info-item">
                  <span class="info-label">Province:</span> 
                  <span class="info-value">${registeredData?.province || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Territoire:</span> 
                  <span class="info-value">${registeredData?.territoire || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Partenaire:</span> 
                  <span class="info-value">${registeredData?.partenaire || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Village:</span> 
                  <span class="info-value">${registeredData?.village || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Site/CS:</span> 
                  <span class="info-value">${registeredData?.siteCs || ''}</span>
                </div>
              </div>
              <div class="col">
                <div class="enfant-box">
                  <h3 class="enfant-title">ENFANT</h3>
                </div>
                <div class="qr-container" id="qrcode"></div>
              </div>
            </div>
            
            <div class="info-item">
              <span class="info-label">Nom & prénom de l'enfant:</span> 
              <span class="info-value">${registeredData?.nomEnfant || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nom & prénom de la mère:</span> 
              <span class="info-value">${registeredData?.nomMere || ''}</span>
            </div>
            
            <div class="row">
              <div class="col" style="flex: 0 0 auto; min-width: 100px;">
                <div class="info-item">
                  <span class="info-label">Age (mois):</span> 
                  <span class="info-value">${registeredData?.ageMois || ''}</span>
                </div>
              </div>
              <div class="col" style="flex: 0 0 auto; min-width: 100px;">
                <div class="info-item">
                  <span class="info-label">Sexe:</span> 
                  <span class="info-value">${registeredData?.sexe === 'M' ? 'M ☑ F ☐' : 'M ☐ F ☑'}</span>
                </div>
              </div>
              <div class="col">
                <div class="info-item">
                  <span class="info-label">Période de validité:</span> 
                  <span class="info-value">${registeredData?.dateDebut || ''} à ${registeredData?.dateFin || ''}</span>
                </div>
              </div>
            </div>
            
            <div class="info-item">
              <span class="info-label">N° d'enregistrement:</span> 
              <span class="info-value">${registeredData?.numeroEnregistrement || ''}</span>
            </div>
            
            <div class="divider">
              <p class="warning">GARDEZ BIEN CETTE CARTE. NE PAS LA PERDRE.</p>
              <p class="warning">Réservé aux agents de distribution !</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Enregistrement</th>
                  <th>1<sup>er</sup></th>
                  <th>2<sup>ème</sup></th>
                  <th>3<sup>ème</sup></th>
                  <th>4<sup>ème</sup></th>
                  <th>5<sup>ème</sup></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="empty-cell"></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>PB</td>
                  <td class="empty-cell"></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="print-button no-print" onclick="window.print(); return false;">Imprimer cette carte</button>
        </div>

        <script>
          window.onload = function() {
            // Générer le QR code
            var typeNumber = 4;
            var errorCorrectionLevel = 'L';
            var qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData('${qrData.replace(/'/g, "\\'")}');
            qr.make();
            document.getElementById('qrcode').innerHTML = qr.createImgTag(5);
          };
        </script>
      </body>
      </html>
    `;

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(cardContent);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.focus();
      // L'impression sera déclenchée par le bouton dans la page
      toast.success('Carte de ration prête à imprimer');
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiService.post('/api/nutrition/register-beneficiary', {
        numero_enregistrement: formData.numeroEnregistrement,
        nom_enfant: formData.nomEnfant,
        nom_mere: formData.nomMere,
        age_mois: parseInt(formData.ageMois),
        sexe: formData.sexe,
        province: formData.province,
        territoire: formData.territoire,
        partenaire: formData.partenaire,
        village: formData.village,
        site_cs: formData.siteCs
      });

      if (response.error) throw new Error(response.error);

      toast.success('Bénéficiaire enregistré avec succès');
      
      setRegisteredData({
        ...formData,
        numeroRation: response.numero_carte || `NUT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        dateDebut: new Date().toLocaleDateString(),
        dateFin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString()
      });
      
      setShowRationCard(true);
      
      setFormData({
        numeroEnregistrement: '',
        nomEnfant: '',
        nomMere: '',
        ageMois: '',
        sexe: '',
        province: '',
        territoire: '',
        partenaire: '',
        village: '',
        siteCs: '',
      });
    } catch (err: any) {
      console.error('Error registering beneficiary:', err);
      setError(err.message);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
            Enregistrement Nutrition
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Numéro d'enregistrement"
                  name="numeroEnregistrement"
                  value={formData.numeroEnregistrement}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nom de l'enfant"
                  name="nomEnfant"
                  value={formData.nomEnfant}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nom de la mère"
                  name="nomMere"
                  value={formData.nomMere}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Âge (en mois)"
                  name="ageMois"
                  type="number"
                  value={formData.ageMois}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Sexe</InputLabel>
                  <Select
                    name="sexe"
                    value={formData.sexe}
                    label="Sexe"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Territoire"
                  name="territoire"
                  value={formData.territoire}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Partenaire"
                  name="partenaire"
                  value={formData.partenaire}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Village"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Site/Centre de Santé"
                  name="siteCs"
                  value={formData.siteCs}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear', repeatDelay: 0 }}>
                  {loading ? '⟳' : '✓'}
                </motion.div>}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Dialog 
          open={showRationCard} 
          onClose={() => setShowRationCard(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Carte de Ration</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<PrintIcon />} 
              onClick={handlePrint}
            >
              Imprimer
            </Button>
          </DialogTitle>
          <DialogContent>
            <div ref={rationCardRef} style={{ padding: '20px' }}>
              <Box sx={{ border: '1px solid #000', p: 2, maxWidth: '600px', margin: '0 auto' }}>
                <Box sx={{ textAlign: 'center', borderBottom: '1px solid #000', pb: 1, mb: 2 }}>
                  <Typography variant="h5" fontWeight="bold">
                    CARTE DE RATION N° {registeredData?.numeroRation}
                  </Typography>
                  <Typography variant="h6">
                    Blanket Feeding
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Province:</strong> {registeredData?.province}</Typography>
                    <Typography><strong>Territoire:</strong> {registeredData?.territoire}</Typography>
                    <Typography><strong>Partenaire:</strong> {registeredData?.partenaire}</Typography>
                    <Typography><strong>Village:</strong> {registeredData?.village}</Typography>
                    <Typography><strong>Site/CS:</strong> {registeredData?.siteCs}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ border: '1px dashed #000', p: 1, textAlign: 'center', mb: 1 }}>
                      <Typography variant="h6">ENFANT</Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography><strong>Nom & prénom de l'enfant:</strong> {registeredData?.nomEnfant}</Typography>
                  <Typography><strong>Nom & prénom de la mère:</strong> {registeredData?.nomMere}</Typography>
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <Typography><strong>Age (mois):</strong> {registeredData?.ageMois}</Typography>
                    <Box sx={{ ml: 4 }}>
                      <Typography><strong>Sexe:</strong> {registeredData?.sexe === 'M' ? 'M ☑ F ☐' : 'M ☐ F ☑'}</Typography>
                    </Box>
                    <Box sx={{ ml: 4 }}>
                      <Typography><strong>Période de validité:</strong> {registeredData?.dateDebut} à {registeredData?.dateFin}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ mt: 1 }}><strong>N° d'enregistrement:</strong> {registeredData?.numeroEnregistrement}</Typography>
                </Box>
                
                <Box sx={{ mt: 3, borderTop: '1px solid #000', pt: 1, textAlign: 'center' }}>
                  <Typography fontWeight="bold">
                    GARDEZ BIEN CETTE CARTE. NE PAS LA PERDRE.
                  </Typography>
                  <Typography fontWeight="bold" sx={{ mt: 1 }}>
                    Réservé aux agents de distribution !
                  </Typography>
                </Box>
                
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small" sx={{ border: '1px solid #000' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ border: '1px solid #000' }}>Date</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>Enregistrement</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>1<sup>er</sup></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>2<sup>ème</sup></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>3<sup>ème</sup></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>4<sup>ème</sup></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>5<sup>ème</sup></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ border: '1px solid #000', height: '30px' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: '1px solid #000' }}>PB</TableCell>
                        <TableCell sx={{ border: '1px solid #000', height: '30px' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </div>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowRationCard(false)} 
              color="primary" 
              startIcon={<CloseIcon />}
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </PageTransition>
  );
}

export default NutritionRegistration;