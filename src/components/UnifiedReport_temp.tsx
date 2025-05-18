import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  TextField,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import * as XLSX from 'xlsx';
import { PageTransition } from './PageTransition';

interface ReportFilters {
  startDate: string;
  endDate: string;
  siteId: string;
  reportType: 'distribution' | 'daily' | 'age';
}

interface Site {
  id: number;
  nom: string;
}

interface Distribution {
  id: string;
  date: string;
  site: string;
  quantite: number;
  beneficiaire: string;
}

const UnifiedReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    siteId: '',
    reportType: 'distribution'
  });
  
  const [sites, setSites] = useState<Site[]>([]);
  const [reportData, setReportData] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Référence pour les graphiques
  const chartRefs = {
    distribution: useRef<HTMLCanvasElement>(null),
    daily: useRef<HTMLCanvasElement>(null),
    age: useRef<HTMLCanvasElement>(null)
  };

  const chartInstancesRef = useRef<any>({
    distribution: null,
    daily: null,
    age: null
  });

  // Charger les sites au chargement du composant
  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/sites');
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        const data = await response.json();
        setSites(data);
      } catch (error: any) {
        console.error('Erreur lors du chargement des sites:', error);
        setError(`Erreur lors du chargement des sites: ${error.message || 'Erreur inconnue'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadSites();
  }, []);

  // Fonction pour initialiser les graphiques
  const initializeCharts = () => {
    // Cette fonction serait implémentée avec Chart.js
    // Pour l'instant, elle est vide car Chart.js n'est pas importé
    console.log('Initialisation des graphiques');
  };
  
  // Fonction pour charger les données du rapport
  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construction de l'URL avec les paramètres de filtrage
      const url = `http://localhost:3001/api/reports?startDate=${filters.startDate}&endDate=${filters.endDate}&siteId=${filters.siteId}&type=${filters.reportType}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
      
      // Mise à jour des graphiques avec les nouvelles données
      updateCharts(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données du rapport:', error);
      setError(`Erreur lors du chargement des données: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour mettre à jour les graphiques
  const updateCharts = (data: Distribution[]) => {
    // Cette fonction serait implémentée avec Chart.js
    // Pour l'instant, elle est vide car Chart.js n'est pas importé
    console.log('Mise à jour des graphiques avec', data.length, 'enregistrements');
  };
  
  // Fonction pour gérer les changements de filtre
  const handleFilterChange = (e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour exporter les données en Excel
  const exportToExcel = () => {
    if (reportData.length === 0) {
      setError('Aucune donnée à exporter');
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    // Génération du nom de fichier
    const reportTypes = {
      distribution: 'Distribution',
      daily: 'Quotidien',
      age: 'Age'
    };
    const fileName = `Rapport_${reportTypes[filters.reportType as keyof typeof reportTypes]}_${filters.startDate}_${filters.endDate}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  // Fonction pour générer le rapport
  const generateReport = () => {
    loadReportData();
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapports Unifiés
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                name="startDate"
                label="Date de début"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="endDate"
                label="Date de fin"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="site-label">Site</InputLabel>
                <Select
                  labelId="site-label"
                  name="siteId"
                  value={filters.siteId}
                  onChange={handleFilterChange}
                  label="Site"
                >
                  <MenuItem value="">Tous les sites</MenuItem>
                  {sites.map(site => (
                    <MenuItem key={site.id} value={site.id.toString()}>{site.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Type de rapport</InputLabel>
                <Select
                  labelId="report-type-label"
                  name="reportType"
                  value={filters.reportType}
                  onChange={handleFilterChange}
                  label="Type de rapport"
                >
                  <MenuItem value="distribution">Distribution par site</MenuItem>
                  <MenuItem value="daily">Distributions quotidiennes</MenuItem>
                  <MenuItem value="age">Distribution par âge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button variant="contained" color="primary" onClick={generateReport}>
              Générer le rapport
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={exportToExcel}
              disabled={reportData.length === 0}
            >
              Exporter en Excel
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : reportData.length === 0 ? (
            <Alert severity="info">Aucune donnée à afficher. Veuillez générer un rapport.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Bénéficiaire</TableCell>
                    <TableCell>Quantité</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.site}</TableCell>
                      <TableCell>{row.beneficiaire}</TableCell>
                      <TableCell>{row.quantite}</TableCell>
                    </TableRow>
                  ))}
                  {reportData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {reportData.length - 10} autres enregistrements non affichés
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Graphiques
          </Typography>
          <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              Les graphiques seront affichés ici après la génération du rapport.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </PageTransition>
  );
};

export default UnifiedReport;
