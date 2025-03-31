import React, { useState, useRef } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import toast from 'react-hot-toast';

interface BeneficiaryData {
  site_name: string;
  household_id: string;
  token_number: string;
  beneficiary_count: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  site_address?: string;
  alternate_recipient?: string;
}

export default function ManualSignature() {
  const [formData, setFormData] = useState<BeneficiaryData>({
    site_name: '',
    household_id: '',
    token_number: '',
    beneficiary_count: 0,
    first_name: '',
    middle_name: '',
    last_name: '',
    site_address: '',
    alternate_recipient: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'beneficiary_count' ? parseInt(value) || 0 : value
    }));
  };

  const handleSignatureComplete = () => {
    if (signaturePadRef.current) {
      const signatureData = signaturePadRef.current.toDataURL();
      setSignature(signatureData);
      setShowSignaturePad(false);
    }
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('Veuillez ajouter une signature');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/register-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          signature
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement');
      }

      toast.success('Distribution enregistrée avec succès');
      // Reset form
      setFormData({
        site_name: '',
        household_id: '',
        token_number: '',
        beneficiary_count: 0,
        first_name: '',
        middle_name: '',
        last_name: '',
        site_address: '',
        alternate_recipient: ''
      });
      setSignature(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Émargement Manuel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom du site"
              name="site_name"
              value={formData.site_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="ID du ménage"
              name="household_id"
              value={formData.household_id}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Numéro de jeton"
              name="token_number"
              value={formData.token_number}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Nombre de bénéficiaires"
              name="beneficiary_count"
              value={formData.beneficiary_count}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              label="Prénom"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Deuxième nom"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              label="Nom"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse du site"
              name="site_address"
              value={formData.site_address}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bénéficiaire alternatif"
              name="alternate_recipient"
              value={formData.alternate_recipient}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowSignaturePad(true)}
            disabled={loading}
          >
            {signature ? 'Modifier la signature' : 'Ajouter une signature'}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !signature}
          >
            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </Box>

        {signature && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <img src={signature} alt="Signature" style={{ maxWidth: 300, border: '1px solid #ccc' }} />
          </Box>
        )}
      </form>

      <Dialog open={showSignaturePad} onClose={() => setShowSignaturePad(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Signature</DialogTitle>
        <DialogContent>
          <Box sx={{ border: '1px solid #ccc', mt: 2 }}>
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                width: 500,
                height: 200,
                style: { width: '100%', height: '200px' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearSignature}>Effacer</Button>
          <Button onClick={() => setShowSignaturePad(false)}>Annuler</Button>
          <Button onClick={handleSignatureComplete} variant="contained" color="primary">
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
