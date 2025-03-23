import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
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
import { supabase } from '../lib/supabase';
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
};

interface DistributionStats {
  site_distribution: string;
  distributed_count: number;
  total_count: number;
}

export default function DistributionReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributionData, setDistributionData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  }>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    fetchDistributionData();
  }, []);

  const fetchDistributionData = async () => {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_distribution_stats');

      if (error) {
        console.error('Error fetching stats:', error);
        setError('Erreur lors du chargement des données');
        toast.error('Erreur lors du chargement des données');
        return;
      }

      if (stats) {
        const typedStats = stats as DistributionStats[];
        const labels = typedStats.map(item => item.site_distribution);
        const distributed = typedStats.map(item => item.distributed_count);
        const pending = typedStats.map(item => item.total_count - item.distributed_count);

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
              backgroundColor: 'rgba(255, 159, 64, 0.5)',
            }
          ],
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapport de Distribution
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 400 }}>
                  <Bar options={options} data={distributionData} />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </PageTransition>
  );
}