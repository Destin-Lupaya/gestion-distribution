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
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';

// Interface pour les données par batch et commodité
interface BatchCommodityData {
  activity: string;
  batchNumber: string;
  specificCommodity: string;
  sentTonnage: number;
  internalMovement: number;
  receivedTonnage: number;
  returnedQuantity: number;
  losses: number;
  location: string;
}

// Interface pour les totaux par commodité
interface CommodityTotal {
  specificCommodity: string;
  sentTonnage: number;
  internalMovement: number;
  receivedTonnage: number;
  returnedQuantity: number;
  losses: number;
}

const BatchCommodityReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [activity, setActivity] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [activities, setActivities] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<BatchCommodityData[]>([]);
  const [commodityTotals, setCommodityTotals] = useState<CommodityTotal[]>([]);
  const [grandTotal, setGrandTotal] = useState<{
    sentTonnage: number;
    internalMovement: number;
    receivedTonnage: number;
    returnedQuantity: number;
    losses: number;
  }>({
    sentTonnage: 0,
    internalMovement: 0,
    receivedTonnage: 0,
    returnedQuantity: 0,
    losses: 0
  });

  // Charger les activités et emplacements disponibles au démarrage
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [activitiesResponse, locationsResponse] = await Promise.all([
          apiService.get('/api/activities'),
          apiService.get('/api/locations')
        ]);
        setActivities(activitiesResponse);
        setLocations(locationsResponse);
      } catch (err) {
        console.error('Erreur lors du chargement des filtres:', err);
        setError('Impossible de charger les filtres');
      }
    };

    fetchFilters();
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
      
      if (activity) {
        params.activity = activity;
      }
      
      if (location) {
        params.location = location;
      }

      const response = await apiService.get('/api/reports/batch-commodity', params);
      
      // Traiter les données reçues
      setReportData(response.data || []);
      
      // Calculer les totaux par commodité
      const commodityMap = new Map<string, CommodityTotal>();
      
      response.data.forEach((item: BatchCommodityData) => {
        if (!commodityMap.has(item.specificCommodity)) {
          commodityMap.set(item.specificCommodity, {
            specificCommodity: item.specificCommodity,
            sentTonnage: 0,
            internalMovement: 0,
            receivedTonnage: 0,
            returnedQuantity: 0,
            losses: 0
          });
        }
        
        const current = commodityMap.get(item.specificCommodity)!;
        current.sentTonnage += item.sentTonnage;
        current.internalMovement += item.internalMovement;
        current.receivedTonnage += item.receivedTonnage;
        current.returnedQuantity += item.returnedQuantity;
        current.losses += item.losses;
      });
      
      setCommodityTotals(Array.from(commodityMap.values()));
      
      // Calculer le total général
      const total = {
        sentTonnage: 0,
        internalMovement: 0,
        receivedTonnage: 0,
        returnedQuantity: 0,
        losses: 0
      };
      
      commodityMap.forEach((value) => {
        total.sentTonnage += value.sentTonnage;
        total.internalMovement += value.internalMovement;
        total.receivedTonnage += value.receivedTonnage;
        total.returnedQuantity += value.returnedQuantity;
        total.losses += value.losses;
      });
      
      setGrandTotal(total);
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError('Impossible de générer le rapport par batch et commodité');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapport par Batch et Commodité
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={2.4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de début"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date de fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Activité</InputLabel>
                <Select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  label="Activité"
                >
                  <MenuItem value="">Toutes les activités</MenuItem>
                  {activities.map((act) => (
                    <MenuItem key={act} value={act}>{act}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
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
            <Grid item xs={12} sm={6} md={2.4}>
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

        {reportData.length > 0 && (
          <>
            <Paper elevation={3} sx={{ mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Activité</TableCell>
                      <TableCell>Numéro de batch</TableCell>
                      <TableCell>Commodité spécifique</TableCell>
                      <TableCell align="right">Tonnage envoyé</TableCell>
                      <TableCell align="right">Mouvement interne</TableCell>
                      <TableCell align="right">Tonnage reçu</TableCell>
                      <TableCell align="right">Quantité retournée</TableCell>
                      <TableCell align="right">Pertes</TableCell>
                      <TableCell>Emplacement</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.activity}</TableCell>
                        <TableCell>{row.batchNumber}</TableCell>
                        <TableCell>{row.specificCommodity}</TableCell>
                        <TableCell align="right">{row.sentTonnage.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.internalMovement.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.receivedTonnage.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.returnedQuantity.toFixed(2)}</TableCell>
                        <TableCell align="right">{row.losses.toFixed(2)}</TableCell>
                        <TableCell>{row.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Typography variant="h6" gutterBottom>
              Totaux par commodité
            </Typography>
            <Paper elevation={3} sx={{ mb: 4 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Commodité spécifique</TableCell>
                      <TableCell align="right">Tonnage envoyé</TableCell>
                      <TableCell align="right">Mouvement interne</TableCell>
                      <TableCell align="right">Tonnage reçu</TableCell>
                      <TableCell align="right">Quantité retournée</TableCell>
                      <TableCell align="right">Pertes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commodityTotals.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.specificCommodity}</TableCell>
                        <TableCell align="right">{row.sentTonnage.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.internalMovement.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.receivedTonnage.toFixed(2)} T</TableCell>
                        <TableCell align="right">{row.returnedQuantity.toFixed(2)}</TableCell>
                        <TableCell align="right">{row.losses.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell>
                        <Typography fontWeight="bold">TOTAL GÉNÉRAL</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{grandTotal.sentTonnage.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{grandTotal.internalMovement.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{grandTotal.receivedTonnage.toFixed(2)} T</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{grandTotal.returnedQuantity.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{grandTotal.losses.toFixed(2)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {!loading && reportData.length === 0 && !error && (
          <Alert severity="info">
            Veuillez sélectionner une période et générer le rapport pour voir les données par batch et commodité.
          </Alert>
        )}
      </Box>
    </PageTransition>
  );
};

export default BatchCommodityReport;
