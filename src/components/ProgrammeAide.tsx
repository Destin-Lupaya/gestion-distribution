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
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

interface Programme {
  programme_id: string;
  nom_programme: string;
  organisation_responsable: string;
  date_debut: string;
  date_fin: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProgrammeFormData {
  nom_programme: string;
  organisation_responsable: string;
  date_debut: Dayjs | null;
  date_fin: Dayjs | null;
  description: string;
}

const ProgrammeAide: React.FC = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [formData, setFormData] = useState<ProgrammeFormData>({
    nom_programme: '',
    organisation_responsable: '',
    date_debut: null,
    date_fin: null,
    description: ''
  });

  // Charger les programmes au chargement du composant
  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/programmes');
      // Vérification que response.data est un tableau
      if (Array.isArray(response.data)) {
        setProgrammes(response.data);
      } else {
        // Si ce n'est pas un tableau, initialiser avec un tableau vide
        console.warn('Les données reçues ne sont pas un tableau:', response.data);
        setProgrammes([]);
      }
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des programmes:', err);
      setError('Impossible de charger les programmes. Veuillez réessayer plus tard.');
      toast.error('Erreur lors du chargement des programmes');
      // Initialiser avec un tableau vide en cas d'erreur
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (programme?: Programme) => {
    if (programme) {
      setEditingProgramme(programme);
      setFormData({
        nom_programme: programme.nom_programme,
        organisation_responsable: programme.organisation_responsable,
        date_debut: dayjs(programme.date_debut),
        date_fin: dayjs(programme.date_fin),
        description: programme.description
      });
    } else {
      setEditingProgramme(null);
      setFormData({
        nom_programme: '',
        organisation_responsable: '',
        date_debut: null,
        date_fin: null,
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (field: 'date_debut' | 'date_fin', value: Dayjs | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrganisationChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      organisation_responsable: e.target.value
    }));
  };

  const handleSubmit = async () => {
    // Validation des champs requis
    if (!formData.nom_programme || !formData.organisation_responsable || !formData.date_debut || !formData.date_fin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation de la logique des dates
    if (formData.date_debut && formData.date_fin && formData.date_debut.isAfter(formData.date_fin)) {
      toast.error('La date de début doit être antérieure à la date de fin');
      return;
    }

    try {
      const programmeData = {
        ...formData,
        date_debut: formData.date_debut?.format('YYYY-MM-DD'),
        date_fin: formData.date_fin?.format('YYYY-MM-DD')
      };

      if (editingProgramme) {
        // Mise à jour d'un programme existant
        await apiService.put(`/api/programmes/${editingProgramme.programme_id}`, programmeData);
        toast.success('Programme mis à jour avec succès');
      } else {
        // Création d'un nouveau programme
        await apiService.post('/api/programmes', programmeData);
        toast.success('Programme créé avec succès');
      }

      // Fermer le dialogue et rafraîchir la liste
      handleCloseDialog();
      fetchProgrammes();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du programme:', err);
      toast.error('Erreur lors de l\'enregistrement du programme');
    }
  };

  const handleDeleteProgramme = async (programmeId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      try {
        await apiService.delete(`/api/programmes/${programmeId}`);
        toast.success('Programme supprimé avec succès');
        fetchProgrammes();
      } catch (err) {
        console.error('Erreur lors de la suppression du programme:', err);
        toast.error('Erreur lors de la suppression du programme');
      }
    }
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#003C5F', fontWeight: 700, mb: 3 }}>
          Gestion des Programmes d'Aide
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#003C5F', fontWeight: 600 }}>Liste des programmes</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircleOutlineIcon />} 
              onClick={() => handleOpenDialog()}
              sx={{ 
                background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
                boxShadow: '0 3px 5px 2px rgba(0, 120, 190, .3)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Nouveau Programme
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress sx={{ color: '#0078BE' }} />
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '& .MuiAlert-icon': {
                  color: '#D32F2F'
                }
              }}
              variant="filled"
            >
              {error}
            </Alert>
          ) : programmes && programmes.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: '8px',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                '& .MuiAlert-icon': {
                  color: '#0284c7'
                }
              }}
              variant="outlined"
            >
              Aucun programme d'aide n'a été créé.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Nom du Programme</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Organisation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date de début</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date de fin</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programmes.map((programme) => (
                    <TableRow key={programme.programme_id}>
                      <TableCell sx={{ fontWeight: 700 }}>{programme.nom_programme}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{programme.organisation_responsable}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{new Date(programme.date_debut).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{new Date(programme.date_fin).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{programme.description}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <IconButton 
                          onClick={() => handleOpenDialog(programme)} 
                          color="primary"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(0, 120, 190, 0.1)' 
                            } 
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteProgramme(programme.programme_id)} 
                          color="error"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(211, 47, 47, 0.1)' 
                            } 
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Dialogue pour créer/éditer un programme */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            padding: '8px'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: '1.5rem', 
          fontWeight: 600, 
          color: '#003C5F',
          borderBottom: '1px solid #eaeaea',
          pb: 2
        }}>
          {editingProgramme ? 'Modifier le programme' : 'Créer un nouveau programme'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="nom_programme"
                label="Nom du programme"
                value={formData.nom_programme}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="organisation-label">Organisation responsable</InputLabel>
                <Select
                  labelId="organisation-label"
                  value={formData.organisation_responsable}
                  onChange={handleOrganisationChange}
                  label="Organisation responsable"
                >
                  <MenuItem value="World Vision">World Vision</MenuItem>
                  <MenuItem value="PAM">PAM</MenuItem>
                  <MenuItem value="Partenaire Local">Partenaire Local</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de début"
                  value={formData.date_debut}
                  onChange={(date) => handleDateChange('date_debut', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de fin"
                  value={formData.date_fin}
                  onChange={(date) => handleDateChange('date_fin', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #eaeaea' }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
              boxShadow: '0 3px 5px 2px rgba(0, 120, 190, .3)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {editingProgramme ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageTransition>
  );
};

export default ProgrammeAide;
