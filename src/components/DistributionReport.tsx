import { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { typedSupabase } from '../lib/supabase';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ReportData {
  totalMenages: number;
  totalBeneficiaires: number;
  tauxDistribution: number;
  tonnageTotal: number;
  distributionParStatut: {
    deplaces: number;
    retournes: number;
  };
  distributionParCategorie: {
    enfants: number;
    adultes: number;
    personnesAgees: number;
  };
  tonnageDistribue: number;
  tonnageRestant: number;
  absents: Array<{
    id: string;
    nom: string;
    prenom: string;
    localite: string;
    raison: string;
  }>;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function DistributionReport() {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedLocalite, setSelectedLocalite] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, selectedLocalite, selectedStatut]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [
        { data: menages, error: menagesError },
        { data: distributions, error: distributionsError },
        { data: beneficiaires, error: beneficiairesError }
      ] = await Promise.all([
        typedSupabase
          .from('menages')
          .select('*, sites_distribution!inner(*)'),
        typedSupabase
          .from('distributions')
          .select('*')
          .gte('date_distribution', startDate?.toISOString())
          .lte('date_distribution', endDate?.toISOString()),
        typedSupabase
          .from('beneficiaires')
          .select('*')
      ]);

      if (menagesError) throw menagesError;
      if (distributionsError) throw distributionsError;
      if (beneficiairesError) throw beneficiairesError;

      // Calculate statistics
      const totalMenages = menages?.length || 0;
      const totalBeneficiaires = menages?.reduce((sum, m) => sum + m.nombre_beneficiaires, 0) || 0;
      const distributionsCount = distributions?.length || 0;
      const tauxDistribution = totalMenages > 0 ? (distributionsCount / totalMenages) * 100 : 0;

      // Assuming 50kg per beneficiary for tonnage calculation
      const tonnageParBeneficiaire = 0.05; // 50kg = 0.05 tonnes
      const tonnageTotal = totalBeneficiaires * tonnageParBeneficiaire;
      const tonnageDistribue = distributionsCount * tonnageParBeneficiaire;

      // Mock data for demonstration (replace with real data when available)
      const reportData: ReportData = {
        totalMenages,
        totalBeneficiaires,
        tauxDistribution,
        tonnageTotal,
        distributionParStatut: {
          deplaces: Math.round(totalMenages * 0.65),
          retournes: Math.round(totalMenages * 0.35)
        },
        distributionParCategorie: {
          enfants: Math.round(totalBeneficiaires * 0.35),
          adultes: Math.round(totalBeneficiaires * 0.55),
          personnesAgees: Math.round(totalBeneficiaires * 0.10)
        },
        tonnageDistribue,
        tonnageRestant: tonnageTotal - tonnageDistribue,
        absents: [
          { id: '001', nom: 'Diallo', prenom: 'Amadou', localite: 'Zone A', raison: 'Non localisé' },
          { id: '002', nom: 'Touré', prenom: 'Fatima', localite: 'Zone B', raison: 'Déplacé' },
          { id: '003', nom: 'Koné', prenom: 'Ibrahim', localite: 'Zone C', raison: 'Malade' }
        ]
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const localites = ['Toutes les localités', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];
  const statuts = ['Tous les statuts', 'Déplacés', 'Retournés'];

  const statusChartData = {
    labels: ['Déplacés', 'Retournés'],
    datasets: [
      {
        label: 'Nombre de ménages',
        data: reportData ? [
          reportData.distributionParStatut.deplaces,
          reportData.distributionParStatut.retournes
        ] : [0, 0],
        backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const tonnageChartData = {
    labels: ['Distribué', 'Restant'],
    datasets: [
      {
        data: reportData ? [
          reportData.tonnageDistribue,
          reportData.tonnageRestant
        ] : [0, 0],
        backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 206, 86, 0.5)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(16);
    doc.text('Rapport de Distribution PAM', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Période: ${startDate?.format('DD/MM/YYYY')} - ${endDate?.format('DD/MM/YYYY')}`, 20, 30);
    
    // Statistiques globales
    doc.text('Statistiques Globales:', 20, 40);
    doc.text(`Total Ménages: ${reportData.totalMenages}`, 30, 50);
    doc.text(`Total Bénéficiaires: ${reportData.totalBeneficiaires}`, 30, 60);
    doc.text(`Taux de Distribution: ${reportData.tauxDistribution.toFixed(1)}%`, 30, 70);
    doc.text(`Tonnage Total: ${reportData.tonnageTotal.toFixed(1)}T`, 30, 80);
    
    // Liste des absents
    doc.text('Liste des Absents:', 20, 100);
    const absentsData = reportData.absents.map(absent => [
      absent.id,
      absent.nom,
      absent.prenom,
      absent.localite,
      absent.raison
    ]);
    
    (doc as any).autoTable({
      startY: 110,
      head: [['ID', 'Nom', 'Prénom', 'Localité', 'Raison']],
      body: absentsData,
    });
    
    doc.save('rapport-distribution.pdf');
  };

  const FilterBar = () => (
    <Paper className="p-4 mb-4">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <DatePicker
              label="Date début"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              format="DD/MM/YYYY"
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <DatePicker
              label="Date fin"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              format="DD/MM/YYYY"
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            select
            fullWidth
            label="Localité"
            value={selectedLocalite}
            onChange={(e) => setSelectedLocalite(e.target.value)}
          >
            {localites.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            select
            fullWidth
            label="Statut"
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
          >
            {statuts.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <span>
              <Tooltip title="Exporter en PDF">
                <span>
                  <IconButton 
                    onClick={exportToPDF} 
                    color="primary"
                    disabled={isLoading || !reportData}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </span>
            <span>
              <Tooltip title="Actualiser">
                <span>
                  <IconButton 
                    onClick={fetchReportData} 
                    color="primary"
                    disabled={isLoading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </span>
            <Tooltip title="Filtrer">
              <IconButton color="primary">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Rapports de Distribution
      </Typography>

      <FilterBar />

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': {
            minHeight: 64,
            fontSize: '0.9rem',
            fontWeight: 500
          }
        }}
      >
        <Tab label="Rapport Global" />
        <Tab label="Distribution par Ménages" />
        <Tab label="Bénéficiaires" />
        <Tab label="Absents" />
        <Tab label="Tonnage" />
      </Tabs>

      {/* Rapport Global */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Ménages
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" height={48} />
                ) : (
                  <Typography variant="h3" component="div">
                    {reportData?.totalMenages.toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Bénéficiaires
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" height={48} />
                ) : (
                  <Typography variant="h3" component="div">
                    {reportData?.totalBeneficiaires.toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Taux de Distribution
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" height={48} />
                ) : (
                  <Typography variant="h3" component="div">
                    {reportData?.tauxDistribution.toFixed(1)}%
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Tonnage Total
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" height={48} />
                ) : (
                  <Typography variant="h3" component="div">
                    {reportData?.tonnageTotal.toFixed(1)}T
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper className="p-6 mt-6">
          <Typography variant="h6" gutterBottom>
            Détails de la Distribution
          </Typography>
          {isLoading ? (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </Box>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                • Période: {startDate?.format('DD/MM/YYYY')} - {endDate?.format('DD/MM/YYYY')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                • Localités couvertes: {localites.length - 1}
              </Typography>
              <Typography variant="body1">
                • Ration par personne: 50 kg
              </Typography>
            </>
          )}
        </Paper>
      </TabPanel>

      {/* Distribution par Ménages */}
      <TabPanel value={tabValue} index={1}>
        <Paper className="p-6">
          <Typography variant="h6" gutterBottom>
            Distribution par Statut des Ménages
          </Typography>
          {isLoading ? (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ height: 300 }}>
                <Bar data={statusChartData} />
              </Box>
              
              <Box mt={4}>
                <Typography variant="body1" gutterBottom>
                  • Nombre total de ménages: {reportData?.totalMenages.toLocaleString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  • Ménages déplacés: {reportData?.distributionParStatut.deplaces.toLocaleString()} ({((reportData?.distributionParStatut.deplaces || 0) / (reportData?.totalMenages || 1) * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="body1">
                  • Ménages retournés: {reportData?.distributionParStatut.retournes.toLocaleString()} ({((reportData?.distributionParStatut.retournes || 0) / (reportData?.totalMenages || 1) * 100).toFixed(1)}%)
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </TabPanel>

      {/* Bénéficiaires */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bénéficiaires par Catégorie
                </Typography>
                {isLoading ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box height={300}>
                    <Bar
                      data={{
                        labels: ['Enfants', 'Adultes', 'Personnes âgées'],
                        datasets: [{
                          label: 'Nombre de bénéficiaires',
                          data: [
                            reportData?.distributionParCategorie.enfants,
                            reportData?.distributionParCategorie.adultes,
                            reportData?.distributionParCategorie.personnesAgees
                          ],
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)'
                          ],
                        }]
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques
                </Typography>
                {isLoading ? (
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                  </Box>
                ) : (
                  <Box mt={2}>
                    <Typography variant="body1" gutterBottom>
                      • Total bénéficiaires: {reportData?.totalBeneficiaires.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      • Moyenne par ménage: {(reportData?.totalBeneficiaires || 0) / (reportData?.totalMenages || 1).toFixed(1)} personnes
                    </Typography>
                    <Typography variant="body1">
                      • Taux de présence: {reportData?.tauxDistribution.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Absents */}
      <TabPanel value={tabValue} index={3}>
        <Paper className="p-6">
          <Typography variant="h6" gutterBottom>
            Liste des Absents
          </Typography>
          {isLoading ? (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={200} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Localité</TableCell>
                    <TableCell>Raison</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.absents.map((absent) => (
                    <TableRow key={absent.id}>
                      <TableCell>{absent.id}</TableCell>
                      <TableCell>{absent.nom}</TableCell>
                      <TableCell>{absent.prenom}</TableCell>
                      <TableCell>{absent.localite}</TableCell>
                      <TableCell>{absent.raison}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* Tonnage */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  État du Tonnage
                </Typography>
                {isLoading ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box height={300}>
                    <Pie data={tonnageChartData} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Détails du Tonnage
                </Typography>
                {isLoading ? (
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                  </Box>
                ) : (
                  <Box mt={2}>
                    <Typography variant="body1" gutterBottom>
                      • Tonnage total prévu: {reportData?.tonnageTotal.toFixed(1)}T
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      • Tonnage distribué: {reportData?.tonnageDistribue.toFixed(1)}T
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      • Tonnage restant: {reportData?.tonnageRestant.toFixed(1)}T
                    </Typography>
                    <Typography variant="body1">
                      • Taux de distribution: {((reportData?.tonnageDistribue || 0) / (reportData?.tonnageTotal || 1) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </div>
  );
}

export default DistributionReport;