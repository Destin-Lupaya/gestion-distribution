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
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { Link } from 'react-router-dom';
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
      // Utiliser la route correcte pour les waybills
      const response = await apiService.get('/api/waybills/report', {
        startDate: new Date().toISOString().split('T')[0], // Date du jour
        endDate: new Date().toISOString().split('T')[0],   // Date du jour
        limit: '100' // Récupérer jusqu'à 100 éléments
      });
      
      // Vérifier si la réponse est valide et contient des données
      if (response && response.data) {
        // S'assurer que response.data est un tableau
        setWaybillItems(Array.isArray(response.data) ? response.data : []);
      } else {
        // Si la réponse n'a pas le format attendu
        console.error('Format de réponse invalide:', response);
        setWaybillItems([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du waybill:', error);
      setSnackbar({
        open: true,
        message: 'Impossible de charger les données du waybill',
        severity: 'error'
      });
      // Réinitialiser à un tableau vide en cas d'erreur
      setWaybillItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les éléments selon le terme de recherche
  const filteredItems = Array.isArray(waybillItems) ? waybillItems.filter(item => {
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
      // S'assurer que waybillItems est un tableau avant de le filtrer
      if (Array.isArray(waybillItems)) {
        setWaybillItems(waybillItems.filter(item => item.id !== id));
      }
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
    
    // Déterminer si le champ est numérique
    const isNumericField = name.includes('quantity') || name.includes('tonne') || 
                          name.includes('loss') || name.includes('mount') || 
                          name.includes('return');
    
    // Mettre à jour l'élément courant
    setCurrentItem({
      ...currentItem,
      [name]: isNumericField ? parseFloat(value) || 0 : value
    });
    
    // Si c'est le champ commodity_specific, on peut automatiquement déterminer le type
    if (name === 'commodity_specific' && value) {
      const valueLower = value.toLowerCase();
      let type = currentItem.type;
      
      // Déterminer automatiquement le type en fonction du produit
      if (valueLower.includes('huile') || valueLower.includes('farine') || 
          valueLower.includes('haricot') || valueLower.includes('sel')) {
        type = 'Food';
      }
      
      // Mettre à jour le type si nécessaire
      if (type !== currentItem.type) {
        setCurrentItem(prev => ({ ...prev, type }));
      }
    }
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
      let tonneSent = 0;
      // Calculer le tonnage envoyé en fonction de l'unité
      if (currentItem.unit_sent === 'kg') {
        tonneSent = (currentItem.quantity_sent || 0) / 1000;
      } else {
        // Déterminer le poids unitaire pour le calcul du tonnage envoyé
        const commodityLower = (currentItem.commodity_specific || '').toLowerCase();
        let poidsUnitaire = 0;
        
        if (commodityLower.includes('huile')) {
          poidsUnitaire = 20; // 20kg par carton d'huile
        } else if (commodityLower.includes('farine')) {
          poidsUnitaire = 25; // 25kg par sac de farine
        } else if (commodityLower.includes('haricot')) {
          poidsUnitaire = 50; // 50kg par sac de haricot
        } else if (commodityLower.includes('sel')) {
          poidsUnitaire = 25; // 25kg par sac de sel
        } else {
          poidsUnitaire = 1; // Valeur par défaut
        }
        
        tonneSent = ((currentItem.quantity_sent || 0) * poidsUnitaire) / 1000;
      }
      setCurrentItem(prev => ({ ...prev, tonne_sent: tonneSent }));
    }
    
    if (currentItem.quantity && currentItem.quantity > 0) {
      // Déterminer le poids unitaire en fonction du type de produit
      let poidsUnitaire = 0;
      const commodityLower = (currentItem.commodity_specific || '').toLowerCase();
      
      if (commodityLower.includes('huile')) {
        // Poids d'un carton d'huile (en kg)
        poidsUnitaire = 20; // 20kg par carton d'huile
      } else if (commodityLower.includes('farine')) {
        // Poids d'un sac de farine (en kg)
        poidsUnitaire = 25; // 25kg par sac de farine
      } else if (commodityLower.includes('haricot')) {
        // Poids d'un sac de haricot (en kg)
        poidsUnitaire = 50; // 50kg par sac de haricot
      } else if (commodityLower.includes('sel')) {
        // Poids d'un sac de sel (en kg)
        poidsUnitaire = 25; // 25kg par sac de sel
      } else if (currentItem.unit_received === 'kg') {
        // Pour les autres produits en kg, utiliser la conversion standard
        poidsUnitaire = 1;
      } else {
        // Pour les autres unités, déterminer selon le cas
        poidsUnitaire = 0;
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
        // S'assurer que waybillItems est un tableau avant d'utiliser map
        if (Array.isArray(waybillItems)) {
          setWaybillItems(waybillItems.map(item => item.id === currentItem.id ? currentItem : item));
        }
        setSnackbar({
          open: true,
          message: 'Élément mis à jour avec succès',
          severity: 'success'
        });
      } else {
        const response = await apiService.post('/api/waybill-items', currentItem);
        // S'assurer que waybillItems est un tableau avant d'utiliser le spread operator
        setWaybillItems(Array.isArray(waybillItems) ? [...waybillItems, response.data] : [response.data]);
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
      <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
        <Typography 
          variant="h4" 
          className="section-header"
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            color: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Réception des Waybills</span>
        </Typography>

        {/* Barre de recherche et bouton d'ajout */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: '12px',
            backgroundColor: '#ffffff'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#003C5F' }}>
              Gestion des Waybills
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Recherche des bénéficiaires">
                <Button
                  component={Link}
                  to="/recherche-beneficiaires"
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonSearchIcon />}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderColor: '#0078BE',
                    color: '#0078BE',
                    '&:hover': {
                      borderColor: '#0091E6',
                      backgroundColor: 'rgba(0, 120, 190, 0.08)'
                    }
                  }}
                >
                  Rechercher bénéficiaires
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
                  boxShadow: '0 2px 8px rgba(0, 120, 190, 0.3)'
                }}
              >
                Ajouter un waybill
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 3 }}>
            <TextField
              label="Rechercher un waybill"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': {
                    borderColor: '#94a3b8',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0078BE',
                  }
                }
              }}
              InputProps={{
                endAdornment: <SearchIcon sx={{ color: '#64748b' }} />
              }}
            />
          </Box>
        </Paper>

        {/* Tableau des données */}
        <Paper 
          elevation={2}
          sx={{ 
            mb: 4, 
            overflowX: 'auto',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#003C5F' }}>
              Liste des Waybills
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {filteredItems.length} waybills trouvés
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: '600px' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Waybill #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Batch #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Commodity</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Qty Sent</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Tonne Sent</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Qty Received</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Tonne Received</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Poids Unitaire (kg)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Obs</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Loss</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Mount In</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>Return</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Activity</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                      <CircularProgress size={40} sx={{ mb: 2, color: '#0078BE' }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>Chargement des données...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>Aucune donnée disponible</Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>Utilisez le bouton "Ajouter" pour créer un nouveau waybill</Typography>
                    </Box>
                  </TableCell>
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
                    <TableCell>
                      {(() => {
                        const commodityLower = (item.commodity_specific || '').toLowerCase();
                        if (commodityLower.includes('huile')) return '20';
                        if (commodityLower.includes('farine')) return '25';
                        if (commodityLower.includes('haricot')) return '50';
                        if (commodityLower.includes('sel')) return '25';
                        return item.unit_received === 'kg' ? '1' : '0';
                      })()}
                    </TableCell>
                    <TableCell>{item.obs}</TableCell>
                    <TableCell align="right">{item.loss}</TableCell>
                    <TableCell align="right">{item.mount_in}</TableCell>
                    <TableCell align="right">{item.return_qty}</TableCell>
                    <TableCell>{item.activity}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(item)}
                        sx={{ 
                          color: '#0078BE',
                          '&:hover': { backgroundColor: 'rgba(0, 120, 190, 0.08)' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(item.id)}
                        sx={{ 
                          color: '#ef4444',
                          '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>

        {/* Dialogue pour ajouter/modifier un élément */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            py: 2,
            '& .MuiTypography-root': {
              fontWeight: 600,
              color: '#0f172a'
            }
          }}>
            {isEditing ? 'Modifier le waybill' : 'Ajouter un nouveau waybill'}
          </DialogTitle>
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
          <DialogActions sx={{ borderTop: '1px solid #e2e8f0', py: 2, px: 3 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                color: '#64748b'
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
                boxShadow: '0 2px 8px rgba(0, 120, 190, 0.3)'
              }}
            >
              {isEditing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageTransition>
  );
};

export default ReceptionWaybill;
