import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  SelectChangeEvent, // Import for Select event type
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr'; // Ensure locale is set
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { PageTransition } from './PageTransition'; // Assume this exists
import apiService from '../services/apiService'; // Assume this exists and is configured
import toast from 'react-hot-toast';

dayjs.locale('fr'); // Set locale globally for dayjs

// --- Constants ---
const API_ENDPOINTS = {
  EVENEMENTS: '/api/evenements-distribution',
  PROGRAMMES: '/api/programmes',
  SITES: '/api/sites',
  GENERER_LISTE: (id: string) => `/api/evenements-distribution/${id}/generer-liste`,
};

const EVENT_STATUSES = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  REPORTE: 'Reporté',
  ANNULE: 'Annulé',
} as const;

type EventStatus = typeof EVENT_STATUSES[keyof typeof EVENT_STATUSES];

const CHIP_COLORS: Record<EventStatus, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  [EVENT_STATUSES.PLANIFIE]: 'primary',
  [EVENT_STATUSES.EN_COURS]: 'warning',
  [EVENT_STATUSES.TERMINE]: 'success',
  [EVENT_STATUSES.REPORTE]: 'info',
  [EVENT_STATUSES.ANNULE]: 'error',
};

// --- Interfaces ---
interface Programme {
  id: string;
  nom: string;
  // ... other fields if needed by this component
}

interface Site {
  id: string; // Changed to string for consistency if API returns string IDs
  nom: string;
  // ... other fields
}

// More specific type for quantity/details
type AssistanceDetails = Record<string, number | string>;

interface Evenement {
  id: string; // Assuming API uses 'id' instead of 'evenement_id' consistently
  titre: string;
  description?: string;
  programme_id: string;
  site_id: string;
  nom_programme?: string; // Often populated by backend joins
  nom_site?: string;     // Often populated by backend joins
  date_distribution_prevue: string; // ISO Date string
  heure_debut_prevue?: string; // HH:mm:ss
  heure_fin_prevue?: string; // HH:mm:ss
  type_assistance_prevue: string;
  details_assistance?: AssistanceDetails;
  quantite_totale_prevue?: AssistanceDetails; // Could be same as details_assistance or a summary
  unite_mesure?: string;
  nombre_beneficiaires_attendus?: number;
  statut_evenement: EventStatus;
  responsable_evenement?: string;
  notes_evenement?: string;
}

interface EvenementFormData {
  programme_id: string;
  site_id: string; // Changed to string
  nom_evenement: string;
  description_evenement?: string;
  date_distribution_prevue: Dayjs | null;
  heure_debut_prevue: Dayjs | null;
  heure_fin_prevue: Dayjs | null;
  type_assistance_prevue: string;
  details_assistance_json: string; // For TextField input
  quantite_totale_prevue_json: string; // For TextField input
  unite_mesure?: string;
  nombre_beneficiaires_attendus?: string;
  statut_evenement: EventStatus;
  responsable_evenement?: string;
  notes_evenement?: string;
}

const INITIAL_EVENT_FORM_DATA: EvenementFormData = {
  programme_id: '',
  site_id: '',
  nom_evenement: '',
  description_evenement: '',
  date_distribution_prevue: null,
  heure_debut_prevue: null,
  heure_fin_prevue: null,
  type_assistance_prevue: '',
  details_assistance_json: '{}',
  quantite_totale_prevue_json: '{}',
  unite_mesure: '',
  nombre_beneficiaires_attendus: '',
  statut_evenement: EVENT_STATUSES.PLANIFIE,
  responsable_evenement: '',
  notes_evenement: '',
};

// --- Helper Functions ---
const safelyParseJSON = (jsonString: string, fieldName: string): AssistanceDetails | null => {
  if (!jsonString || jsonString.trim() === '') return {};
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    toast.error(`Format JSON invalide pour le champ "${fieldName}". Utilisez un objet.`);
    return null;
  } catch (e) {
    toast.error(`Erreur de parsing JSON pour le champ "${fieldName}": ${(e as Error).message}`);
    return null;
  }
};

const formatDateForDisplay = (dateString?: string) => 
  dateString ? dayjs(dateString).format('DD/MM/YYYY') : 'N/A';

const formatTimeForDisplay = (timeString?: string) =>
  timeString ? dayjs(timeString, 'HH:mm:ss').format('HH:mm') : '';


// --- TabPanel Component (No changes needed from original) ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) { /* ... as in original ... */ }
function a11yProps(index: number) { /* ... as in original ... */ }

// --- Main Component ---
const CalendrierDistribution: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  const [loadingEvenements, setLoadingEvenements] = useState(true);
  const [loadingProgrammes, setLoadingProgrammes] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);

  const [error, setError] = useState<string | null>(null);
  
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [editingEvenement, setEditingEvenement] = useState<Evenement | null>(null);
  const [formData, setFormData] = useState<EvenementFormData>(INITIAL_EVENT_FORM_DATA);

  const [openListeDialog, setOpenListeDialog] = useState(false);
  const [selectedEvenementForListe, setSelectedEvenementForListe] = useState<Evenement | null>(null);
  
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [deletingEvenementId, setDeletingEvenementId] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchEvenements = useCallback(async () => {
    setLoadingEvenements(true);
    setError(null);
    try {
      const response = await apiService.get<{ data: Evenement[] }>(API_ENDPOINTS.EVENEMENTS); // Assuming API wraps in 'data'
      setEvenements(response.data.data || []); // Adjust if API structure is different
    } catch (err: any) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Impossible de charger les événements.');
      toast.error('Erreur chargement événements: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingEvenements(false);
    }
  }, []);

  const fetchProgrammes = useCallback(async () => {
    setLoadingProgrammes(true);
    try {
      const response = await apiService.get<{ data: Programme[] }>(API_ENDPOINTS.PROGRAMMES);
      setProgrammes(response.data.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des programmes:', err);
      toast.error('Erreur chargement programmes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingProgrammes(false);
    }
  }, []);

  const fetchSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const response = await apiService.get<{ data: Site[] }>(API_ENDPOINTS.SITES);
      setSites(response.data.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des sites:', err);
      toast.error('Erreur chargement sites: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    fetchEvenements();
    fetchProgrammes();
    fetchSites();
  }, [fetchEvenements, fetchProgrammes, fetchSites]);

  // --- Event Dialog Logic ---
  const mapEvenementToFormData = (evenement: Evenement): EvenementFormData => ({
    programme_id: evenement.programme_id,
    site_id: evenement.site_id,
    nom_evenement: evenement.titre,
    description_evenement: evenement.description || '',
    date_distribution_prevue: dayjs(evenement.date_distribution_prevue),
    heure_debut_prevue: evenement.heure_debut_prevue ? dayjs(evenement.heure_debut_prevue, 'HH:mm:ss') : null,
    heure_fin_prevue: evenement.heure_fin_prevue ? dayjs(evenement.heure_fin_prevue, 'HH:mm:ss') : null,
    type_assistance_prevue: evenement.type_assistance_prevue,
    details_assistance_json: JSON.stringify(evenement.details_assistance || {}),
    quantite_totale_prevue_json: JSON.stringify(evenement.quantite_totale_prevue || {}),
    unite_mesure: evenement.unite_mesure || '',
    nombre_beneficiaires_attendus: evenement.nombre_beneficiaires_attendus?.toString() || '',
    statut_evenement: evenement.statut_evenement,
    responsable_evenement: evenement.responsable_evenement || '',
    notes_evenement: evenement.notes_evenement || '',
  });

  const handleOpenEventDialog = useCallback((evenement?: Evenement) => {
    if (evenement) {
      setEditingEvenement(evenement);
      setFormData(mapEvenementToFormData(evenement));
    } else {
      setEditingEvenement(null);
      setFormData(INITIAL_EVENT_FORM_DATA);
    }
    setOpenEventDialog(true);
  }, []);

  const handleCloseEventDialog = useCallback(() => {
    setOpenEventDialog(false);
    setEditingEvenement(null); // Clear editing state
  }, []);

  const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFormSelectChange = useCallback((e: SelectChangeEvent<string | EventStatus>) => { // More specific type
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  }, []);

  const handleFormDateChange = useCallback((value: Dayjs | null) => {
    setFormData(prev => ({ ...prev, date_distribution_prevue: value }));
  }, []);

  const handleFormTimeChange = useCallback((field: 'heure_debut_prevue' | 'heure_fin_prevue', value: Dayjs | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFormSubmit = useCallback(async () => {
    if (!formData.programme_id || !formData.site_id || !formData.date_distribution_prevue || !formData.type_assistance_prevue || !formData.nom_evenement) {
      toast.error('Veuillez remplir tous les champs obligatoires (marqués d\'une *)');
      return;
    }

    const detailsAssistance = safelyParseJSON(formData.details_assistance_json, 'Détails Assistance');
    const quantiteTotalePrevue = safelyParseJSON(formData.quantite_totale_prevue_json, 'Quantité Totale Prévue');

    if (detailsAssistance === null || quantiteTotalePrevue === null) return; // Error already toasted

    setIsSubmittingForm(true);
    try {
      const payload = {
        programme_id: formData.programme_id,
        site_id: formData.site_id,
        titre: formData.nom_evenement,
        description: formData.description_evenement,
        date_distribution_prevue: formData.date_distribution_prevue?.format('YYYY-MM-DD'),
        heure_debut_prevue: formData.heure_debut_prevue?.format('HH:mm:ss'),
        heure_fin_prevue: formData.heure_fin_prevue?.format('HH:mm:ss'),
        type_assistance_prevue: formData.type_assistance_prevue,
        details_assistance: detailsAssistance,
        quantite_totale_prevue: quantiteTotalePrevue,
        unite_mesure: formData.unite_mesure,
        nombre_beneficiaires_attendus: formData.nombre_beneficiaires_attendus ? parseInt(formData.nombre_beneficiaires_attendus, 10) : undefined,
        statut_evenement: formData.statut_evenement,
        responsable_evenement: formData.responsable_evenement,
        notes_evenement: formData.notes_evenement,
      };

      if (editingEvenement) {
        await apiService.put(`${API_ENDPOINTS.EVENEMENTS}/${editingEvenement.id}`, payload);
        toast.success('Événement mis à jour avec succès');
      } else {
        await apiService.post(API_ENDPOINTS.EVENEMENTS, payload);
        toast.success('Événement créé avec succès');
      }
      handleCloseEventDialog();
      fetchEvenements(); // Refresh list
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement de l\'événement:', err);
      toast.error('Échec enregistrement: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingForm(false);
    }
  }, [formData, editingEvenement, fetchEvenements, handleCloseEventDialog]);

  // --- Delete Event Logic ---
  const handleOpenDeleteConfirmDialog = useCallback((evenementId: string) => {
    setDeletingEvenementId(evenementId);
    setOpenDeleteConfirmDialog(true);
  }, []);

  const handleCloseDeleteConfirmDialog = useCallback(() => {
    setOpenDeleteConfirmDialog(false);
    setDeletingEvenementId(null);
  }, []);

  const confirmDeleteEvenement = useCallback(async () => {
    if (!deletingEvenementId) return;
    setIsSubmittingForm(true); // Reuse for general form submission spinner
    try {
      await apiService.delete(`${API_ENDPOINTS.EVENEMENTS}/${deletingEvenementId}`);
      toast.success('Événement supprimé avec succès');
      fetchEvenements();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Échec suppression: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingForm(false);
      handleCloseDeleteConfirmDialog();
    }
  }, [deletingEvenementId, fetchEvenements, handleCloseDeleteConfirmDialog]);

  // --- Generate Liste Logic ---
  const handleOpenListeDialog = useCallback((evenement: Evenement) => {
    setSelectedEvenementForListe(evenement);
    setOpenListeDialog(true);
  }, []);
  const handleCloseListeDialog = useCallback(() => {
    setOpenListeDialog(false);
    setSelectedEvenementForListe(null);
  }, []);

  const handleGenerateListe = useCallback(async () => {
    if (!selectedEvenementForListe) return;
    setIsGeneratingList(true);
    try {
      await apiService.post(API_ENDPOINTS.GENERER_LISTE(selectedEvenementForListe.id), {
        criteres_eligibilite: {}, // TODO: Allow user to specify criteria
      });
      toast.success('Demande de génération de liste envoyée.');
      handleCloseListeDialog();
    } catch (err: any) {
      console.error('Erreur génération liste:', err);
      toast.error('Échec génération liste: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingList(false);
    }
  }, [selectedEvenementForListe, handleCloseListeDialog]);

  // --- Tab Change ---
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // --- Memoized Table Rows ---
  const evenementRows = useMemo(() => 
    evenements.map((evt) => (
      <TableRow hover key={evt.id}>
        <TableCell>{evt.nom_programme || programmes.find(p => p.id === evt.programme_id)?.nom || 'N/A'}</TableCell>
        <TableCell>{evt.nom_site || sites.find(s => s.id === evt.site_id)?.nom || 'N/A'}</TableCell>
        <TableCell>{evt.titre}</TableCell>
        <TableCell>{formatDateForDisplay(evt.date_distribution_prevue)}</TableCell>
        <TableCell>
          {evt.heure_debut_prevue && evt.heure_fin_prevue
            ? `${formatTimeForDisplay(evt.heure_debut_prevue)} - ${formatTimeForDisplay(evt.heure_fin_prevue)}`
            : 'N/A'}
        </TableCell>
        <TableCell>{evt.type_assistance_prevue}</TableCell>
        <TableCell>
          <Chip
            label={evt.statut_evenement}
            color={CHIP_COLORS[evt.statut_evenement] || 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Tooltip title="Modifier">
            <IconButton onClick={() => handleOpenEventDialog(evt)} color="primary" size="small" aria-label={`Modifier ${evt.titre}`}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton onClick={() => handleOpenDeleteConfirmDialog(evt.id)} color="error" size="small" aria-label={`Supprimer ${evt.titre}`}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Générer liste bénéficiaires">
            <IconButton onClick={() => handleOpenListeDialog(evt)} color="success" size="small" aria-label={`Générer liste pour ${evt.titre}`}>
              <PeopleIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    )), 
  [evenements, programmes, sites, handleOpenEventDialog, handleOpenDeleteConfirmDialog, handleOpenListeDialog]);


  return (
    <PageTransition>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}> {/* Responsive padding */}
        <Typography variant="h4" component="h1" gutterBottom>
          Calendrier de Distribution
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets du calendrier">
            <Tab label="Événements" icon={<EventIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Vue Calendrier" icon={<ListAltIcon />} iconPosition="start" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 }, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" component="h2">Liste des Événements</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => handleOpenEventDialog()}
                disabled={loadingProgrammes || loadingSites} // Disable if necessary data for form isn't loaded
              >
                Nouvel Événement
              </Button>
            </Box>

            {loadingEvenements ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            ) : evenements.length === 0 ? (
              <Alert severity="info" sx={{ my: 2 }}>Aucun événement de distribution trouvé.</Alert>
            ) : (
              <TableContainer>
                <Table stickyHeader aria-label="Tableau des événements de distribution">
                  <TableHead>
                    <TableRow>
                      <TableCell>Programme</TableCell>
                      <TableCell>Site</TableCell>
                      <TableCell>Titre Événement</TableCell>
                      <TableCell>Date Prévue</TableCell>
                      <TableCell>Horaires</TableCell>
                      <TableCell>Assistance</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evenementRows}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
            {/* TODO: Implement Calendar View (e.g., using FullCalendar or similar) */}
           <Paper elevation={3} sx={{ p: 3 }}>
             <Typography variant="h6" gutterBottom>Vue Calendrier</Typography>
             <Alert severity="info">La vue calendrier sera implémentée prochainement.</Alert>
           </Paper>
        </TabPanel>
      </Box>

      {/* Event Create/Edit Dialog */}
      <Dialog open={openEventDialog} onClose={handleCloseEventDialog} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>{editingEvenement ? "Modifier l'Événement" : "Créer un Nouvel Événement"}</DialogTitle>
        <DialogContent dividers> {/* `dividers` adds top/bottom borders */}
          <Grid container spacing={2} sx={{ pt: 1 }}> {/* Padding top for content */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!formData.programme_id && isSubmittingForm /* Basic validation feedback */}>
                <InputLabel id="programme-label">Programme *</InputLabel>
                <Select
                  labelId="programme-label"
                  name="programme_id"
                  value={formData.programme_id}
                  onChange={handleFormSelectChange}
                  label="Programme *"
                  disabled={loadingProgrammes}
                >
                  {programmes.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!formData.site_id && isSubmittingForm}>
                <InputLabel id="site-label">Site de distribution *</InputLabel>
                <Select
                  labelId="site-label"
                  name="site_id"
                  value={formData.site_id}
                  onChange={handleFormSelectChange}
                  label="Site de distribution *"
                  disabled={loadingSites}
                >
                  {sites.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    name="nom_evenement"
                    label="Nom de l'événement *"
                    value={formData.nom_evenement}
                    onChange={handleFormInputChange}
                    fullWidth
                    required
                    error={!formData.nom_evenement && isSubmittingForm}
                />
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de distribution *"
                  value={formData.date_distribution_prevue}
                  onChange={handleFormDateChange}
                  slotProps={{ textField: { fullWidth: true, required: true, error: !formData.date_distribution_prevue && isSubmittingForm } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Heure de début"
                  value={formData.heure_debut_prevue}
                  onChange={(time) => handleFormTimeChange('heure_debut_prevue', time)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Heure de fin"
                  value={formData.heure_fin_prevue}
                  onChange={(time) => handleFormTimeChange('heure_fin_prevue', time)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField
                    name="responsable_evenement"
                    label="Responsable Événement"
                    value={formData.responsable_evenement}
                    onChange={handleFormInputChange}
                    fullWidth
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                    <InputLabel id="statut-label">Statut Événement *</InputLabel>
                    <Select
                        labelId="statut-label"
                        name="statut_evenement"
                        value={formData.statut_evenement}
                        onChange={handleFormSelectChange as any} // Cast if type issue with EventStatus
                        label="Statut Événement *"
                    >
                        {Object.values(EVENT_STATUSES).map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    name="type_assistance_prevue"
                    label="Type d'assistance principal *"
                    value={formData.type_assistance_prevue}
                    onChange={handleFormInputChange}
                    fullWidth
                    required
                    error={!formData.type_assistance_prevue && isSubmittingForm}
                    placeholder="Ex: Ration alimentaire générale, Kit NFI"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    name="quantite_totale_prevue_json"
                    label="Composition Quantités (JSON)"
                    value={formData.quantite_totale_prevue_json}
                    onChange={handleFormInputChange}
                    fullWidth
                    multiline
                    rows={3}
                    helperText='Ex: {"riz_kg": 50, "huile_litre": 5}'
                    placeholder='{"article_unite": quantite}'
                />
            </Grid>
            <Grid item xs={12} md={6}>
                 <TextField
                    name="details_assistance_json"
                    label="Autres Détails (JSON)"
                    value={formData.details_assistance_json}
                    onChange={handleFormInputChange}
                    fullWidth
                    multiline
                    rows={3}
                    helperText='Ex: {"couleur_bache": "bleu"}'
                    placeholder='{"cle": "valeur"}'
                />
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField
                    name="unite_mesure"
                    label="Unité de Mesure Globale (si applicable)"
                    value={formData.unite_mesure}
                    onChange={handleFormInputChange}
                    fullWidth
                    placeholder="Ex: Kits, Rations"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    name="nombre_beneficiaires_attendus"
                    label="Nb. Bénéficiaires Attendus"
                    type="number"
                    value={formData.nombre_beneficiaires_attendus}
                    onChange={handleFormInputChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    name="description_evenement"
                    label="Description / Objectifs"
                    value={formData.description_evenement}
                    onChange={handleFormInputChange}
                    fullWidth
                    multiline
                    rows={2}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    name="notes_evenement"
                    label="Notes Internes"
                    value={formData.notes_evenement}
                    onChange={handleFormInputChange}
                    fullWidth
                    multiline
                    rows={2}
                />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}> {/* Consistent padding */}
          <Button onClick={handleCloseEventDialog} color="inherit" disabled={isSubmittingForm}>
            Annuler
          </Button>
          <Button onClick={handleFormSubmit} color="primary" variant="contained" disabled={isSubmittingForm}>
            {isSubmittingForm ? <CircularProgress size={24} color="inherit" /> : (editingEvenement ? 'Mettre à Jour' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Liste Dialog */}
      <Dialog open={openListeDialog} onClose={handleCloseListeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Générer la Liste de Distribution</DialogTitle>
        <DialogContent>
          {selectedEvenementForListe && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1">Événement: {selectedEvenementForListe.titre}</Typography>
              <Typography variant="body2">Site: {selectedEvenementForListe.nom_site || sites.find(s => s.id === selectedEvenementForListe.site_id)?.nom}</Typography>
              <Typography variant="body2">Date: {formatDateForDisplay(selectedEvenementForListe.date_distribution_prevue)}</Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Confirmez-vous la génération de la liste des bénéficiaires pour cet événement ?
                Les critères d'éligibilité par défaut seront appliqués.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseListeDialog} color="inherit" disabled={isGeneratingList}>Annuler</Button>
          <Button onClick={handleGenerateListe} color="primary" variant="contained" disabled={isGeneratingList}>
            {isGeneratingList ? <CircularProgress size={24} color="inherit" /> : 'Confirmer et Générer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirmDialog} onClose={handleCloseDeleteConfirmDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la Suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirmDialog} color="inherit" disabled={isSubmittingForm}>Annuler</Button>
          <Button onClick={confirmDeleteEvenement} color="error" variant="contained" disabled={isSubmittingForm}>
            {isSubmittingForm ? <CircularProgress size={24} color="inherit" /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageTransition>
  );
};

// TabPanel and a11yProps need to be defined as they were in your original code
// For brevity, I'm assuming they are correctly defined elsewhere or can be copied from your snippet.
// Example:
// function TabPanel(props: TabPanelProps) { ... }
// function a11yProps(index: number) { ... }

export default CalendrierDistribution;