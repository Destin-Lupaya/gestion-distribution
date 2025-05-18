import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';

// Interface pour les données de comparaison de tonnage
interface TonnageComparisonData {
  commodity: string;
  waybillTonnage: number;
  mposTonnage: number;
  difference: number;
  recommendation: string;
}

// Interface pour les totaux
interface TotalData {
  totalWaybillTonnage: number;
  totalMposTonnage: number;
  totalDifference: number;
  totalHouseholds: number;
  totalBeneficiaries: number;
}

const TonnageComparisonReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [location, setLocation] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<TonnageComparisonData[]>([]);
  const [totalData, setTotalData] = useState<TotalData>({
    totalWaybillTonnage: 0,
    totalMposTonnage: 0,
    totalDifference: 0,
    totalHouseholds: 0,
    totalBeneficiaries: 0
  });

  // Charger les emplacements disponibles au démarrage
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiService.get('/api/locations');
        setLocations(response);
      } catch (err) {
        console.error('Erreur lors du chargement des emplacements:', err);
        setError('Impossible de charger les emplacements');
      }
    };

    fetchLocations();
  }, []);

  // Fonction pour générer le rapport
  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une période valide');
      return;
    }

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

      const response = await apiService.get('/api/reports/tonnage-comparison', params);
      
      // Traiter les données reçues
      setComparisonData(response.data || []);
      setTotalData({
        totalWaybillTonnage: response.totalWaybillTonnage || 0,
        totalMposTonnage: response.totalMposTonnage || 0,
        totalDifference: response.totalDifference || 0,
        totalHouseholds: response.totalHouseholds || 0,
        totalBeneficiaries: response.totalBeneficiaries || 0
      });
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError('Impossible de générer le rapport de comparaison de tonnage');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer la couleur en fonction de la différence
  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return 'error.main'; // Rouge pour les valeurs positives (plus de waybill que de MPOS)
    if (difference < 0) return 'success.main'; // Vert pour les valeurs négatives (plus de MPOS que de waybill)
    return 'text.primary'; // Couleur par défaut pour zéro
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Comparaison Tonnage Waybill/MPOS
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de début"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
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

        {comparisonData.length > 0 && (
          <>
            <Paper elevation={3} sx={{ mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Commodité</TableCell>
                      <TableCell align="right">Tonnage Waybill</TableCell>
                      <TableCell align="right">Tonnage MPOS</TableCell>
                      <TableCell align="right">Différence</TableCell>
                      <TableCell>Recommandation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.commodity}
                        </TableCell>
                        <TableCell align="right">{row.waybillTonnage.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.mposTonnage.toFixed(2)} T</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: getDifferenceColor(row.difference) }}
                        >
                          {row.difference.toFixed(2)} T
                        </TableCell>
                        <TableCell>{row.recommendation}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell component="th" scope="row">
                        <Typography fontWeight="bold">TOTAL</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{totalData.totalWaybillTonnage.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{totalData.totalMposTonnage.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getDifferenceColor(totalData.totalDifference) }}
                      >
                        <Typography fontWeight="bold">{totalData.totalDifference.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Informations sur les bénéficiaires
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total des ménages:</Typography>
                    <Typography fontWeight="bold">{totalData.totalHouseholds}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total des bénéficiaires:</Typography>
                    <Typography fontWeight="bold">{totalData.totalBeneficiaries}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Note:</strong> Ce rapport compare le tonnage reçu selon les waybills avec le tonnage selon les données MPOS.
              <br />
              Les poids spécifiques utilisés pour le calcul sont : Farine (25kg/sac), Haricot (50kg/sac), Huile (20kg/carton), Sel (25kg/sac).
            </Typography>
          </>
        )}

        {!loading && comparisonData.length === 0 && !error && (
          <Alert severity="info">
            Veuillez sélectionner une période et générer le rapport pour voir les données de comparaison.
          </Alert>
        )}
      </Box>
    </PageTransition>
  );
};

export default TonnageComparisonReport;
