import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Container,
  Paper,
  Alert,
  Button
} from '@mui/material';
import QRScanner from '../components/qr/QRScanner';
import SignatureCollection from '../components/signature/SignatureCollection';
import { useDistribution } from '../hooks/useDistribution';

const steps = ['Scanner QR Code', 'Sélection des Articles', 'Signature'];

export const Distribution: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const {
    loading,
    error,
    scanResult,
    currentDistribution,
    validateQRCode,
    completeDistribution,
    reset
  } = useDistribution();

  const handleQRResult = async (result: string) => {
    await validateQRCode(result);
    if (!error) {
      setActiveStep(1);
    }
  };

  const handleDistributionComplete = async (result: any) => {
    await completeDistribution(result.signature, result.items);
    if (!error) {
      setActiveStep(2);
    }
  };

  const handleReset = () => {
    reset();
    setActiveStep(0);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <QRScanner onResult={handleQRResult} />;
      case 1:
        return scanResult ? (
          <SignatureCollection onComplete={handleDistributionComplete} />
        ) : null;
      case 2:
        return currentDistribution ? (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribution Complétée
            </Typography>
            <Typography>
              Ménage: {currentDistribution.household}
            </Typography>
            <Typography>
              Articles distribués:
            </Typography>
            <Box component="ul">
              {currentDistribution.items.map((item, index) => (
                <Box component="li" key={index}>
                  {item.nom}: {item.quantite} {item.unite}
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ mt: 2 }}
            >
              Nouvelle Distribution
            </Button>
          </Paper>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Distribution d'Aide
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Box>
    </Container>
  );
};

export default Distribution;
