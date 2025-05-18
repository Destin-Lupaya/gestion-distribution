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
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';

// Interface pour les données de distribution
interface DistributionItem {
  site: string;
  beneficiaries: number;
  households: number;
  commodities: {
    name: string;
    quantity: number;
  }[];
}

export default function DistributionReport() {
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        endDate: endDate.format('YYYY-MM-DD')
      };
      
      if (location) {
        params.location = location;
      }

      // Remplacer par un appel API réel
      // const response = await apiService.get('/api/reports/distribution', params);
      
      // Données simulées pour démonstration
      const mockData: DistributionItem[] = [
        {
          site: 'Site A',
          beneficiaries: 120,
          households: 30,
          commodities: [
            { name: 'Farine', quantity: 750 },
            { name: 'Haricot', quantity: 300 },
            { name: 'Huile', quantity: 150 }
          ]
        },
        {
          site: 'Site B',
          beneficiaries: 85,
          households: 22,
          commodities: [
            { name: 'Farine', quantity: 550 },
            { name: 'Haricot', quantity: 220 },
            { name: 'Huile', quantity: 110 }
          ]
        },
        {
          site: 'Site C',
          beneficiaries: 150,
          households: 38,
          commodities: [
            { name: 'Farine', quantity: 950 },
            { name: 'Haricot', quantity: 380 },
            { name: 'Huile', quantity: 190 }
          ]
        }
      ];
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDistributionData(mockData);
      setSnackbar({
        open: true,
        message: 'Rapport généré avec succès',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError('Impossible de générer le rapport de distribution');
      setSnackbar({
        open: true,
        message: 'Erreur lors de la génération du rapport',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const calculateTotals = () => {
    if (distributionData.length === 0) return {
      beneficiaries: 0,
      households: 0,
      commodities: {}
    };

    const totals = {
      beneficiaries: 0,
      households: 0,
      commodities: {} as Record<string, number>
    };

    distributionData.forEach(item => {
      totals.beneficiaries += item.beneficiaries;
      totals.households += item.households;
      
      item.commodities.forEach(commodity => {
        if (!totals.commodities[commodity.name]) {
          totals.commodities[commodity.name] = 0;
        }
        totals.commodities[commodity.name] += commodity.quantity;
      });
    });

    return totals;
  };

  const totals = calculateTotals();

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapport de Distribution
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de début"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue || dayjs())}
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
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Emplacement</InputLabel>
                <Select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  label="Emplacement"
                >
                  <MenuItem value="">Tous les emplacements</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Générer le rapport'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {distributionData.length > 0 && (
          <>
            <Paper elevation={3} sx={{ mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Site</TableCell>
                      <TableCell align="right">Bénéficiaires</TableCell>
                      <TableCell align="right">Ménages</TableCell>
                      <TableCell>Commodités</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {distributionData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {item.site}
                        </TableCell>
                        <TableCell align="right">{item.beneficiaries}</TableCell>
                        <TableCell align="right">{item.households}</TableCell>
                        <TableCell>
                          {item.commodities.map((commodity, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{commodity.name}:</Typography>
                              <Typography variant="body2" fontWeight="bold">{commodity.quantity}</Typography>
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell component="th" scope="row">
                        <Typography fontWeight="bold">TOTAL</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{totals.beneficiaries}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{totals.households}</Typography>
                      </TableCell>
                      <TableCell>
                        {Object.entries(totals.commodities).map(([name, quantity], idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{name}:</Typography>
                            <Typography variant="body2" fontWeight="bold">{quantity}</Typography>
                          </Box>
                        ))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Statistiques Globales
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total des bénéficiaires:</Typography>
                    <Typography fontWeight="bold">{totals.beneficiaries}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total des ménages:</Typography>
                    <Typography fontWeight="bold">{totals.households}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Ratio bénéficiaires/ménages:</Typography>
                    <Typography fontWeight="bold">
                      {totals.households > 0 ? (totals.beneficiaries / totals.households).toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Commodités Distribuées
                  </Typography>
                  {Object.entries(totals.commodities).map(([name, quantity], idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>{name}:</Typography>
                      <Typography fontWeight="bold">{quantity}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {!loading && distributionData.length === 0 && !error && (
          <Alert severity="info">
            Veuillez sélectionner une période et générer le rapport pour voir les données de distribution.
          </Alert>
        )}

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
}