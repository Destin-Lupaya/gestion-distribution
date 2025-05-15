import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          textAlign: 'center',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'error.main' }}>
          Accès non autorisé
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {user && (
            <Box component="span" sx={{ display: 'block', mt: 1 }}>
              Vous êtes connecté en tant que <strong>{user.name}</strong> avec le rôle <strong>{user.role}</strong>.
            </Box>
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate(-1)}
            sx={{ px: 3, py: 1 }}
          >
            Retour
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            sx={{ px: 3, py: 1 }}
          >
            Aller à l'accueil
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
