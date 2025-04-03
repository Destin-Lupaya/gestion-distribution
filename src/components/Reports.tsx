import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import Chart from 'chart.js/auto';

interface ChartData {
  labels: string[];
  data: number[];
}

const Reports: React.FC = () => {
  const beneficiaryChartRef = useRef<HTMLCanvasElement | null>(null);
  const distributionChartRef = useRef<HTMLCanvasElement | null>(null);
  const ageGroupChartRef = useRef<HTMLCanvasElement | null>(null);

  // Données simulées (à remplacer par les vraies données de votre API)
  const beneficiaryData: ChartData = {
    labels: ['Hommes', 'Femmes', 'Enfants', 'Personnes âgées'],
    data: [250, 300, 180, 120]
  };

  const distributionData: ChartData = {
    labels: ['Nourriture', 'Médicaments', 'Vêtements', 'Matériel scolaire', 'Kits d\'hygiène'],
    data: [450, 280, 200, 150, 320]
  };

  const ageGroupData: ChartData = {
    labels: ['0-14 ans', '15-24 ans', '25-44 ans', '45-64 ans', '65+ ans'],
    data: [150, 200, 280, 180, 90]
  };

  useEffect(() => {
    // Graphique des bénéficiaires
    if (beneficiaryChartRef.current) {
      new Chart(beneficiaryChartRef.current, {
        type: 'pie',
        data: {
          labels: beneficiaryData.labels,
          datasets: [{
            data: beneficiaryData.data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Répartition des Bénéficiaires'
            }
          }
        }
      });
    }

    // Graphique de distribution d'aide
    if (distributionChartRef.current) {
      new Chart(distributionChartRef.current, {
        type: 'bar',
        data: {
          labels: distributionData.labels,
          datasets: [{
            label: 'Quantité distribuée',
            data: distributionData.data,
            backgroundColor: '#36A2EB'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribution par Type d\'Aide'
            }
          }
        }
      });
    }

    // Graphique des groupes d'âge
    if (ageGroupChartRef.current) {
      new Chart(ageGroupChartRef.current, {
        type: 'line',
        data: {
          labels: ageGroupData.labels,
          datasets: [{
            label: 'Nombre de bénéficiaires',
            data: ageGroupData.data,
            borderColor: '#FF6384',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribution par Groupe d\'Âge'
            }
          }
        }
      });
    }
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Rapports de Distribution d'Aide Humanitaire
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <canvas ref={beneficiaryChartRef}></canvas>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <canvas ref={distributionChartRef}></canvas>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <canvas ref={ageGroupChartRef}></canvas>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
