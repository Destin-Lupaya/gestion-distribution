import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
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
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [location, setLocation] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // État pour les notifications snackbar
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'success' | 'info' | 'warning'
  });

  // État pour les totaux
  const [totals, setTotals] = useState<{
    beneficiaries: number;
    households: number;
    commodities: Record<string, number>;
  }>({
    beneficiaries: 0,
    households: 0,
    commodities: {}
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
    try {
      // Format dates for API
      const formattedStartDate = startDate?.format('YYYY-MM-DD');
      const formattedEndDate = endDate?.format('YYYY-MM-DD');
      
      // Call API
      // Utilisation d'un objet de paramètres compatible avec l'API
      const params: Record<string, string> = {};
      if (formattedStartDate) params.startDate = formattedStartDate;
      if (formattedEndDate) params.endDate = formattedEndDate;
      if (location) params.location = location;
      
      const response = await apiService.get('/api/reports/distribution', params);
      
      // Process data
      if (Array.isArray(response.data)) {
        setDistributionData(response.data);
        const newTotals = calculateTotals(response.data);
        setTotals(newTotals);
      } else {
        console.warn('Les données reçues ne sont pas un tableau:', response.data);
        setDistributionData([]);
        setTotals({
          beneficiaries: 0,
          households: 0,
          commodities: {}
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Impossible de générer le rapport. Veuillez réessayer plus tard.');
      setDistributionData([]);
      setTotals({
        beneficiaries: 0,
        households: 0,
        commodities: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const calculateTotals = (data: DistributionItem[]) => {
    const calculatedTotals = {
      beneficiaries: 0,
      households: 0,
      commodities: {} as Record<string, number>
    };

    data.forEach(item => {
      calculatedTotals.beneficiaries += item.beneficiaries;
      calculatedTotals.households += item.households;
      
      item.commodities.forEach(commodity => {
        if (calculatedTotals.commodities[commodity.name]) {
          calculatedTotals.commodities[commodity.name] += commodity.quantity;
        } else {
          calculatedTotals.commodities[commodity.name] = commodity.quantity;
        }
      });
    });
    
    return calculatedTotals;
  };

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbarState({ ...snackbarState, open: false });
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#003C5F', fontWeight: 700, mb: 3 }}>
        Rapport de Distribution
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#003C5F', fontWeight: 600, mb: 2 }}>
          Filtres
        </Typography>
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
              <InputLabel id="location-label">Emplacement</InputLabel>
              <Select
                labelId="location-label"
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
              className="action-button"
              sx={{ 
                height: '56px',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
                boxShadow: '0 3px 5px 2px rgba(0, 120, 190, .3)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Générer le rapport'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            borderRadius: '8px',
            p: 2,
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              color: '#D32F2F',
            },
            mb: 3
          }}
        >
          <Typography variant="body1">{error}</Typography>
        </Alert>
      )}

      {distributionData.length > 0 ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#003C5F', fontSize: '1.25rem' }}>
              Résultats du rapport
            </Typography>
          </Box>
          <TableContainer 
            component={Paper} 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Site</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Bénéficiaires</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Ménages</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Commodités</TableCell>
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
        </>
      ) : !loading && (
        <Alert 
          severity="info" 
          variant="outlined"
          sx={{ 
            borderRadius: '8px',
            p: 2,
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              color: '#0284c7',
              fontSize: '1.5rem',
              mr: 2
            },
            mb: 3
          }}
        >
          <Typography variant="body1">
            Aucune donnée disponible. Veuillez générer un rapport.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#003C5F', fontWeight: 600, mb: 2 }}>
              Totaux
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
          <Paper 
            elevation={3} 
            sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#003C5F', fontWeight: 600, mb: 2 }}>
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

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarState.severity}
          sx={{
            width: '100%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
          }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}