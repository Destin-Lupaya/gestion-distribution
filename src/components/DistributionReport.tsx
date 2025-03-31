import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { PageTransition } from './PageTransition';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Distribution par Site',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
};

interface DistributionData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

export default function DistributionReport() {
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDistributionData();
  }, []);

  const fetchDistributionData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/distribution-stats');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const stats = await response.json();

      if (stats && Array.isArray(stats)) {
        const labels = stats.map(item => item.site_distribution);
        const distributed = stats.map(item => item.distributed_count);
        const pending = stats.map(item => item.total_count - item.distributed_count);

        setDistributionData({
          labels,
          datasets: [
            {
              label: 'Distribué',
              data: distributed,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
              label: 'En attente',
              data: pending,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapport de Distribution
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {distributionData && <Bar options={options} data={distributionData} />}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </PageTransition>
  );
}