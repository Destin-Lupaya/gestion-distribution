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

const MPOS: React.FC = () => {
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
      const response = await apiService.get('/api/pos-data');
      setPosData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données POS:', error);
      setSnackbar({
        open: true,
        message: 'Impossible de charger les données POS',
        severity: 'error'
      });
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

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Filtrer et trier les éléments
  const filteredItems = posData
    .filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.terminal.toLowerCase().includes(searchLower) ||
        item.date.includes(searchLower)
      );
    })
    .sort(getComparator(order, orderBy));

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
      await apiService.delete(`/api/pos-data/${id}`);
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
        message: 'Erreur lors de la suppression de l\'élément',
        severity: 'error'
      });
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
    try {
      if (isEditing && currentItem.id) {
        await apiService.put(`/api/pos-data/${currentItem.id}`, currentItem);
        setPosData(posData.map(item => item.id === currentItem.id ? currentItem : item));
        setSnackbar({
          open: true,
          message: 'Élément mis à jour avec succès',
          severity: 'success'
        });
      } else {
        const response = await apiService.post('/api/pos-data', currentItem);
        setPosData([...posData, response.data]);
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
          Gestion des données MPOS
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
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
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
                <TableCell>Actions</TableCell>
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
                  <TableRow key={item.id}>
                    <TableCell>{item.terminal}</TableCell>
                    <TableCell align="right">{item.menage}</TableCell>
                    <TableCell align="right">{item.beneficial}</TableCell>
                    <TableCell align="right">{item.farine}</TableCell>
                    <TableCell align="right">{item.haricot}</TableCell>
                    <TableCell align="right">{item.huile}</TableCell>
                    <TableCell align="right">{item.sel}</TableCell>
                    <TableCell align="right">{item.total.toFixed(2)}</TableCell>
                    <TableCell>{item.date}</TableCell>
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
                  name="terminal"
                  label="Terminal"
                  fullWidth
                  value={currentItem.terminal}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="menage"
                  label="Ménage"
                  type="number"
                  fullWidth
                  value={currentItem.menage}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="beneficial"
                  label="Bénéficial"
                  type="number"
                  fullWidth
                  value={currentItem.beneficial}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="farine"
                  label="Farine"
                  type="number"
                  fullWidth
                  value={currentItem.farine}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="haricot"
                  label="Haricot"
                  type="number"
                  fullWidth
                  value={currentItem.haricot}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="huile"
                  label="Huile"
                  type="number"
                  fullWidth
                  value={currentItem.huile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sel"
                  label="Sel"
                  type="number"
                  fullWidth
                  value={currentItem.sel}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="total"
                  label="Total"
                  type="number"
                  fullWidth
                  value={currentItem.total}
                  InputProps={{ readOnly: true }}
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

export default MPOS;
