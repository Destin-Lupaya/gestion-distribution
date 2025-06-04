import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Pagination,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';

// Interface pour les données du waybill
interface WaybillItem {
  id?: number | string;
  waybill_number?: string;
  batch_number?: string;
  batchnumber?: string;
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

export default function WaybillReport() {
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [reportType, setReportType] = useState('waybill-summary');
  const [waybillData, setWaybillData] = useState<WaybillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'info' | 'warning'
  });

  // Charger les emplacements disponibles au démarrage
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiService.get('/api/locations');
        setLocations(response || []);
      } catch (err) {
        console.error('Erreur lors du chargement des emplacements:', err);
        setError('Impossible de charger les emplacements');
      }
    };

    fetchLocations();
  }, []);

  // Fonction pour générer le rapport
  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        page: page.toString(),
        limit: rowsPerPage.toString()
      };
      
      if (location) {
        params.location = location;
      }

      // Appel API pour récupérer les données des waybills
      const response = await apiService.get('/api/waybill-items', params);
      
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Format de réponse invalide');
      }
      
      setWaybillData(response.data);
      setTotalPages(Math.ceil(response.total / rowsPerPage));
      setSnackbar({
        open: true,
        message: 'Rapport généré avec succès',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError('Impossible de générer le rapport des waybills');
      setSnackbar({
        open: true,
        message: 'Erreur lors de la génération du rapport',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Exporter en Excel
  const exportToExcel = async () => {
    try {
      const params: Record<string, string> = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        format: 'excel'
      };
      
      if (location) {
        params.location = location;
      }

      const response = await apiService.get('/api/export/waybills', params);
      
      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_Waybills_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur lors de l\'exportation en Excel:', err);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'exportation en Excel',
        severity: 'error'
      });
    }
  };

  // Gérer le changement de page
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    generateReport();
  };

  // Gérer le changement d'emplacement
  const handleLocationChange = (event: SelectChangeEvent) => {
    setLocation(event.target.value);
  };

  // Gérer le changement de type de rapport
  const handleReportTypeChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  };

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculer le poids unitaire en fonction du type de produit
  const getPoidsUnitaire = (commodity: string | undefined): number => {
    if (!commodity) return 0;
    
    const commodityLower = commodity.toLowerCase();
    
    if (commodityLower.includes('huile')) {
      return 20; // 20kg par carton d'huile
    } else if (commodityLower.includes('farine')) {
      return 25; // 25kg par sac de farine
    } else if (commodityLower.includes('haricot')) {
      return 50; // 50kg par sac de haricot
    } else if (commodityLower.includes('sel')) {
      return 25; // 25kg par sac de sel
    }
    
    return 0;
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapports Unifiés
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtres
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de début"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue || dayjs())}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue || dayjs())}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="location-label">Site</InputLabel>
                <Select
                  labelId="location-label"
                  value={location}
                  label="Site"
                  onChange={handleLocationChange}
                >
                  <MenuItem value="">Tous les sites</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Type de rapport</InputLabel>
                <Select
                  labelId="report-type-label"
                  value={reportType}
                  label="Type de rapport"
                  onChange={handleReportTypeChange}
                >
                  <MenuItem value="waybill-summary">Résumé des waybills</MenuItem>
                  <MenuItem value="waybill-detail">Détail des waybills</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Générer le rapport'}
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={exportToExcel}
              disabled={loading || waybillData.length === 0}
            >
              Exporter en Excel
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {waybillData.length > 0 ? (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Waybill #</TableCell>
                    <TableCell>Batch #</TableCell>
                    <TableCell>Commodity</TableCell>
                    <TableCell align="right">Quantité</TableCell>
                    <TableCell align="right">Tonnage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {waybillData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.reception_date || item.date}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.waybill_number}</TableCell>
                      <TableCell>{item.batch_number || item.batchnumber}</TableCell>
                      <TableCell>{item.commodity_specific}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.tonne_received ? item.tonne_received.toFixed(3) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Lignes par page: 
                <Select
                  value={rowsPerPage.toString()}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setPage(1);
                    generateReport();
                  }}
                  size="small"
                  sx={{ ml: 1, mr: 2 }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                {page}-{Math.min(page * rowsPerPage, waybillData.length)} sur {waybillData.length}
              </Box>
              
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </Paper>
        ) : !loading && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Aucune donnée disponible. Veuillez générer un rapport.
            </Typography>
          </Paper>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageTransition>
  );
}
