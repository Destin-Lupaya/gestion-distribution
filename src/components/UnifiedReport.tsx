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
  Snackbar
} from '@mui/material';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';

interface ReportFilters {
  startDate: string;
  endDate: string;
  siteId: string;
  reportType: 'distribution' | 'daily' | 'age';
}

const UnifiedReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    siteId: '',
    reportType: 'distribution'
  });
  
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chartRefs = {
    ageGroup: useRef<HTMLCanvasElement | null>(null),
    distribution: useRef<HTMLCanvasElement | null>(null),
    daily: useRef<HTMLCanvasElement | null>(null)
  };
  
  const chartInstancesRef = useRef<{[key: string]: Chart | null}>({
    ageGroup: null,
    distribution: null,
    daily: null
  });

  useEffect(() => {
    // Charger la liste des sites
    const loadSites = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sites');
        const data = await response.json();
        setSites(data);
      } catch (error) {
        setError('Erreur lors du chargement des sites');
      }
    };
    loadSites();

    // Initialize charts
    initializeCharts();

    // Cleanup charts on component unmount
    return () => {
      Object.values(chartInstancesRef.current).forEach(chart => chart?.destroy());
    };
  }, []);

  const initializeCharts = () => {
    // Initialize age group chart
    if (chartRefs.ageGroup.current && !chartInstancesRef.current.ageGroup) {
      chartInstancesRef.current.ageGroup = new Chart(chartRefs.ageGroup.current, {
        type: 'bar',
        data: {
          labels: ['0-14 ans', '15-24 ans', '25-44 ans', '45-64 ans', '65+ ans'],
          datasets: [{
            label: 'Distribution par âge',
            data: [],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribution par groupe d\'âge'
            }
          }
        }
      });
    }

    // Initialize distribution chart
    if (chartRefs.distribution.current && !chartInstancesRef.current.distribution) {
      chartInstancesRef.current.distribution = new Chart(chartRefs.distribution.current, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribution par site'
            }
          }
        }
      });
    }

    // Initialize daily chart
    if (chartRefs.daily.current && !chartInstancesRef.current.daily) {
      chartInstancesRef.current.daily = new Chart(chartRefs.daily.current, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Distributions quotidiennes',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distributions quotidiennes'
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    if (!filters.startDate || !filters.endDate) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.siteId && { siteId: filters.siteId })
      });

      let endpoint = '';
      switch (filters.reportType) {
        case 'distribution':
          endpoint = '/api/reports/distribution';
          break;
        case 'daily':
          endpoint = '/api/reports/daily';
          break;
        case 'age':
          endpoint = '/api/reports/age';
          break;
      }

      const response = await fetch(`http://localhost:3001${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      const data = await response.json();
      setReportData(data);
      updateCharts(data);
    } catch (error) {
      setError('Erreur lors du chargement des données du rapport');
    } finally {
      setLoading(false);
    }
  };

  const updateCharts = (data: any[]) => {
    switch (filters.reportType) {
      case 'age':
        if (chartInstancesRef.current.ageGroup) {
          const ageData = {
            labels: ['0-14 ans', '15-24 ans', '25-44 ans', '45-64 ans', '65+ ans'],
            data: [
              data.reduce((sum, item) => sum + item.children_0_14, 0),
              data.reduce((sum, item) => sum + item.youth_15_24, 0),
              data.reduce((sum, item) => sum + item.adults_25_44, 0),
              data.reduce((sum, item) => sum + item.adults_45_64, 0),
              data.reduce((sum, item) => sum + item.elderly_65_plus, 0)
            ]
          };
          chartInstancesRef.current.ageGroup.data.labels = ageData.labels;
          chartInstancesRef.current.ageGroup.data.datasets[0].data = ageData.data;
          chartInstancesRef.current.ageGroup.update();
        }
        break;
      
      case 'distribution':
        if (chartInstancesRef.current.distribution) {
          const distributionData = {
            labels: data.map(item => item.site_name),
            data: data.map(item => item.total_distributions)
          };
          chartInstancesRef.current.distribution.data.labels = distributionData.labels;
          chartInstancesRef.current.distribution.data.datasets[0].data = distributionData.data;
          chartInstancesRef.current.distribution.update();
        }
        break;
      
      case 'daily':
        if (chartInstancesRef.current.daily) {
          const dailyData = {
            labels: data.map(item => formatDate(item.date)),
            data: data.map(item => item.total_distributions)
          };
          chartInstancesRef.current.daily.data.labels = dailyData.labels;
          chartInstancesRef.current.daily.data.datasets[0].data = dailyData.data;
          chartInstancesRef.current.daily.update();
        }
        break;
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    const reportTypes = {
      distribution: 'Distribution',
      daily: 'Journalier',
      age: 'Ages'
    };
    const fileName = `Rapport_${reportTypes[filters.reportType]}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Rapport Global de Distribution d'Aide Humanitaire
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type de Rapport</InputLabel>
              <Select
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value as ReportFilters['reportType'] })}
              >
                <MenuItem value="distribution">Distribution</MenuItem>
                <MenuItem value="daily">Journalier</MenuItem>
                <MenuItem value="age">Par Âge</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              label="Date de début"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              label="Date de fin"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Site</InputLabel>
              <Select
                value={filters.siteId}
                onChange={(e) => setFilters({ ...filters, siteId: e.target.value as string })}
              >
                <MenuItem value="">Tous les sites</MenuItem>
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box mb={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
              disabled={reportData.length === 0}
            >
              Exporter en Excel
            </Button>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12}>
              {filters.reportType === 'age' && (
                <canvas ref={chartRefs.ageGroup} />
              )}
              {filters.reportType === 'distribution' && (
                <canvas ref={chartRefs.distribution} />
              )}
              {filters.reportType === 'daily' && (
                <canvas ref={chartRefs.daily} />
              )}
            </Grid>
            
            {reportData.length > 0 && (
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {Object.keys(reportData[0]).map((key) => (
                          <TableCell key={key}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <TableCell key={i}>
                              {typeof value === 'string' && value.includes('T') 
                                ? formatDate(value) 
                                : value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default UnifiedReport;
