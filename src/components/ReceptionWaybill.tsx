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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { PageTransition } from './PageTransition';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import apiService from '../services/apiService';

// Interface pour les données du waybill
interface WaybillItem {
  id?: number | string;
  waybill_number?: string;
  batchnumber?: string;
  batch_number?: string;
  commodity?: string;
  commodity_specific?: string;
  type?: string;
  quantity_sent?: number;
  unit_sent?: string;
  tonne_sent?: number;
  quantity?: number;
  unit?: string;
  unit_received?: string;
  tonne_received?: number;
  obs?: string;
  loss?: number;
  mount_in?: number;
  return_qty?: number;
  activity?: string;
  date?: string;
  reception_date?: string;
  location?: string;
  status?: string;
}

// Valeurs initiales pour un nouvel élément
const initialWaybillItem: WaybillItem = {
  waybill_number: '',
  batchnumber: '',
  batch_number: '',
  commodity: '',
  commodity_specific: '',
  type: 'Food',
  quantity_sent: 0,
  unit_sent: 'kg',
  tonne_sent: 0,
  quantity: 0,
  unit: 'kg',
  unit_received: 'kg',
  tonne_received: 0,
  obs: '',
  loss: 0,
  mount_in: 0,
  return_qty: 0,
  activity: '',
  date: dayjs().format('YYYY-MM-DD'),
  reception_date: dayjs().format('YYYY-MM-DD'),
  location: '',
  status: ''
};

// Options pour les unités
const unitOptions = ['kg', 'g', 'l', 'ml', 'pcs'];

// Options pour les types de commodités
const typeOptions = ['Food', 'Non-Food'];

const ReceptionWaybill: React.FC = () => {
  const [waybillItems, setWaybillItems] = useState<WaybillItem[]>([]);
  const [currentItem, setCurrentItem] = useState<WaybillItem>(initialWaybillItem);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Charger les données au démarrage
  useEffect(() => {
    fetchWaybillItems();
  }, []);

  // Récupérer les données du waybill
  const fetchWaybillItems = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/waybill-items');
      setWaybillItems(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données du waybill:', error);
      setSnackbar({
        open: true,
        message: 'Impossible de charger les données du waybill',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les éléments selon le terme de recherche
  const filteredItems = waybillItems ? waybillItems.filter(item => {
    if (!item) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.waybill_number && item.waybill_number.toLowerCase().includes(searchLower)) ||
      (item.batch_number && item.batch_number.toLowerCase().includes(searchLower)) ||
      (item.batchnumber && item.batchnumber.toLowerCase().includes(searchLower)) ||
      (item.commodity && item.commodity.toLowerCase().includes(searchLower)) ||
      (item.commodity_specific && item.commodity_specific.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower))
    );
  }) : [];

  // Gérer l'ouverture du dialogue pour ajouter un nouvel élément
  const handleAddNew = () => {
    setCurrentItem(initialWaybillItem);
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Gérer l'ouverture du dialogue pour éditer un élément existant
  const handleEdit = (item: WaybillItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Gérer la suppression d'un élément
  const handleDelete = async (id?: number | string | undefined) => {
    if (!id) return;
    
    try {
      await apiService.delete(`/api/waybill-items/${id}`);
      setWaybillItems(waybillItems.filter(item => item.id !== id));
      setSnackbar({
        open: true,
        message: 'Élément supprimé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression de l\'élément',
        severity: 'error'
      });
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: name.includes('quantity') || name.includes('tonne') || name.includes('loss') || name.includes('mount') || name.includes('return') 
        ? parseFloat(value) || 0 
        : value
    });
  };

  // Gérer les changements dans les sélecteurs
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: value
    });
  };

  // Gérer le changement de date
  const handleDateChange = (newDate: any) => {
    setCurrentItem({
      ...currentItem,
      date: newDate ? dayjs(newDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    });
  };

  // Calculer automatiquement les tonnes en fonction de la quantité et du type de produit
  useEffect(() => {
    if (currentItem.quantity_sent && currentItem.quantity_sent > 0) {
      const tonneSent = currentItem.unit_sent === 'kg' ? (currentItem.quantity_sent || 0) / 1000 : 0;
      setCurrentItem(prev => ({ ...prev, tonne_sent: tonneSent }));
    }
    
    if (currentItem.quantity && currentItem.quantity > 0) {
      // Déterminer le poids unitaire en fonction du type de produit
      let poidsUnitaire = 0;
      const commodityLower = (currentItem.commodity_specific || '').toLowerCase();
      
      if (commodityLower.includes('huile')) {
        // Poids d'un carton d'huile (en kg)
        poidsUnitaire = 20; // Exemple: 20kg par carton d'huile
      } else if (commodityLower.includes('farine')) {
        // Poids d'un sac de farine (en kg)
        poidsUnitaire = 25; // Exemple: 25kg par sac de farine
      } else if (commodityLower.includes('haricot')) {
        // Poids d'un sac de haricot (en kg)
        poidsUnitaire = 50; // Exemple: 50kg par sac de haricot
      } else {
        // Pour les autres produits, utiliser la conversion standard
        poidsUnitaire = currentItem.unit_received === 'kg' ? 1 : 0;
      }
      
      // Calculer le tonnage en fonction du poids unitaire
      const tonneReceived = ((currentItem.quantity || 0) * poidsUnitaire) / 1000;
      setCurrentItem(prev => ({ ...prev, tonne_received: tonneReceived }));
    }
  }, [currentItem.quantity_sent, currentItem.unit_sent, currentItem.quantity, currentItem.unit_received, currentItem.commodity_specific]);

  // Calculer automatiquement la perte
  useEffect(() => {
    const loss = (currentItem.quantity_sent || 0) - (currentItem.quantity || 0) - (currentItem.return_qty || 0);
    setCurrentItem(prev => ({ ...prev, loss: loss > 0 ? loss : 0 }));
  }, [currentItem.quantity_sent, currentItem.quantity, currentItem.return_qty]);

  // Soumettre le formulaire
  const handleSubmit = async () => {
    try {
      if (isEditing && currentItem.id) {
        await apiService.put(`/api/waybill-items/${currentItem.id}`, currentItem);
        setWaybillItems(waybillItems.map(item => item.id === currentItem.id ? currentItem : item));
        setSnackbar({
          open: true,
          message: 'Élément mis à jour avec succès',
          severity: 'success'
        });
      } else {
        const response = await apiService.post('/api/waybill-items', currentItem);
        setWaybillItems([...waybillItems, response.data]);
        setSnackbar({
          open: true,
          message: 'Nouvel élément ajouté avec succès',
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
          Réception des Waybills
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
                endAdornment: <SearchIcon />
              }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Ajouter
          </Button>
        </Box>

        {/* Tableau des données */}
        <TableContainer component={Paper} sx={{ mb: 4, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Waybill #</TableCell>
                <TableCell>Batch #</TableCell>
                <TableCell>Commodity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Qty Sent</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Tonne Sent</TableCell>
                <TableCell align="right">Qty Received</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Tonne Received</TableCell>
                <TableCell>Obs</TableCell>
                <TableCell align="right">Loss</TableCell>
                <TableCell align="right">Mount In</TableCell>
                <TableCell align="right">Return</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={18} align="center">Chargement...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} align="center">Aucune donnée disponible</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.waybill_number}</TableCell>
                    <TableCell>{item.batchnumber}</TableCell>
                    <TableCell>{item.commodity_specific}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell align="right">{item.quantity_sent}</TableCell>
                    <TableCell>{item.unit_sent}</TableCell>
                    <TableCell align="right">{(item.tonne_sent || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{item.quantity || 0}</TableCell>
                    <TableCell>{item.unit_received || ''}</TableCell>
                    <TableCell align="right">{(item.tonne_received || 0).toFixed(3)}</TableCell>
                    <TableCell>{item.obs}</TableCell>
                    <TableCell align="right">{item.loss}</TableCell>
                    <TableCell align="right">{item.mount_in}</TableCell>
                    <TableCell align="right">{item.return_qty}</TableCell>
                    <TableCell>{item.activity}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialogue pour ajouter/modifier un élément */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{isEditing ? 'Modifier l\'élément' : 'Ajouter un nouvel élément'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="waybill_number"
                  label="Waybill #"
                  fullWidth
                  value={currentItem.waybill_number}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="batchnumber"
                  label="Batch #"
                  fullWidth
                  value={currentItem.batchnumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="commodity_specific"
                  label="Commodity"
                  fullWidth
                  value={currentItem.commodity_specific}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={currentItem.type}
                    label="Type"
                    onChange={handleSelectChange}
                  >
                    {typeOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantity_sent"
                  label="Quantity Sent"
                  type="number"
                  fullWidth
                  value={currentItem.quantity_sent}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Unit Sent</InputLabel>
                  <Select
                    name="unit_sent"
                    value={currentItem.unit_sent}
                    label="Unit Sent"
                    onChange={handleSelectChange}
                  >
                    {unitOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="tonne_sent"
                  label="Tonne Sent"
                  type="number"
                  fullWidth
                  value={currentItem.tonne_sent}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantity"
                  label="Quantity Received"
                  type="number"
                  fullWidth
                  value={currentItem.quantity}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Unit Received</InputLabel>
                  <Select
                    name="unit_received"
                    value={currentItem.unit_received}
                    label="Unit Received"
                    onChange={handleSelectChange}
                  >
                    {unitOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="tonne_received"
                  label="Tonne Received"
                  type="number"
                  fullWidth
                  value={currentItem.tonne_received}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="obs"
                  label="Observations"
                  fullWidth
                  value={currentItem.obs}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="loss"
                  label="Loss"
                  type="number"
                  fullWidth
                  value={currentItem.loss}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="mount_in"
                  label="Mount In"
                  type="number"
                  fullWidth
                  value={currentItem.mount_in}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="return_qty"
                  label="Return"
                  type="number"
                  fullWidth
                  value={currentItem.return_qty}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="activity"
                  label="Activity"
                  fullWidth
                  value={currentItem.activity}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={dayjs(currentItem.date)}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="location"
                  label="Location"
                  fullWidth
                  value={currentItem.location}
                  onChange={handleChange}
                />
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

export default ReceptionWaybill;
