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
  poids_unitaire?: number; // Poids unitaire en kg pour calculer le tonnage
}

interface WaybillTotals {
  quantity_sent: number;
  tonne_sent: number;
  quantity: number;
  tonne_received: number;
  loss: number;
  mount_in: number;
  return_qty: number;
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
  poids_unitaire: 1, // Valeur par défaut pour le poids unitaire (en kg)
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
      console.log('Tentative de récupération des données waybill avec la première URL...');
      // Première tentative avec l'URL principale
      const response = await apiService.get('/api/waybill_items');
      
      // Vérifier si la réponse contient directement un tableau ou une propriété data
      let dataArray = Array.isArray(response) ? response : 
                     (response.data ? response.data : []);
      
      console.log('Données waybill reçues brutes:', dataArray);
      
      // Normaliser les données pour s'assurer que tous les champs numériques sont bien des nombres
      dataArray = dataArray.map((item: any) => ({
        ...item,
        id: item.id ? (typeof item.id === 'number' ? item.id : Number(item.id)) : undefined,
        quantity_sent: typeof item.quantity_sent === 'number' ? item.quantity_sent : Number(item.quantity_sent) || 0,
        tonne_sent: typeof item.tonne_sent === 'number' ? item.tonne_sent : Number(item.tonne_sent) || 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
        tonne_received: typeof item.tonne_received === 'number' ? item.tonne_received : Number(item.tonne_received) || 0,
        loss: typeof item.loss === 'number' ? item.loss : Number(item.loss) || 0,
        mount_in: typeof item.mount_in === 'number' ? item.mount_in : Number(item.mount_in) || 0,
        return_qty: typeof item.return_qty === 'number' ? item.return_qty : Number(item.return_qty) || 0
      }));
      
      console.log('Données waybill normalisées:', dataArray);
      setWaybillItems(dataArray);
      
      if (dataArray.length === 0) {
        console.warn('Aucune donnée waybill n\'a été trouvée avec la première URL');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données waybill avec la première URL:', error);
      
      // Essayer avec l'URL alternative si la première tentative échoue
      try {
        console.log('Tentative avec URL alternative...');
        const altResponse = await apiService.get('/api/waybill-items');
        
        let dataArray = Array.isArray(altResponse) ? altResponse : 
                       (altResponse.data ? altResponse.data : []);
        
        console.log('Données waybill reçues avec URL alternative brutes:', dataArray);
        
        // Normaliser les données
        dataArray = dataArray.map((item: any) => ({
          ...item,
          id: item.id ? (typeof item.id === 'number' ? item.id : Number(item.id)) : undefined,
          quantity_sent: typeof item.quantity_sent === 'number' ? item.quantity_sent : Number(item.quantity_sent) || 0,
          tonne_sent: typeof item.tonne_sent === 'number' ? item.tonne_sent : Number(item.tonne_sent) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
          tonne_received: typeof item.tonne_received === 'number' ? item.tonne_received : Number(item.tonne_received) || 0,
          loss: typeof item.loss === 'number' ? item.loss : Number(item.loss) || 0,
          mount_in: typeof item.mount_in === 'number' ? item.mount_in : Number(item.mount_in) || 0,
          return_qty: typeof item.return_qty === 'number' ? item.return_qty : Number(item.return_qty) || 0
        }));
        
        console.log('Données waybill reçues (URL alternative) normalisées:', dataArray);
        setWaybillItems(dataArray);
        
        if (dataArray.length === 0) {
          console.warn('Aucune donnée waybill n\'a été trouvée avec l\'URL alternative');
          
          // Essayer une troisième URL si les deux premières échouent
          try {
            console.log('Tentative avec troisième URL...');
            const thirdResponse = await apiService.get('/api/waybills/report', {
              startDate: new Date().toISOString().split('T')[0], // Date du jour
              endDate: new Date().toISOString().split('T')[0],   // Date du jour
              limit: '100' // Récupérer jusqu'à 100 éléments
            });
            
            let thirdDataArray = Array.isArray(thirdResponse) ? thirdResponse : 
                              (thirdResponse.data ? thirdResponse.data : []);
            
            console.log('Données waybill reçues avec troisième URL brutes:', thirdDataArray);
            
            // Normaliser les données
            thirdDataArray = thirdDataArray.map((item: any) => ({
              ...item,
              id: item.id ? (typeof item.id === 'number' ? item.id : Number(item.id)) : undefined,
              quantity_sent: typeof item.quantity_sent === 'number' ? item.quantity_sent : Number(item.quantity_sent) || 0,
              tonne_sent: typeof item.tonne_sent === 'number' ? item.tonne_sent : Number(item.tonne_sent) || 0,
              quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
              tonne_received: typeof item.tonne_received === 'number' ? item.tonne_received : Number(item.tonne_received) || 0,
              loss: typeof item.loss === 'number' ? item.loss : Number(item.loss) || 0,
              mount_in: typeof item.mount_in === 'number' ? item.mount_in : Number(item.mount_in) || 0,
              return_qty: typeof item.return_qty === 'number' ? item.return_qty : Number(item.return_qty) || 0
            }));
            
            console.log('Données waybill reçues (troisième URL) normalisées:', thirdDataArray);
            setWaybillItems(thirdDataArray);
          } catch (thirdError) {
            console.error('Erreur lors de la troisième tentative:', thirdError);
          }
        }
      } catch (secondError) {
        console.error('Erreur lors de la seconde tentative:', secondError);
        setSnackbar({
          open: true,
          message: 'Impossible de charger les données waybill. Vérifiez la connexion au serveur.',
          severity: 'error'
        });
      }
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
    
    setLoading(true);
    try {
      console.log(`Tentative de suppression avec première URL: /api/waybill_items/${id}`);
      // Première tentative avec underscore
      await apiService.delete(`/api/waybill_items/${id}`);
      
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
      console.error('Erreur lors de la première tentative de suppression:', error);
      
      // Essayer avec l'URL alternative si la première tentative échoue
      try {
        console.log(`Tentative de suppression avec URL alternative: /api/waybill-items/${id}`);
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
      } catch (secondError) {
        console.error('Erreur lors de la seconde tentative de suppression:', secondError);
        
        // Essayer une troisième URL si nécessaire
        try {
          console.log(`Tentative de suppression avec troisième URL: /api/waybills/${id}`);
          await apiService.delete(`/api/waybills/${id}`);
          
          // S'assurer que waybillItems est un tableau avant de le filtrer
          if (Array.isArray(waybillItems)) {
            setWaybillItems(waybillItems.filter(item => item.id !== id));
          }
          
          setSnackbar({
            open: true,
            message: 'Élément supprimé avec succès',
            severity: 'success'
          });
        } catch (thirdError) {
          console.error('Erreur lors de la troisième tentative de suppression:', thirdError);
          setSnackbar({
            open: true,
            message: 'Erreur lors de la suppression de l\'élément. Vérifiez la connexion au serveur.',
            severity: 'error'
          });
        }
      }
    } finally {
      setLoading(false);
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

  // Calculer automatiquement les tonnes en fonction de la quantité et du poids unitaire
  useEffect(() => {
    if (currentItem.quantity_sent && currentItem.quantity_sent > 0) {
      let tonneSent = 0;
      // Déterminer le poids unitaire pour le calcul du tonnage envoyé
      let poidsUnitaire = currentItem.poids_unitaire || 0;
      
      // Si le poids unitaire n'est pas défini, essayer de le déterminer automatiquement
      if (!poidsUnitaire) {
        const commodityLower = (currentItem.commodity_specific || '').toLowerCase();
        
        if (commodityLower.includes('huile')) {
          poidsUnitaire = 20; // 20kg par carton d'huile
        } else if (commodityLower.includes('farine')) {
          poidsUnitaire = 25; // 25kg par sac de farine
        } else if (commodityLower.includes('haricot')) {
          poidsUnitaire = 50; // 50kg par sac de haricot
        } else if (commodityLower.includes('sel')) {
          poidsUnitaire = 25; // 25kg par sac de sel
        } else if (currentItem.unit_sent === 'kg') {
          poidsUnitaire = 1; // 1kg par unité pour les kg
        } else {
          poidsUnitaire = 1; // Valeur par défaut
        }
        
        // Mettre à jour le poids unitaire dans l'objet
        setCurrentItem(prev => ({ ...prev, poids_unitaire: poidsUnitaire }));
      }
      
      // Calculer le tonnage selon la formule: poids unitaire * quantité / 1000
      tonneSent = ((currentItem.quantity_sent || 0) * poidsUnitaire) / 1000;
      setCurrentItem(prev => ({ ...prev, tonne_sent: tonneSent }));
    }
  }, [currentItem.quantity_sent, currentItem.unit_sent, currentItem.commodity_specific, currentItem.poids_unitaire]);

  // Calculer automatiquement les tonnes reçues en fonction de la quantité et du poids unitaire
  useEffect(() => {
    if (currentItem.quantity && currentItem.quantity > 0) {
      // Utiliser le même poids unitaire que pour l'envoi
      const poidsUnitaire = currentItem.poids_unitaire || 1;
      
      // Calculer le tonnage selon la formule: poids unitaire * quantité / 1000
      const tonneReceived = ((currentItem.quantity || 0) * poidsUnitaire) / 1000;
      setCurrentItem(prev => ({ ...prev, tonne_received: tonneReceived }));
    }
  }, [currentItem.quantity, currentItem.poids_unitaire]);

  // Calculer automatiquement la perte
  useEffect(() => {
    const loss = (currentItem.quantity_sent || 0) - (currentItem.quantity || 0) - (currentItem.return_qty || 0);
    setCurrentItem(prev => ({ ...prev, loss: loss > 0 ? loss : 0 }));
  }, [currentItem.quantity_sent, currentItem.quantity, currentItem.return_qty]);

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (!currentItem.waybill_number) {
      setSnackbar({
        open: true,
        message: 'Le numéro de waybill est obligatoire',
        severity: 'error'
      });
      return;
    }

    if (!currentItem.batchnumber && !currentItem.batch_number) {
      setSnackbar({
        open: true,
        message: 'Le numéro de batch est obligatoire',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditing && currentItem.id) {
        // Mise à jour d'un élément existant
        console.log(`Tentative de mise à jour avec première URL: /api/waybill_items/${currentItem.id}`);
        try {
          // Première tentative avec underscore
          await apiService.put(`/api/waybill_items/${currentItem.id}`, currentItem);
          
          // S'assurer que waybillItems est un tableau avant d'utiliser map
          if (Array.isArray(waybillItems)) {
            setWaybillItems(waybillItems.map(item => item.id === currentItem.id ? currentItem : item));
          }
          
          setSnackbar({
            open: true,
            message: 'Élément mis à jour avec succès',
            severity: 'success'
          });
          setOpenDialog(false);
        } catch (firstError) {
          console.error('Erreur lors de la première tentative de mise à jour:', firstError);
          
          // Deuxième tentative avec tiret
          try {
            console.log(`Tentative de mise à jour avec URL alternative: /api/waybill-items/${currentItem.id}`);
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
            setOpenDialog(false);
          } catch (secondError) {
            console.error('Erreur lors de la seconde tentative de mise à jour:', secondError);
            
            // Troisième tentative
            try {
              console.log(`Tentative de mise à jour avec troisième URL: /api/waybills/${currentItem.id}`);
              await apiService.put(`/api/waybills/${currentItem.id}`, currentItem);
              
              // S'assurer que waybillItems est un tableau avant d'utiliser map
              if (Array.isArray(waybillItems)) {
                setWaybillItems(waybillItems.map(item => item.id === currentItem.id ? currentItem : item));
              }
              
              setSnackbar({
                open: true,
                message: 'Élément mis à jour avec succès',
                severity: 'success'
              });
              setOpenDialog(false);
            } catch (thirdError) {
              console.error('Erreur lors de la troisième tentative de mise à jour:', thirdError);
              setSnackbar({
                open: true,
                message: 'Erreur lors de la mise à jour des données. Vérifiez la connexion au serveur.',
                severity: 'error'
              });
            }
          }
        }
      } else {
        // Ajout d'un nouvel élément
        console.log('Tentative d\'ajout avec première URL: /api/waybill_items');
        try {
          // Première tentative avec underscore
          const response = await apiService.post('/api/waybill_items', currentItem);
          
          // S'assurer que waybillItems est un tableau avant d'utiliser le spread operator
          setWaybillItems(Array.isArray(waybillItems) ? [...waybillItems, response.data] : [response.data]);
          
          setSnackbar({
            open: true,
            message: 'Nouvel élément ajouté avec succès',
            severity: 'success'
          });
          setOpenDialog(false);
        } catch (firstError) {
          console.error('Erreur lors de la première tentative d\'ajout:', firstError);
          
          // Deuxième tentative avec tiret
          try {
            console.log('Tentative d\'ajout avec URL alternative: /api/waybill-items');
            const response = await apiService.post('/api/waybill-items', currentItem);
            
            // S'assurer que waybillItems est un tableau avant d'utiliser le spread operator
            setWaybillItems(Array.isArray(waybillItems) ? [...waybillItems, response.data] : [response.data]);
            
            setSnackbar({
              open: true,
              message: 'Nouvel élément ajouté avec succès',
              severity: 'success'
            });
            setOpenDialog(false);
          } catch (secondError) {
            console.error('Erreur lors de la seconde tentative d\'ajout:', secondError);
            
            // Troisième tentative
            try {
              console.log('Tentative d\'ajout avec troisième URL: /api/waybills');
              const response = await apiService.post('/api/waybills', currentItem);
              
              // S'assurer que waybillItems est un tableau avant d'utiliser le spread operator
              setWaybillItems(Array.isArray(waybillItems) ? [...waybillItems, response.data] : [response.data]);
              
              setSnackbar({
                open: true,
                message: 'Nouvel élément ajouté avec succès',
                severity: 'success'
              });
              setOpenDialog(false);
            } catch (thirdError) {
              console.error('Erreur lors de la troisième tentative d\'ajout:', thirdError);
              setSnackbar({
                open: true,
                message: 'Erreur lors de l\'enregistrement des données. Vérifiez la connexion au serveur.',
                severity: 'error'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur générale lors de l\'enregistrement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement des données',
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
  
  // Calculer les totaux pour l'affichage en bas du tableau
  const calculateTotals = (): WaybillTotals => {
    if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
      return {
        quantity_sent: 0,
        tonne_sent: 0,
        quantity: 0,
        tonne_received: 0,
        loss: 0,
        mount_in: 0,
        return_qty: 0
      };
    }
    
    return filteredItems.reduce((totals, item) => {
      return {
        quantity_sent: totals.quantity_sent + (Number(item.quantity_sent) || 0),
        tonne_sent: totals.tonne_sent + (Number(item.tonne_sent) || 0),
        quantity: totals.quantity + (Number(item.quantity) || 0),
        tonne_received: totals.tonne_received + (Number(item.tonne_received) || 0),
        loss: totals.loss + (Number(item.loss) || 0),
        mount_in: totals.mount_in + (Number(item.mount_in) || 0),
        return_qty: totals.return_qty + (Number(item.return_qty) || 0)
      };
    }, {
      quantity_sent: 0,
      tonne_sent: 0,
      quantity: 0,
      tonne_received: 0,
      loss: 0,
      mount_in: 0,
      return_qty: 0
    });
  };
  
  // Obtenir les totaux calculés
  const totals: WaybillTotals = calculateTotals();

  return (
    <PageTransition>
      <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        <Paper elevation={3} sx={styles.container}>
          <Box sx={styles.header}>
            <Typography variant="h4" sx={styles.title}>
              Réception des Waybills
            </Typography>
            <Typography variant="body1" sx={styles.subtitle}>
              Gérez la réception et le suivi des waybills pour les distributions
            </Typography>
          </Box>

          {/* Barre de recherche et bouton d'ajout */}
          <Box sx={{ mb: 4 }}>
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
                  ...styles.button,
                  ...styles.primaryButton,
                  px: 3,
                  py: 1,
                  minWidth: '180px'
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
              sx={styles.searchBar}
              InputProps={{
                endAdornment: <SearchIcon sx={{ color: '#64748b' }} />
              }}
            />
          </Box>

          {/* Tableau des données */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
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
              <TableRow sx={styles.tableHeader}>
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
                  <TableRow key={item.id} sx={styles.tableRow}>
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
              
              {/* Ligne des totaux */}
              {filteredItems.length > 0 && (
                <TableRow sx={{ 
                  backgroundColor: '#f1f5f9', 
                  fontWeight: 'bold',
                  '& td': { fontWeight: 700, color: '#0f172a', borderTop: '2px solid #cbd5e1' }
                }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>TOTAUX</TableCell>
                  <TableCell align="right">{totals?.quantity_sent?.toLocaleString('fr-FR') || '0'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell align="right">{Number(totals?.tonne_sent || 0).toFixed(3)} T</TableCell>
                  <TableCell align="right">{totals?.quantity?.toLocaleString('fr-FR') || '0'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell align="right">{Number(totals?.tonne_received || 0).toFixed(3)} T</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell align="right">{totals?.loss?.toLocaleString('fr-FR') || '0'}</TableCell>
                  <TableCell align="right">{totals?.mount_in?.toLocaleString('fr-FR') || '0'}</TableCell>
                  <TableCell align="right">{totals?.return_qty?.toLocaleString('fr-FR') || '0'}</TableCell>
                  <TableCell colSpan={3}>-</TableCell>
                </TableRow>
              )}
            </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="waybill_number"
                  label="Waybill Number"
                  fullWidth
                  required
                  value={currentItem.waybill_number}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="batchnumber"
                  label="Batch Number"
                  fullWidth
                  required
                  value={currentItem.batchnumber}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="commodity_specific"
                  label="Commodity Specific"
                  fullWidth
                  required
                  value={currentItem.commodity_specific}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  helperText="Ex: Huile, Farine, Haricot, Sel, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={styles.formField}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={currentItem.type || ''}
                    onChange={handleSelectChange}
                    variant="outlined"
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
                  required
                  value={currentItem.quantity_sent}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="poids_unitaire"
                  label="Poids unitaire (kg)"
                  type="number"
                  fullWidth
                  required
                  value={currentItem.poids_unitaire}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  helperText="Poids d'une unité en kg"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="poids_unitaire"
                  label="Poids unitaire (kg)"
                  type="number"
                  fullWidth
                  required
                  value={currentItem.poids_unitaire}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  helperText="Poids d'une unité en kg"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={styles.formField}>
                  <InputLabel>Unit Sent</InputLabel>
                  <Select
                    name="unit_sent"
                    value={currentItem.unit_sent || ''}
                    onChange={handleSelectChange}
                    variant="outlined"
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
                  sx={styles.formField}
                  variant="outlined"
                  disabled
                  helperText="Calculé automatiquement"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantity"
                  label="Quantity Received"
                  type="number"
                  fullWidth
                  required
                  value={currentItem.quantity}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={styles.formField}>
                  <InputLabel>Unit Received</InputLabel>
                  <Select
                    name="unit_received"
                    value={currentItem.unit_received || ''}
                    onChange={handleSelectChange}
                    variant="outlined"
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
                  sx={styles.formField}
                  variant="outlined"
                  disabled
                  helperText="Calculé automatiquement"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="obs"
                  label="Observations"
                  fullWidth
                  value={currentItem.obs}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
                  multiline
                  rows={2}
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
                  sx={styles.formField}
                  variant="outlined"
                  disabled
                  helperText="Calculé automatiquement"
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
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
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
                  sx={styles.formField}
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="activity"
                  label="Activity"
                  fullWidth
                  value={currentItem.activity}
                  onChange={handleChange}
                  sx={styles.formField}
                  variant="outlined"
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
                        sx: styles.formField,
                        variant: "outlined"
                      } 
                    }}
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
                  sx={styles.formField}
                  variant="outlined"
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

export default ReceptionWaybill;
