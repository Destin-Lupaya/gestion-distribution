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
  TableSortLabel
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

// Interface pour les données POS
interface POSData {
  id?: number;
  terminal: string;
  menage: number;
  beneficial: number;
  farine: number;
  haricot: number;
  huile: number;
  sel: number;
  total: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

// Valeurs initiales pour un nouvel élément
const initialPOSData: POSData = {
  terminal: '',
  menage: 0,
  beneficial: 0,
  farine: 0,
  haricot: 0,
  huile: 0,
  sel: 0,
  total: 0,
  date: dayjs().format('YYYY-MM-DD')
};

// Type pour l'ordre de tri
type Order = 'asc' | 'desc';

// Interface pour l'en-tête de colonne triable
interface HeadCell {
  id: keyof POSData;
  label: string;
  numeric: boolean;
}

// Définition des en-têtes de colonnes
const headCells: HeadCell[] = [
  { id: 'terminal', label: 'Terminal', numeric: false },
  { id: 'menage', label: 'Ménage', numeric: true },
  { id: 'beneficial', label: 'Bénéficial', numeric: true },
  { id: 'farine', label: 'Farine', numeric: true },
  { id: 'haricot', label: 'Haricot', numeric: true },
  { id: 'huile', label: 'Huile', numeric: true },
  { id: 'sel', label: 'Sel', numeric: true },
  { id: 'total', label: 'Total', numeric: true },
  { id: 'date', label: 'Date', numeric: false }
];

const MPOS = () => {
  // Styles personnalisés pour le composant
  const styles = {
    container: {
      maxWidth: '1400px',
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
      fontWeight: 700,
      color: '#1a365d',
      fontSize: '1.75rem',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#4a5568',
      marginTop: '8px',
      fontSize: '1rem'
    },
    paper: {
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginBottom: '24px',
      overflow: 'hidden'
    },
    searchBar: {
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
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '8px 16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    primaryButton: {
      background: 'linear-gradient(45deg, #1976d2, #2196f3)',
      '&:hover': {
        background: 'linear-gradient(45deg, #1565c0, #1976d2)'
      }
    },
    tableHeader: {
      fontWeight: 700,
      color: '#1e293b',
      backgroundColor: '#f8fafc'
    },
    tableRow: {
      '&:nth-of-type(odd)': {
        backgroundColor: '#fafafa',
      },
      '&:hover': {
        backgroundColor: '#f0f7ff',
      }
    },
    formField: {
      marginBottom: '16px'
    },
    dialogTitle: {
      backgroundColor: '#f0f7ff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 24px'
    },
    errorMessage: {
      color: '#e53e3e',
      marginTop: '8px',
      fontSize: '0.875rem'
    }
  };

  const [posData, setPosData] = useState<POSData[]>([]);
  const [currentItem, setCurrentItem] = useState<POSData>(initialPOSData);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof POSData>('date');

  // Charger les données au démarrage
  useEffect(() => {
    fetchPOSData();
  }, []);

  // Récupérer les données POS
  const fetchPOSData = async () => {
    setLoading(true);
    try {
      // Essayer d'abord avec l'URL utilisant un underscore (correspondant à la table pos_data)
      console.log('Tentative de récupération des données POS...');
      const response = await apiService.get('/api/pos_data');
      
      // Vérifier si la réponse contient directement un tableau ou une propriété data
      let dataArray = Array.isArray(response) ? response : 
                      (response.data ? response.data : []);
      
      console.log('Données POS reçues brutes:', dataArray);
      
      // Normaliser les données pour s'assurer que tous les champs numériques sont bien des nombres
      dataArray = dataArray.map((item: any) => ({
        ...item,
        id: item.id ? Number(item.id) : undefined,
        menage: typeof item.menage === 'number' ? item.menage : Number(item.menage) || 0,
        beneficial: typeof item.beneficial === 'number' ? item.beneficial : Number(item.beneficial) || 0,
        farine: typeof item.farine === 'number' ? item.farine : Number(item.farine) || 0,
        haricot: typeof item.haricot === 'number' ? item.haricot : Number(item.haricot) || 0,
        huile: typeof item.huile === 'number' ? item.huile : Number(item.huile) || 0,
        sel: typeof item.sel === 'number' ? item.sel : Number(item.sel) || 0,
        total: typeof item.total === 'number' ? item.total : Number(item.total) || 0
      }));
      
      console.log('Données POS normalisées:', dataArray);
      setPosData(dataArray);
      
      if (dataArray.length === 0) {
        console.warn('Aucune donnée POS n\'a été trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données POS:', error);
      
      // Essayer avec l'URL alternative si la première tentative échoue
      try {
        console.log('Tentative avec URL alternative...');
        const altResponse = await apiService.get('/api/pos-data');
        
        let dataArray = Array.isArray(altResponse) ? altResponse : 
                        (altResponse.data ? altResponse.data : []);
        
        // Normaliser les données pour s'assurer que tous les champs numériques sont bien des nombres
        dataArray = dataArray.map((item: any) => ({
          ...item,
          id: item.id ? Number(item.id) : undefined,
          menage: typeof item.menage === 'number' ? item.menage : Number(item.menage) || 0,
          beneficial: typeof item.beneficial === 'number' ? item.beneficial : Number(item.beneficial) || 0,
          farine: typeof item.farine === 'number' ? item.farine : Number(item.farine) || 0,
          haricot: typeof item.haricot === 'number' ? item.haricot : Number(item.haricot) || 0,
          huile: typeof item.huile === 'number' ? item.huile : Number(item.huile) || 0,
          sel: typeof item.sel === 'number' ? item.sel : Number(item.sel) || 0,
          total: typeof item.total === 'number' ? item.total : Number(item.total) || 0
        }));
        
        console.log('Données POS reçues (URL alternative) normalisées:', dataArray);
        setPosData(dataArray);
      } catch (secondError) {
        console.error('Erreur lors de la seconde tentative:', secondError);
        setSnackbar({
          open: true,
          message: 'Impossible de charger les données POS. Vérifiez la connexion au serveur.',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement d'ordre de tri
  const handleRequestSort = (property: keyof POSData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Fonction de tri
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator<Key extends keyof POSData>(
    order: Order,
    orderBy: Key,
  ): (a: POSData, b: POSData) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Filtrer et trier les éléments
  const filteredItems = posData && posData.length > 0
    ? posData
        .filter(item => {
          if (!item || typeof item !== 'object') return false;
          
          const searchLower = searchTerm.toLowerCase();
          return (
            item.terminal && typeof item.terminal === 'string' && item.terminal.toLowerCase().includes(searchLower) ||
            item.date && typeof item.date === 'string' && item.date.toLowerCase().includes(searchLower)
          );
        })
        .sort(getComparator(order, orderBy))
    : [];
    
  // Calculer les totaux généraux
  const grandTotals = {
    menage: filteredItems.reduce((sum, item) => sum + (Number(item.menage) || 0), 0),
    beneficial: filteredItems.reduce((sum, item) => sum + (Number(item.beneficial) || 0), 0),
    farine: filteredItems.reduce((sum, item) => sum + (Number(item.farine) || 0), 0),
    haricot: filteredItems.reduce((sum, item) => sum + (Number(item.haricot) || 0), 0),
    huile: filteredItems.reduce((sum, item) => sum + (Number(item.huile) || 0), 0),
    sel: filteredItems.reduce((sum, item) => sum + (Number(item.sel) || 0), 0),
    total: filteredItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  };
  
  // Conversion en tonnes (diviser par 1000)
  const grandTotalsInTons = {
    farine: grandTotals.farine / 1000,
    haricot: grandTotals.haricot / 1000,
    huile: grandTotals.huile / 1000,
    sel: grandTotals.sel / 1000,
    total: grandTotals.total / 1000
  };

  // Gérer l'ouverture du dialogue pour ajouter un nouvel élément
  const handleAddNew = () => {
    setCurrentItem(initialPOSData);
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Gérer l'ouverture du dialogue pour éditer un élément existant
  const handleEdit = (item: POSData) => {
    setCurrentItem(item);
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Gérer la suppression d'un élément
  const handleDelete = async (id?: number) => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      try {
        // Essayer d'abord avec l'URL utilisant un underscore
        await apiService.delete(`/api/pos_data/${id}`);
      } catch (deleteError) {
        console.error('Erreur avec la première URL, tentative avec URL alternative:', deleteError);
        // Essayer avec l'URL alternative
        await apiService.delete(`/api/pos-data/${id}`);
      }
      
      // Mettre à jour les données locales
      setPosData(posData.filter(item => item.id !== id));
      
      setSnackbar({
        open: true,
        message: 'Élément supprimé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convertir en nombre pour les champs numériques
    const numericFields = ['menage', 'beneficial', 'farine', 'haricot', 'huile', 'sel'];
    const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
    
    setCurrentItem(prev => {
      const updatedItem = {
        ...prev,
        [name]: newValue
      };
      
      // Calculer le total automatiquement
      if (numericFields.includes(name)) {
        updatedItem.total = 
          updatedItem.farine + 
          updatedItem.haricot + 
          updatedItem.huile + 
          updatedItem.sel;
      }
      
      return updatedItem;
    });
  };

  // Gérer le changement de date
  const handleDateChange = (newDate: any) => {
    setCurrentItem({
      ...currentItem,
      date: newDate ? dayjs(newDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation des champs requis
    if (!currentItem.terminal || !currentItem.date) {
      setSnackbar({
        open: true,
        message: 'Veuillez remplir tous les champs obligatoires',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Préparer les données à envoyer
      const dataToSend = {
        ...currentItem,
        // S'assurer que les valeurs numériques sont bien des nombres
        menage: Number(currentItem.menage),
        beneficial: Number(currentItem.beneficial),
        farine: Number(currentItem.farine),
        haricot: Number(currentItem.haricot),
        huile: Number(currentItem.huile),
        sel: Number(currentItem.sel),
        total: Number(currentItem.total)
      };
      
      if (isEditing && currentItem.id) {
        // Mise à jour d'un élément existant
        console.log(`Mise à jour de l'élément avec ID: ${currentItem.id}`);
        
        try {
          // Essayer d'abord avec l'URL utilisant un underscore
          const response = await apiService.put(`/api/pos_data/${currentItem.id}`, dataToSend);
          const updatedItem = response.data || response;
          setPosData(prevData => prevData.map(item => item.id === currentItem.id ? updatedItem : item));
        } catch (putError) {
          console.error('Erreur avec la première URL, tentative avec URL alternative:', putError);
          // Essayer avec l'URL alternative
          const altResponse = await apiService.put(`/api/pos-data/${currentItem.id}`, dataToSend);
          const updatedItem = altResponse.data || altResponse;
          setPosData(prevData => prevData.map(item => item.id === currentItem.id ? updatedItem : item));
        }
        
        setSnackbar({
          open: true,
          message: 'Élément mis à jour avec succès',
          severity: 'success'
        });
      } else {
        // Ajout d'un nouvel élément
        console.log('Ajout d\'un nouvel élément POS');
        
        try {
          // Essayer d'abord avec l'URL utilisant un underscore
          const response = await apiService.post('/api/pos_data', dataToSend);
          const newItem = response.data || response;
          setPosData(prevData => [...prevData, newItem]);
        } catch (postError) {
          console.error('Erreur avec la première URL, tentative avec URL alternative:', postError);
          // Essayer avec l'URL alternative
          const altResponse = await apiService.post('/api/pos-data', dataToSend);
          const newItem = altResponse.data || altResponse;
          setPosData(prevData => [...prevData, newItem]);
        }
        
        setSnackbar({
          open: true,
          message: 'Nouvel élément ajouté avec succès',
          severity: 'success'
        });
      }
      
      // Fermer le dialogue et réinitialiser le formulaire
      setOpenDialog(false);
      setCurrentItem(initialPOSData);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        <Paper elevation={3} sx={styles.container}>
          <Box sx={styles.header}>
            <Typography variant="h4" sx={styles.title}>
              Gestion des données MPOS
            </Typography>
            <Typography variant="body1" sx={styles.subtitle}>
              Suivez et gérez les données des points de service mobiles
            </Typography>
          </Box>

          {/* Barre de recherche et bouton d'ajout */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: '60%' } }}>
              <TextField
                label="Rechercher un terminal ou une date"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={styles.searchBar}
                InputProps={{
                  endAdornment: <SearchIcon sx={{ color: '#64748b' }} />
                }}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{ 
                ...styles.button,
                ...styles.primaryButton,
                minWidth: '180px'
              }}
            >
              Ajouter une entrée
            </Button>
          </Box>

          {/* Tableau des données */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#003C5F' }}>
                Liste des données MPOS
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {filteredItems.length} entrées trouvées
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: '600px' }}>
              <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={styles.tableHeader}>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{ fontWeight: 700, color: '#1e293b' }}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">Chargement...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">Aucune donnée disponible</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} sx={styles.tableRow}>
                    <TableCell>{item.terminal}</TableCell>
                    <TableCell align="right">{item.menage}</TableCell>
                    <TableCell align="right">{item.beneficial}</TableCell>
                    <TableCell align="right">{item.farine}</TableCell>
                    <TableCell align="right">{item.haricot}</TableCell>
                    <TableCell align="right">{item.huile}</TableCell>
                    <TableCell align="right">{item.sel}</TableCell>
                    <TableCell align="right">{typeof item.total === 'number' ? item.total.toFixed(2) : (Number(item.total) ? Number(item.total).toFixed(2) : '0.00')}</TableCell>
                    <TableCell>{item.date}</TableCell>
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
                {/* Ligne de total général */}
                {filteredItems.length > 0 && (
                  <>
                    <TableRow sx={{ backgroundColor: '#f0f7ff', fontWeight: 'bold' }}>
                      <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.menage}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.beneficial}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.farine.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.haricot.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.huile.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.sel.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotals.total.toFixed(2)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: '#e6f7ff' }}>
                      <TableCell sx={{ fontWeight: 700 }}>TOTAL (tonnes)</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotalsInTons.farine.toFixed(3)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotalsInTons.haricot.toFixed(3)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotalsInTons.huile.toFixed(3)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotalsInTons.sel.toFixed(3)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{grandTotalsInTons.total.toFixed(3)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
              </Table>
            </TableContainer>
          </Box>

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
            <DialogTitle sx={styles.dialogTitle}>
              {isEditing ? 'Modifier les données MPOS' : 'Ajouter une nouvelle entrée MPOS'}
            </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="terminal"
                  label="Terminal"
                  fullWidth
                  value={currentItem.terminal}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  helperText="Identifiant unique du terminal MPOS"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={dayjs(currentItem.date)}
                    onChange={handleDateChange}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        variant: "outlined",
                        required: true,
                        helperText: "Date de l'enregistrement",
                        sx: styles.formField
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="menage"
                  label="Ménage"
                  type="number"
                  fullWidth
                  value={currentItem.menage}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0 }}
                  helperText="Nombre de ménages servis"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="beneficial"
                  label="Bénéficiaires"
                  type="number"
                  fullWidth
                  value={currentItem.beneficial}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0 }}
                  helperText="Nombre total de bénéficiaires"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="farine"
                  label="Farine (kg)"
                  type="number"
                  fullWidth
                  value={currentItem.farine}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Quantité de farine distribuée"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="haricot"
                  label="Haricot (kg)"
                  type="number"
                  fullWidth
                  value={currentItem.haricot}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Quantité de haricot distribuée"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="huile"
                  label="Huile (litres)"
                  type="number"
                  fullWidth
                  value={currentItem.huile}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Quantité d'huile distribuée"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sel"
                  label="Sel (kg)"
                  type="number"
                  fullWidth
                  value={currentItem.sel}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Quantité de sel distribuée"
                  sx={styles.formField}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="total"
                  label="Total (kg/litres)"
                  type="number"
                  fullWidth
                  value={currentItem.total}
                  variant="outlined"
                  InputProps={{ 
                    readOnly: true,
                    sx: { backgroundColor: '#f8fafc' }
                  }}
                  helperText="Total calculé automatiquement (somme des produits)"
                  sx={styles.formField}
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
                ...styles.button,
                ...styles.primaryButton,
                px: 3,
                py: 1
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
        </Paper>
      </Box>
    </PageTransition>
  );
};

export default MPOS;
