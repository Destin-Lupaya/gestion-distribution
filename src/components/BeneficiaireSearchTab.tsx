import React, { useState } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

interface Beneficiaire {
  household_id: string;
  nom_du_menage: string;
  token_number: string;
  recipient_id: string;
  prenom: string;
  deuxieme_nom: string | null;
  nom: string;
  nom_complet: string;
  site_de_distribution: string;
  site_id: string;
  adresse: string;
}

interface BeneficiaireSearchTabProps {
  onBeneficiaireSelect?: (beneficiaire: any) => void;
}

const BeneficiaireSearchTab: React.FC<BeneficiaireSearchTabProps> = ({ onBeneficiaireSelect }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Beneficiaire[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<Beneficiaire | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Recherche de bénéficiaires avec le terme:', searchQuery);
      
      // Utiliser le service API centralisé pour effectuer la recherche
      const data = await apiService.get('/api/beneficiaires/search', { query: searchQuery }, 15000);
      
      console.log('Données reçues:', data);
      setSearchResults(data);
      
      if (data.length === 0) {
        setError('Aucun bénéficiaire trouvé');
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (beneficiaire: Beneficiaire) => {
    setSelectedBeneficiaire(beneficiaire);
  };

  const handleConfirmSelection = () => {
    if (!selectedBeneficiaire) {
      toast.error('Veuillez sélectionner un bénéficiaire');
      return;
    }

    if (onBeneficiaireSelect) {
      // Convertir le bénéficiaire au format attendu par le composant parent
      const formattedBeneficiaire = {
        site_name: selectedBeneficiaire.site_de_distribution,
        household_id: selectedBeneficiaire.household_id,
        household_name: selectedBeneficiaire.nom_du_menage,
        token_number: selectedBeneficiaire.token_number,
        beneficiary_count: 1,
        first_name: selectedBeneficiaire.prenom,
        middle_name: selectedBeneficiaire.deuxieme_nom || '',
        last_name: selectedBeneficiaire.nom,
        site_address: selectedBeneficiaire.adresse || '',
        alternate_recipient: ''
      };
      
      onBeneficiaireSelect(formattedBeneficiaire);
      toast.success('Bénéficiaire sélectionné');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom align="center">
          FILTRE DES BENEFICIAIRES
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 2, minWidth: '100px' }}>
            Recherche :
          </Typography>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Entrez un numéro de token ou un nom de bénéficiaire"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {searchResults.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2, bgcolor: '#e3f2fd' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>CP</TableCell>
                  <TableCell>FDP</TableCell>
                  <TableCell>Site de Distribution</TableCell>
                  <TableCell>Adresse</TableCell>
                  <TableCell>Nom du Ménage</TableCell>
                  <TableCell>Token Number</TableCell>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>№</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((beneficiaire, index) => (
                  <TableRow 
                    key={index}
                    hover
                    onClick={() => handleRowClick(beneficiaire)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:nth-of-type(odd)': { bgcolor: '#bbdefb' },
                      '&:hover': { bgcolor: '#90caf9' },
                      ...(selectedBeneficiaire?.household_id === beneficiaire.household_id ? { bgcolor: '#64b5f6' } : {})
                    }}
                  >
                    <TableCell>WVI</TableCell>
                    <TableCell>{beneficiaire.site_de_distribution}</TableCell>
                    <TableCell>{beneficiaire.site_de_distribution}</TableCell>
                    <TableCell>{beneficiaire.adresse}</TableCell>
                    <TableCell>{beneficiaire.nom_du_menage}</TableCell>
                    <TableCell>{beneficiaire.token_number}</TableCell>
                    <TableCell>{beneficiaire.nom_complet}</TableCell>
                    <TableCell>{index + 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedBeneficiaire && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirmSelection}
            >
              Sélectionner ce bénéficiaire
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="body2">
            Veuillez taper juste le numéro d'ordre du bénéficiaires ou soit son nom complet
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default BeneficiaireSearchTab;
