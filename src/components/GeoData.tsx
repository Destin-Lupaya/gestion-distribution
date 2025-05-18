import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { PageTransition } from './PageTransition';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import apiService from '../services/apiService';

// Interface pour les données géographiques
interface GeoPoint {
  id?: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: string;
  date_created: string;
  last_updated: string;
}

// Valeurs initiales pour un nouveau point
const initialGeoPoint: GeoPoint = {
  name: '',
  description: '',
  latitude: 0,
  longitude: 0,
  type: 'Distribution Point',
  date_created: dayjs().format('YYYY-MM-DD'),
  last_updated: dayjs().format('YYYY-MM-DD')
};

// Options pour les types de points
const typeOptions = ['Distribution Point', 'Storage Facility', 'Partner Office', 'Other'];

// Fonction pour générer l'URL de la carte OpenStreetMap
const generateMapUrl = (lat: number, lng: number, zoom: number = 6) => {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-5},${lat-5},${lng+5},${lat+5}&layer=mapnik&marker=${lat},${lng}`;
};

const GeoData: React.FC = () => {
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);
  const [currentPoint, setCurrentPoint] = useState<GeoPoint>(initialGeoPoint);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Charger les données au démarrage
  useEffect(() => {
    fetchGeoPoints();
    // Essayer d'obtenir la position de l'utilisateur
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        console.error('Erreur lors de la récupération de la position:', error);
        // Position par défaut (centre de la RDC)
        setMapCenter([-4.038333, 21.758664]);
      }
    );
  }, []);

  // Récupérer les données géographiques
  const fetchGeoPoints = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/geo-points');
      setGeoPoints(response);
      
      // Si des points existent, centrer la carte sur le premier point
      if (response.length > 0) {
        setMapCenter([response[0].latitude, response[0].longitude]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données géographiques:', error);
      setSnackbar({
        open: true,
        message: 'Impossible de charger les données géographiques',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les points selon le terme de recherche
  const filteredPoints = geoPoints.filter(point => {
    const searchLower = searchTerm.toLowerCase();
    return (
      point.name.toLowerCase().includes(searchLower) ||
      point.description.toLowerCase().includes(searchLower) ||
      point.type.toLowerCase().includes(searchLower)
    );
  });

  // Gérer l'ouverture du dialogue pour ajouter un nouveau point
  const handleAddNew = () => {
    setCurrentPoint(initialGeoPoint);
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Gérer l'ouverture du dialogue pour éditer un point existant
  const handleEdit = (point: GeoPoint) => {
    setCurrentPoint(point);
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Gérer la suppression d'un point
  const handleDelete = async (id?: number) => {
    if (!id) return;
    
    try {
      await apiService.delete(`/api/geo-points/${id}`);
      setGeoPoints(geoPoints.filter(point => point.id !== id));
      setSnackbar({
        open: true,
        message: 'Point supprimé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression du point',
        severity: 'error'
      });
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPoint({
      ...currentPoint,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) || 0 : value
    });
  };

  // Gérer les changements dans les sélecteurs
  const handleTypeChange = (e: any) => {
    setCurrentPoint({
      ...currentPoint,
      type: e.target.value as string
    });
  };

  // Gérer le changement de date
  const handleDateChange = (field: string) => (newDate: any) => {
    setCurrentPoint({
      ...currentPoint,
      [field]: newDate ? dayjs(newDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    });
  };

  // Utiliser la position actuelle
  const useCurrentLocation = () => {
    if (userLocation) {
      setCurrentPoint({
        ...currentPoint,
        latitude: userLocation[0],
        longitude: userLocation[1]
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Impossible d\'obtenir votre position actuelle',
        severity: 'error'
      });
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    try {
      if (isEditing && currentPoint.id) {
        await apiService.put(`/api/geo-points/${currentPoint.id}`, {
          ...currentPoint,
          last_updated: dayjs().format('YYYY-MM-DD')
        });
        setGeoPoints(geoPoints.map(point => point.id === currentPoint.id ? {
          ...currentPoint,
          last_updated: dayjs().format('YYYY-MM-DD')
        } : point));
        setSnackbar({
          open: true,
          message: 'Point mis à jour avec succès',
          severity: 'success'
        });
      } else {
        const response = await apiService.post('/api/geo-points', {
          ...currentPoint,
          date_created: dayjs().format('YYYY-MM-DD'),
          last_updated: dayjs().format('YYYY-MM-DD')
        });
        setGeoPoints([...geoPoints, response]);
        setSnackbar({
          open: true,
          message: 'Nouveau point ajouté avec succès',
          severity: 'success'
        });
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement des données',
        severity: 'error'
      });
    }
  };

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Données Géographiques
        </Typography>

        {/* Barre de recherche et bouton d'ajout */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '60%' }}>
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>
              }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Ajouter un point
          </Button>
        </Box>

        {/* Carte */}
        <Paper elevation={3} sx={{ mb: 4, height: '400px', width: '100%', overflow: 'hidden' }}>
          {mapCenter[0] !== 0 && (
            <iframe
              title="OpenStreetMap"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={generateMapUrl(mapCenter[0], mapCenter[1])}
              style={{ border: 0 }}
            />
          )}
        </Paper>

        {/* Tableau des données */}
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Latitude</TableCell>
                <TableCell>Longitude</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Dernière mise à jour</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Chargement...</TableCell>
                </TableRow>
              ) : filteredPoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Aucune donnée disponible</TableCell>
                </TableRow>
              ) : (
                filteredPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>{point.name}</TableCell>
                    <TableCell>{point.description}</TableCell>
                    <TableCell>{point.type}</TableCell>
                    <TableCell>{point.latitude.toFixed(6)}</TableCell>
                    <TableCell>{point.longitude.toFixed(6)}</TableCell>
                    <TableCell>{point.date_created}</TableCell>
                    <TableCell>{point.last_updated}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(point)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(point.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialogue pour ajouter/modifier un point */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{isEditing ? 'Modifier le point' : 'Ajouter un nouveau point'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Nom"
                  fullWidth
                  value={currentPoint.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="type-label">Type</InputLabel>
                  <Select
                    labelId="type-label"
                    name="type"
                    value={currentPoint.type}
                    onChange={handleTypeChange}
                    label="Type"
                  >
                    {typeOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentPoint.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="latitude"
                  label="Latitude"
                  fullWidth
                  type="number"
                  inputProps={{ step: 0.000001 }}
                  value={currentPoint.latitude}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="longitude"
                  label="Longitude"
                  fullWidth
                  type="number"
                  inputProps={{ step: 0.000001 }}
                  value={currentPoint.longitude}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date de création"
                    value={dayjs(currentPoint.date_created)}
                    onChange={handleDateChange('date_created')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Dernière mise à jour"
                    value={dayjs(currentPoint.last_updated)}
                    onChange={handleDateChange('last_updated')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<MyLocationIcon />}
                  onClick={useCurrentLocation}
                  sx={{ mt: 1 }}
                >
                  Utiliser ma position actuelle
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {isEditing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageTransition>
  );
};

export default GeoData;
