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
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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

interface BeneficiaireSearchProps {
  onSelectBeneficiaire?: (beneficiaire: Beneficiaire) => void;
}

const BeneficiaireSearch: React.FC<BeneficiaireSearchProps> = ({ onSelectBeneficiaire }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Beneficiaire[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/beneficiaires/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        setError('Aucun bénéficiaire trouvé');
      }
    } catch (err) {
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
    if (onSelectBeneficiaire) {
      onSelectBeneficiaire(beneficiaire);
    }
  };

  return (
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
                    '&:hover': { bgcolor: '#90caf9' }
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

      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="body2">
          Veuillez taper juste le numéro d'ordre du bénéficiaires ou soit son nom complet
        </Typography>
      </Box>
    </Paper>
  );
};

export default BeneficiaireSearch;
