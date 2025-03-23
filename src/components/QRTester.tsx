import React, { useState } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { PageTransition } from './PageTransition';

const testCases = [
  {
    name: 'Valid Household',
    data: { id: 'TEST001' },
    description: 'Should show Famille Diallo details'
  },
  {
    name: 'Another Valid Household',
    data: { id: 'TEST002' },
    description: 'Should show Famille Camara details'
  },
  {
    name: 'Invalid ID Format',
    data: { id: 123 },
    description: 'Should show format error'
  },
  {
    name: 'Missing ID',
    data: { name: 'Test' },
    description: 'Should show missing ID error'
  },
  {
    name: 'Empty Object',
    data: {},
    description: 'Should show invalid QR code error'
  },
  {
    name: 'Non-existent Household',
    data: { id: 'INVALID999' },
    description: 'Should show not found error'
  }
];

const QRTester = () => {
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Test des Codes QR
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Utilisez ces codes QR pour tester la fonctionnalité de scan dans SignatureCollection
        </Typography>

        <Grid container spacing={3}>
          {testCases.map((test, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: selectedTest === index ? 'primary.light' : 'background.paper'
                }}
                onClick={() => setSelectedTest(index)}
                elevation={selectedTest === index ? 8 : 1}
              >
                <Typography variant="h6" gutterBottom>
                  {test.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(JSON.stringify(test.data))}&size=200x200`}
                    alt={`QR Code for ${test.name}`}
                    style={{ width: 200, height: 200 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                  {test.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                  Données: {JSON.stringify(test.data)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Comment Tester
          </Typography>
          <Typography variant="body1" component="div">
            <ol>
              <li>Ouvrez la page SignatureCollection</li>
              <li>Cliquez sur "Scanner un code QR"</li>
              <li>Pointez votre caméra vers l'un des codes QR ci-dessus</li>
              <li>Vérifiez que la gestion des erreurs correspond au comportement attendu</li>
            </ol>
          </Typography>
        </Box>
      </Box>
    </PageTransition>
  );
};

export default QRTester;
