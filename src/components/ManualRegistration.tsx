import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
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

export default function ManualRegistration() {
  const [formData, setFormData] = useState<BeneficiaryData>({
    site_name: '',
    household_id: '',
    token_number: '',
    beneficiary_count: 0,
    first_name: '',
    middle_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'beneficiary_count' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrCode(null);
    setSuccess(false);

    // Valider les champs obligatoires
    if (!formData.site_name || !formData.household_id || !formData.token_number) {
      setError('Veuillez remplir tous les champs obligatoires');
      toast.error('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    try {
      // Transformer les données pour correspondre au format attendu par l'API
      // et s'assurer qu'aucune valeur n'est undefined
      const apiData = {
        // Champs requis par l'API de nutrition
        numero_enregistrement: formData.token_number || '',
        nom_enfant: formData.first_name ? `${formData.first_name} ${formData.last_name || ''}`.trim() : '',
        nom_mere: formData.alternate_recipient || '',
        age_mois: 0, // Valeur par défaut
        sexe: 'M', // Valeur par défaut
        province: '',
        territoire: '',
        partenaire: '',
        village: formData.site_address || '',
        site_cs: formData.site_name || ''
      };

      console.log('Données envoyées à l\'API:', apiData);

      // Utiliser l'URL correcte de l'API
      const response = await fetch('http://localhost:3001/api/nutrition/register-beneficiary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors de l\'enregistrement');
      }

      // Générer un QR code avec les informations du bénéficiaire
      const qrData = JSON.stringify({
        id: result.beneficiaire_id,
        token: formData.token_number,
        name: `${formData.first_name} ${formData.last_name || ''}`.trim()
      });

      setQrCode(qrData);
      setSuccess(true);
      toast.success('Bénéficiaire enregistré avec succès');
    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Enregistrement Manuel de Bénéficiaire
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Bénéficiaire enregistré avec succès
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
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </Box>
      </form>

      {qrCode && (
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Code QR généré
          </Typography>
          <QRCodeSVG value={qrCode} size={200} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Scannez ce code QR pour identifier le bénéficiaire
          </Typography>
        </Box>
      )}
    </Paper>
  );
}