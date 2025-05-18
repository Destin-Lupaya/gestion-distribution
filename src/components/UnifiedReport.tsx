import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  SelectChangeEvent,
  TablePagination, // Ajout pour la pagination
  LinearProgress
} from '@mui/material';
import * as XLSX from 'xlsx';
import { PageTransition } from './PageTransition'; // Supposons que ce composant existe

// --- Constants ---
const API_BASE_URL = 'http://localhost:3001/api';
const SITES_API_URL = `${API_BASE_URL}/sites`;
const REPORTS_API_URL = `${API_BASE_URL}/reports`;

const REPORT_TYPES = {
  DISTRIBUTION: 'distribution',
  DAILY: 'daily',
  AGE: 'age',
} as const; // as const pour des types plus stricts

type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES];

// --- Interfaces ---
interface ReportFilters {
  startDate: string;
  endDate: string;
  siteId: string; // Peut être '' pour "tous les sites"
  reportType: ReportType;
}

interface Site {
  id: number; // ou string si vos IDs sont des strings
  nom: string;
}

// Type générique pour les données de rapport. Adaptez si les structures diffèrent beaucoup.
interface ReportRowData {
  id: string | number; // Un identifiant unique par ligne
  date: string;
  site?: string; // Optionnel si le rapport n'est pas par site
  beneficiaire?: string; // Optionnel
  quantite?: number; // Optionnel
  ageGroup?: string; // Pour le rapport par âge
  count?: number; // Pour les rapports agrégés
  // Ajoutez d'autres champs potentiels ici
  [key: string]: any; // Pour permettre d'autres propriétés
}

interface ColumnDefinition {
  id: keyof ReportRowData | string; // string pour des clés dynamiques ou calculées
  label: string;
  numeric?: boolean;
  render?: (value: any, row: ReportRowData) => React.ReactNode;
}

// --- Helper Functions ---
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', { // fr-FR pour le format français
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.warn("Invalid date string for formatDate:", dateString);
    return dateString; // Retourne la chaîne originale en cas d'erreur
  }
};

const UnifiedReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    siteId: '',
    reportType: REPORT_TYPES.DISTRIBUTION,
  });

  const [sites, setSites] = useState<Site[]>([]);
  const [reportData, setReportData] = useState<ReportRowData[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Charger les sites
  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    setError(null);
    try {
      const response = await fetch(SITES_API_URL);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} lors du chargement des sites.`);
      }
      const data = await response.json();
      setSites(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des sites:', err);
      setError(err.message || 'Erreur inconnue lors du chargement des sites.');
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Charger les données du rapport
  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    setError(null);
    setReportData([]); // Clear previous data
    setPage(0); // Reset page on new report
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        siteId: filters.siteId,
      });
      
      // Utiliser l'endpoint spécifique selon le type de rapport
      let url;
      switch (filters.reportType) {
        case REPORT_TYPES.DAILY:
          url = `${API_BASE_URL}/reports/daily?${params.toString()}`;
          break;
        case REPORT_TYPES.DISTRIBUTION:
          url = `${API_BASE_URL}/reports/distribution?${params.toString()}`;
          break;
        case REPORT_TYPES.AGE:
          url = `${API_BASE_URL}/reports/age?${params.toString()}`;
          break;
        default:
          url = `${API_BASE_URL}/reports/distribution?${params.toString()}`;
      }

      console.log('Chargement des données depuis:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.message || `Erreur HTTP ${response.status} lors du chargement du rapport.`);
      }

      const data = await response.json();
      console.log('Données reçues:', data);
      
      // Traitement des données selon le type de rapport
      let processedData = [];
      
      if (data && Array.isArray(data)) {
        // Traitement spécifique selon le type de rapport
        switch (filters.reportType) {
          case REPORT_TYPES.DAILY:
            processedData = data.map((item, index) => ({
              id: item.id || `daily-${index}`,
              date: item.date || new Date().toISOString().split('T')[0],
              site: item.site || 'Non spécifié',
              count: item.count || 0,
              quantite: item.quantite || 0
            }));
            break;
            
          case REPORT_TYPES.DISTRIBUTION:
            processedData = data.map((item, index) => ({
              id: item.id || `dist-${index}`,
              date: item.date || new Date().toISOString().split('T')[0],
              site: item.site || 'Non spécifié',
              beneficiaire: item.beneficiaire || 'Non spécifié',
              quantite: item.quantite || 0
            }));
            break;
            
          case REPORT_TYPES.AGE:
            processedData = data.map((item, index) => ({
              id: item.id || `age-${index}`,
              ageGroup: item.ageGroup || 'Non spécifié',
              count: item.count || 0,
              site: item.site || 'Non spécifié'
            }));
            break;
            
          default:
            processedData = data;
        }
      } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
        // Certains endpoints peuvent renvoyer les données dans un objet avec une propriété 'data'
        processedData = data.data;
      } else {
        // Si les données ne sont pas dans un format attendu
        console.warn('Format de données inattendu:', data);
        processedData = [];
      }
      
      console.log('Données traitées:', processedData);
      setReportData(processedData);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données du rapport:', err);
      setError(err.message || 'Erreur inconnue lors du chargement des données du rapport.');
    } finally {
      setLoadingReport(false);
    }
  }, [filters.startDate, filters.endDate, filters.siteId, filters.reportType]); // Dépendances précises

  const handleFilterChange = useCallback(
    (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const generateReport = useCallback(() => {
    if (!filters.startDate || !filters.endDate) {
        setError("Veuillez sélectionner une date de début et une date de fin.");
        return;
    }
    if (new Date(filters.startDate) > new Date(filters.endDate)) {
        setError("La date de début ne peut pas être postérieure à la date de fin.");
        return;
    }
    loadReportData();
  }, [loadReportData, filters.startDate, filters.endDate]);

  const exportToExcel = useCallback(() => {
    if (reportData.length === 0) {
      setError('Aucune donnée à exporter.');
      return;
    }
    setError(null);

    const reportTypeLabels: Record<ReportType, string> = {
      [REPORT_TYPES.DISTRIBUTION]: 'Distribution',
      [REPORT_TYPES.DAILY]: 'Quotidien',
      [REPORT_TYPES.AGE]: 'Age',
    };

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    const fileName = `Rapport_${reportTypeLabels[filters.reportType]}_${filters.startDate}_au_${filters.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [reportData, filters.reportType, filters.startDate, filters.endDate]);

  // Définition dynamique des colonnes du tableau
  const columns = useMemo((): ColumnDefinition[] => {
    switch (filters.reportType) {
      case REPORT_TYPES.AGE:
        return [
          { id: 'ageGroup', label: 'Tranche d\'âge', render: (value) => value || 'Non spécifié' },
          { id: 'count', label: 'Nombre de bénéficiaires', numeric: true, render: (value) => value || 0 },
          { id: 'site', label: 'Site', render: (value) => value || 'Non spécifié' },
        ];
      case REPORT_TYPES.DAILY:
        return [
          { id: 'date', label: 'Date', render: (value) => value ? formatDate(value) : 'Non spécifié' },
          { id: 'site', label: 'Site', render: (value) => value || 'Non spécifié' },
          { id: 'count', label: 'Nombre de distributions', numeric: true, render: (value) => value || 0 },
          { id: 'quantite', label: 'Quantité totale', numeric: true, render: (value) => value || 0 },
        ];
      case REPORT_TYPES.DISTRIBUTION:
      default:
        return [
          { id: 'date', label: 'Date', render: (value) => value ? formatDate(value) : 'Non spécifié' },
          { id: 'site', label: 'Site', render: (value) => value || 'Non spécifié' },
          { id: 'beneficiaire', label: 'Bénéficiaire', render: (value) => value || 'Non spécifié' },
          { id: 'quantite', label: 'Quantité', numeric: true, render: (value) => value || 0 },
        ];
    }
  }, [filters.reportType]);

  const paginatedData = useMemo(() => 
    reportData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [reportData, page, rowsPerPage]
  );

  // Données pour le graphique (exemple simple)
  const chartData = useMemo(() => {
    if (filters.reportType === REPORT_TYPES.DISTRIBUTION && reportData.length > 0) {
      // Agréger les données par site pour un BarChart
      const aggregated: Record<string, number> = {};
      reportData.forEach(row => {
        if (row.site && row.quantite) {
          aggregated[row.site] = (aggregated[row.site] || 0) + row.quantite;
        }
      });
      return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
    }
    if (filters.reportType === REPORT_TYPES.DAILY && reportData.length > 0) {
        // Supposons que 'reportData' pour DAILY a { date: string, count: number }
        return reportData.map(row => ({ name: formatDate(row.date), value: row.count || 0 }));
    }
    if (filters.reportType === REPORT_TYPES.AGE && reportData.length > 0) {
        // Supposons que 'reportData' pour AGE a { ageGroup: string, count: number }
        return reportData.map(row => ({ name: row.ageGroup, value: row.count || 0 }));
    }
    return [];
  }, [reportData, filters.reportType]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Typography variant="body1" color="textSecondary" textAlign="center">
          Pas de données pour afficher le graphique pour ce type de rapport.
        </Typography>
      );
    }

    // Trouver la valeur maximale pour dimensionner les barres correctement
    const maxValue = Math.max(...chartData.map(item => item.value));

    return (
      <Box sx={{ width: '100%', height: 300, overflowX: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          {filters.reportType === REPORT_TYPES.AGE ? 'Distribution par âge' : 
           filters.reportType === REPORT_TYPES.DAILY ? 'Distributions quotidiennes' : 
           'Distribution par site'}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chartData.map((item, index) => (
            <Box key={index} sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: 120, mr: 2 }}>
                  {item.name}
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(item.value / maxValue) * 100} 
                    color={filters.reportType === REPORT_TYPES.DAILY ? "secondary" : "primary"}
                    sx={{ 
                      height: 20, 
                      borderRadius: 1,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ ml: 2, minWidth: 50, textAlign: 'right' }}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            * Les valeurs sont représentées proportionnellement à la valeur maximale ({maxValue})
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom component="h1">
          Rapports Unifiés
        </Typography>

        <Paper elevation={3} sx={{ p: {xs: 1, sm: 2, md: 3}, mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Filtres
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                name="startDate"
                label="Date de début"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Date de début" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                name="endDate"
                label="Date de fin"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Date de fin" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={loadingSites}>
                <InputLabel id="site-label">Site</InputLabel>
                <Select
                  labelId="site-label"
                  name="siteId"
                  value={filters.siteId}
                  onChange={handleFilterChange as (event: SelectChangeEvent<string>, child: React.ReactNode) => void} // Cast pour Select
                  label="Site"
                  aria-labelledby="site-label"
                >
                  <MenuItem value="">
                    <em>Tous les sites</em>
                  </MenuItem>
                  {sites.map(site => (
                    <MenuItem key={site.id} value={site.id.toString()}>
                      {site.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Type de rapport</InputLabel>
                <Select
                  labelId="report-type-label"
                  name="reportType"
                  value={filters.reportType}
                  onChange={handleFilterChange as (event: SelectChangeEvent<ReportType>, child: React.ReactNode) => void} // Cast pour Select
                  label="Type de rapport"
                  aria-labelledby="report-type-label"
                >
                  <MenuItem value={REPORT_TYPES.DISTRIBUTION}>Distribution par site</MenuItem>
                  <MenuItem value={REPORT_TYPES.DAILY}>Distributions quotidiennes</MenuItem>
                  <MenuItem value={REPORT_TYPES.AGE}>Distribution par âge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateReport}
              disabled={loadingReport || loadingSites}
              fullWidth={window.innerWidth < 600} // Pour le responsive
            >
              {loadingReport ? <CircularProgress size={24} color="inherit" /> : 'Générer le rapport'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={exportToExcel}
              disabled={reportData.length === 0 || loadingReport}
              fullWidth={window.innerWidth < 600} // Pour le responsive
            >
              Exporter en Excel
            </Button>
          </Box>

          {loadingReport ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Chargement du rapport...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          ) : reportData.length === 0 && !loadingReport ? ( // Afficher seulement si pas en chargement
             <Alert severity="info" sx={{ my: 2 }}>
                {filters.startDate && filters.endDate ? "Aucune donnée à afficher pour les filtres sélectionnés. Veuillez ajuster vos filtres ou vérifier les données sources." : "Veuillez sélectionner les filtres et générer un rapport."}
            </Alert>
          ) : reportData.length > 0 ? (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table stickyHeader aria-label="rapport détaillé">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell key={column.id.toString()} align={column.numeric ? 'right' : 'left'}>
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow hover key={row.id || index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {columns.map((column) => (
                          <TableCell key={column.id.toString()} align={column.numeric ? 'right' : 'left'}>
                            {column.render ? column.render(row[column.id], row) : row[column.id] ?? 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={reportData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page :"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
              />
            </>
          ) : null}
        </Paper>

        {reportData.length > 0 && !loadingReport && (
          <Paper elevation={3} sx={{ p: {xs: 1, sm: 2, md: 3}, mt: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Visualisation Graphique
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
             {renderChart()}
            </Box>
          </Paper>
        )}
      </Box>
    </PageTransition>
  );
};

export default UnifiedReport;