import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Grid
} from '@mui/material';

interface DistributionReport {
  date: string;
  location: string;
  beneficiaries: number;
  itemsDistributed: {
    type: string;
    quantity: number;
  }[];
}

const DetailedReports: React.FC = () => {
  // Données simulées (à remplacer par les vraies données de votre API)
  const reports: DistributionReport[] = [
    {
      date: '2025-03-31',
      location: 'Centre Communautaire A',
      beneficiaries: 150,
      itemsDistributed: [
        { type: 'Nourriture', quantity: 300 },
        { type: 'Kits d\'hygiène', quantity: 150 },
        { type: 'Médicaments', quantity: 75 }
      ]
    },
    {
      date: '2025-03-30',
      location: 'École B',
      beneficiaries: 200,
      itemsDistributed: [
        { type: 'Matériel scolaire', quantity: 400 },
        { type: 'Nourriture', quantity: 200 },
        { type: 'Vêtements', quantity: 100 }
      ]
    }
  ];

  const calculateTotalBeneficiaries = () => {
    return reports.reduce((total, report) => total + report.beneficiaries, 0);
  };

  const calculateTotalItems = () => {
    return reports.reduce((total, report) => {
      return total + report.itemsDistributed.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Rapports Détaillés des Distributions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Résumé Global</Typography>
            <Typography>Total des bénéficiaires: {calculateTotalBeneficiaries()}</Typography>
            <Typography>Total des articles distribués: {calculateTotalItems()}</Typography>
            <Typography>Nombre de distributions: {reports.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell>Bénéficiaires</TableCell>
              <TableCell>Articles Distribués</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report, index) => (
              <TableRow key={index}>
                <TableCell>{report.date}</TableCell>
                <TableCell>{report.location}</TableCell>
                <TableCell>{report.beneficiaries}</TableCell>
                <TableCell>
                  {report.itemsDistributed.map((item, i) => (
                    <div key={i}>
                      {item.type}: {item.quantity} unités
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DetailedReports;
