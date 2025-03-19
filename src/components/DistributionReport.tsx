import { useState } from 'react';
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
  Tooltip
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedLocalite, setSelectedLocalite] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const localites = ['Toutes les localités', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];
  const statuts = ['Tous les statuts', 'Déplacés', 'Retournés'];

  // Données pour le graphique de distribution par statut
  const statusChartData = {
    labels: ['Déplacés', 'Retournés'],
    datasets: [
      {
        label: 'Nombre de ménages',
        data: [65, 35],
        backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique de tonnage
  const tonnageChartData = {
    labels: ['Distribué', 'Restant'],
    datasets: [
      {
        data: [75, 25],
        backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 206, 86, 0.5)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Données exemple pour les tableaux
  const absenteesList = [
    { id: '001', nom: 'Diallo', prenom: 'Amadou', localite: 'Zone A', raison: 'Non localisé' },
    { id: '002', nom: 'Touré', prenom: 'Fatima', localite: 'Zone B', raison: 'Déplacé' },
    { id: '003', nom: 'Koné', prenom: 'Ibrahim', localite: 'Zone C', raison: 'Malade' },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(16);
    doc.text('Rapport de Distribution PAM', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Période: ${startDate?.format('DD/MM/YYYY')} - ${endDate?.format('DD/MM/YYYY')}`, 20, 30);
    
    // Statistiques globales
    doc.text('Statistiques Globales:', 20, 40);
    doc.text(`Total Ménages: 250`, 30, 50);
    doc.text(`Total Bénéficiaires: 1250`, 30, 60);
    doc.text(`Taux de Distribution: 95%`, 30, 70);
    doc.text(`Tonnage Total: 25T`, 30, 80);
    
    // Liste des absents
    doc.text('Liste des Absents:', 20, 100);
    const absentsData = absenteesList.map(absent => [
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
          <Tooltip title="Exporter en PDF">
            <IconButton onClick={exportToPDF} color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filtrer">
            <IconButton color="primary">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <div className="space-y-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Rapports de Distribution
      </Typography>

      <FilterBar />

      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
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
                <Typography variant="h6">Total Ménages</Typography>
                <Typography variant="h3">250</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Bénéficiaires</Typography>
                <Typography variant="h3">1250</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Taux de Distribution</Typography>
                <Typography variant="h3">95%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Tonnage Total</Typography>
                <Typography variant="h3">25T</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper className="p-4 mt-4">
          <Typography variant="h6" gutterBottom>
            Détails de la Distribution
          </Typography>
          <Typography variant="body1">
            • Période: {startDate?.format('DD/MM/YYYY')} - {endDate?.format('DD/MM/YYYY')}
          </Typography>
          <Typography variant="body1">
            • Localités couvertes: 5
          </Typography>
          <Typography variant="body1">
            • Ration par personne: 12.5 kg
          </Typography>
        </Paper>
      </TabPanel>

      {/* Distribution par Ménages */}
      <TabPanel value={tabValue} index={1}>
        <Paper className="p-4">
          <Typography variant="h6" gutterBottom>
            Distribution par Statut des Ménages
          </Typography>
          <Bar data={statusChartData} />
          
          <Box mt={4}>
            <Typography variant="body1">
              • Nombre total de ménages: 250
            </Typography>
            <Typography variant="body1">
              • Ménages déplacés: 162 (65%)
            </Typography>
            <Typography variant="body1">
              • Ménages retournés: 88 (35%)
            </Typography>
          </Box>
        </Paper>
      </TabPanel>

      {/* Bénéficiaires */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Bénéficiaires par Catégorie</Typography>
                <Box height={300}>
                  <Bar
                    data={{
                      labels: ['Enfants', 'Adultes', 'Personnes âgées'],
                      datasets: [{
                        label: 'Nombre de bénéficiaires',
                        data: [450, 650, 150],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.5)',
                          'rgba(54, 162, 235, 0.5)',
                          'rgba(255, 206, 86, 0.5)'
                        ],
                      }]
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Statistiques</Typography>
                <Box mt={2}>
                  <Typography variant="body1">
                    • Total bénéficiaires: 1250
                  </Typography>
                  <Typography variant="body1">
                    • Moyenne par ménage: 5 personnes
                  </Typography>
                  <Typography variant="body1">
                    • Taux de présence: 95%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Absents */}
      <TabPanel value={tabValue} index={3}>
        <Paper className="p-4">
          <Typography variant="h6" gutterBottom>
            Liste des Absents
          </Typography>
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
                {absenteesList.map((absent) => (
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
        </Paper>
      </TabPanel>

      {/* Tonnage */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">État du Tonnage</Typography>
                <Box height={300}>
                  <Pie data={tonnageChartData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Détails du Tonnage</Typography>
                <Box mt={2}>
                  <Typography variant="body1">
                    • Tonnage total prévu: 100T
                  </Typography>
                  <Typography variant="body1">
                    • Tonnage distribué: 75T
                  </Typography>
                  <Typography variant="body1">
                    • Tonnage restant: 25T
                  </Typography>
                  <Typography variant="body1">
                    • Taux de distribution: 75%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </div>
  );
}

export default DistributionReport;