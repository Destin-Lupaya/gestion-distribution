import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

interface Evenement {
  evenement_id: string;
  programme_id: string;
  nom_programme: string;
  site_id: number;
  nom_site: string;
  date_distribution_prevue: string;
  type_assistance_prevue: string;
  statut_evenement: 'Planifié' | 'En cours' | 'Terminé' | 'Annulé';
}

interface Beneficiaire {
  beneficiaire_id: number;
  household_id: string;
  token_number: string;
  household_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  statut_eligibilite: 'Eligible' | 'Non-Eligible' | 'Servi' | 'Absent';
}

interface Assistance {
  assistance_id: string;
  evenement_id: string;
  beneficiaire_id: number;
  household_id: string;
  date_reception_effective: string;
  heure_reception_effective: string;
  articles_recus: any;
  quantite_recue: number;
  mode_verification: string;
  nom_programme: string;
  nom_site: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  token_number: string;
  household_name: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AssistancesDistribuees: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [selectedEvenement, setSelectedEvenement] = useState<string>('');
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<Beneficiaire | null>(null);
  const [detailsAssistance, setDetailsAssistance] = useState<Assistance | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [filterToken, setFilterToken] = useState<string>('');
  const [filterNom, setFilterNom] = useState<string>('');
  const [showServed, setShowServed] = useState<boolean>(true);
  const [showNotServed, setShowNotServed] = useState<boolean>(true);

  // Charger les événements au chargement du composant
  useEffect(() => {
    fetchEvenements();
  }, []);

  // Charger les bénéficiaires lorsqu'un événement est sélectionné
  useEffect(() => {
    if (selectedEvenement) {
      fetchBeneficiaires(selectedEvenement);
      fetchAssistances(selectedEvenement);
    }
  }, [selectedEvenement]);

  const fetchEvenements = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/evenements-distribution');
      setEvenements(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Impossible de charger les événements. Veuillez réessayer plus tard.');
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiaires = async (evenementId: string) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/api/evenements-distribution/${evenementId}/beneficiaires`);
      // Vérifier que les données reçues sont un tableau
      if (Array.isArray(response.data)) {
        setBeneficiaires(response.data);
      } else {
        console.warn('Les données reçues ne sont pas un tableau:', response.data);
        // Initialiser avec un tableau vide si les données ne sont pas un tableau
        setBeneficiaires([]);
      }
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des bénéficiaires:', err);
      setError('Impossible de charger les bénéficiaires. Veuillez réessayer plus tard.');
      toast.error('Erreur lors du chargement des bénéficiaires');
      // Initialiser avec un tableau vide en cas d'erreur
      setBeneficiaires([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistances = async (evenementId: string) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/api/assistances-distribuees/evenement/${evenementId}`);
      setAssistances(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des assistances:', err);
      setError('Impossible de charger les assistances. Veuillez réessayer plus tard.');
      toast.error('Erreur lors du chargement des assistances');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEvenementChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedEvenement(e.target.value as string);
  };

  const handleOpenDialog = (beneficiaire: Beneficiaire) => {
    setSelectedBeneficiaire(beneficiaire);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBeneficiaire(null);
  };

  const handleOpenFilterDialog = () => {
    setOpenFilterDialog(true);
  };

  const handleCloseFilterDialog = () => {
    setOpenFilterDialog(false);
  };

  const handleOpenDetailsDialog = (assistance: Assistance) => {
    setDetailsAssistance(assistance);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setDetailsAssistance(null);
  };

  const handleEnregistrerAssistance = async () => {
    if (!selectedBeneficiaire || !selectedEvenement) return;
    
    try {
      setLoading(true);
      
      // Données de l'assistance
      const assistanceData = {
        evenement_id: selectedEvenement,
        beneficiaire_id: selectedBeneficiaire.beneficiaire_id,
        household_id: selectedBeneficiaire.household_id,
        articles_recus: {}, // À personnaliser selon les besoins
        quantite_recue: 1,
        agent_distributeur_id: 'current_user_id', // À remplacer par l'ID de l'utilisateur connecté
        mode_verification: 'Signature',
        notes_distribution: 'Distribution effectuée'
      };
      
      await apiService.post('/api/assistances-distribuees', assistanceData);
      toast.success('Assistance enregistrée avec succès');
      
      // Rafraîchir les données
      fetchBeneficiaires(selectedEvenement);
      fetchAssistances(selectedEvenement);
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'assistance:', err);
      toast.error('Erreur lors de l\'enregistrement de l\'assistance');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterDate(null);
    setFilterToken('');
    setFilterNom('');
    setShowServed(true);
    setShowNotServed(true);
    handleCloseFilterDialog();
  };

  const handleApplyFilters = () => {
    handleCloseFilterDialog();
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'Eligible': return 'primary';
      case 'Non-Eligible': return 'error';
      case 'Servi': return 'success';
      case 'Absent': return 'warning';
      default: return 'default';
    }
  };

  // S'assurer que beneficiaires est un tableau avant d'appliquer le filtre
  const filteredBeneficiaires = Array.isArray(beneficiaires) ? beneficiaires.filter(beneficiaire => {
    // Filtre par statut
    if (filterStatus !== 'all' && beneficiaire.statut_eligibilite !== filterStatus) {
      return false;
    }
    
    // Filtre par statut servi/non servi
    if (!showServed && beneficiaire.statut_eligibilite === 'Servi') {
      return false;
    }
    
    if (!showNotServed && beneficiaire.statut_eligibilite !== 'Servi') {
      return false;
    }
    
    // Filtre par token
    if (filterToken && !beneficiaire.token_number.toLowerCase().includes(filterToken.toLowerCase())) {
      return false;
    }
    
    // Filtre par nom
    if (filterNom) {
      const nomComplet = `${beneficiaire.first_name} ${beneficiaire.middle_name || ''} ${beneficiaire.last_name}`.toLowerCase();
      if (!nomComplet.includes(filterNom.toLowerCase()) && 
          !beneficiaire.household_name.toLowerCase().includes(filterNom.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }) : [];

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Suivi des Assistances Distribuées
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="assistances tabs">
            <Tab label="Distribution par Événement" />
            <Tab label="Historique des Assistances" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="evenement-label">Sélectionner un événement de distribution</InputLabel>
                  <Select
                    labelId="evenement-label"
                    value={selectedEvenement}
                    onChange={handleEvenementChange as any}
                    label="Sélectionner un événement de distribution"
                  >
                    {evenements.map(evenement => (
                      <MenuItem key={evenement.evenement_id} value={evenement.evenement_id}>
                        {evenement.nom_programme} - {evenement.nom_site} - {new Date(evenement.date_distribution_prevue).toLocaleDateString()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<FilterListIcon />}
                    onClick={handleOpenFilterDialog}
                    sx={{ mr: 1 }}
                  >
                    Filtres
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={showServed} 
                        onChange={(e) => setShowServed(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Servis"
                  />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={showNotServed} 
                        onChange={(e) => setShowNotServed(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Non servis"
                  />
                </Box>
              </Grid>
            </Grid>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : !selectedEvenement ? (
              <Alert severity="info">Veuillez sélectionner un événement de distribution pour voir les bénéficiaires.</Alert>
            ) : beneficiaires.length === 0 ? (
              <Alert severity="info">Aucun bénéficiaire n'est associé à cet événement. Veuillez générer une liste de distribution.</Alert>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  {filteredBeneficiaires.length} bénéficiaires affichés sur {beneficiaires.length} au total
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Token</TableCell>
                        <TableCell>Ménage</TableCell>
                        <TableCell>Nom du bénéficiaire</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBeneficiaires.map((beneficiaire) => (
                        <TableRow key={beneficiaire.beneficiaire_id}>
                          <TableCell>{beneficiaire.token_number}</TableCell>
                          <TableCell>{beneficiaire.household_name}</TableCell>
                          <TableCell>
                            {beneficiaire.first_name} {beneficiaire.middle_name} {beneficiaire.last_name}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={beneficiaire.statut_eligibilite} 
                              color={getStatusChipColor(beneficiaire.statut_eligibilite) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {beneficiaire.statut_eligibilite !== 'Servi' ? (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<CheckCircleOutlineIcon />}
                                onClick={() => handleOpenDialog(beneficiaire)}
                              >
                                Distribuer
                              </Button>
                            ) : (
                              <Tooltip title="Déjà servi">
                                <span>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckCircleOutlineIcon />}
                                    disabled
                                  >
                                    Servi
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Historique des Assistances Distribuées
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : !selectedEvenement ? (
              <Alert severity="info">Veuillez sélectionner un événement de distribution pour voir l'historique des assistances.</Alert>
            ) : assistances.length === 0 ? (
              <Alert severity="info">Aucune assistance n'a été distribuée pour cet événement.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Heure</TableCell>
                      <TableCell>Token</TableCell>
                      <TableCell>Bénéficiaire</TableCell>
                      <TableCell>Mode de vérification</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assistances.map((assistance) => (
                      <TableRow key={assistance.assistance_id}>
                        <TableCell>{new Date(assistance.date_reception_effective).toLocaleDateString()}</TableCell>
                        <TableCell>{assistance.heure_reception_effective.substring(0, 5)}</TableCell>
                        <TableCell>{assistance.token_number}</TableCell>
                        <TableCell>
                          {assistance.first_name} {assistance.middle_name} {assistance.last_name}
                        </TableCell>
                        <TableCell>{assistance.mode_verification}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenDetailsDialog(assistance)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>
      </Box>

      {/* Dialogue pour enregistrer une assistance */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Enregistrer une assistance
        </DialogTitle>
        <DialogContent>
          {selectedBeneficiaire && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Bénéficiaire: {selectedBeneficiaire.first_name} {selectedBeneficiaire.middle_name} {selectedBeneficiaire.last_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Ménage: {selectedBeneficiaire.household_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Token: {selectedBeneficiaire.token_number}
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Vous êtes sur le point d'enregistrer une assistance pour ce bénéficiaire. Confirmez-vous que l'assistance a été distribuée ?
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Annuler</Button>
          <Button 
            onClick={handleEnregistrerAssistance} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue pour les filtres */}
      <Dialog open={openFilterDialog} onClose={handleCloseFilterDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Filtrer les bénéficiaires
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Statut</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as string)}
                  label="Statut"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="Eligible">Eligible</MenuItem>
                  <MenuItem value="Non-Eligible">Non-Eligible</MenuItem>
                  <MenuItem value="Servi">Servi</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Numéro de token"
                value={filterToken}
                onChange={(e) => setFilterToken(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nom du bénéficiaire ou du ménage"
                value={filterNom}
                onChange={(e) => setFilterNom(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de distribution"
                  value={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters} color="inherit">Réinitialiser</Button>
          <Button onClick={handleApplyFilters} color="primary" variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue pour les détails d'une assistance */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de l'assistance
        </DialogTitle>
        <DialogContent>
          {detailsAssistance && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Informations sur le bénéficiaire</Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Nom:</strong> {detailsAssistance.first_name} {detailsAssistance.middle_name} {detailsAssistance.last_name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Ménage:</strong> {detailsAssistance.household_name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Token:</strong> {detailsAssistance.token_number}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Informations sur l'assistance</Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Programme:</strong> {detailsAssistance.nom_programme}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Site:</strong> {detailsAssistance.nom_site}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Date:</strong> {new Date(detailsAssistance.date_reception_effective).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Heure:</strong> {detailsAssistance.heure_reception_effective.substring(0, 5)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Mode de vérification:</strong> {detailsAssistance.mode_verification}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Articles distribués</Typography>
                <Box sx={{ mt: 1 }}>
                  {detailsAssistance.articles_recus && Object.keys(detailsAssistance.articles_recus).length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Article</TableCell>
                            <TableCell>Quantité</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(detailsAssistance.articles_recus).map(([article, quantite]) => (
                            <TableRow key={article}>
                              <TableCell>{article}</TableCell>
                              <TableCell>{quantite as string}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2">Aucun détail sur les articles distribués</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog} color="primary">Fermer</Button>
        </DialogActions>
      </Dialog>
    </PageTransition>
  );
};

export default AssistancesDistribuees;
