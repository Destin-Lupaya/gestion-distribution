import React from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Card, CardContent, CardActions } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import Banner from './Banner';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DrawIcon from '@mui/icons-material/Draw';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const FeatureCard = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  borderRadius: '8px',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
}));

const HomePage: React.FC = () => {
  return (
    <Box>
      <Banner 
        title="Système de Gestion des Distributions" 
        subtitle="Une plateforme complète pour gérer efficacement les distributions d'aide alimentaire et non alimentaire"
        buttonText="Commencer une distribution"
        buttonLink="/app/signatures"
      />
      
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, color: 'secondary.main' }}>
          Fonctionnalités principales
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <IconWrapper>
                <DrawIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Collecte de signatures
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Enregistrez les distributions avec des signatures électroniques pour garantir la traçabilité et la conformité.
              </Typography>
              <Button 
                component={Link} 
                to="/app/signatures" 
                variant="outlined" 
                color="primary"
                sx={{ alignSelf: 'flex-start' }}
              >
                Collecter des signatures
              </Button>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <IconWrapper>
                <PendingActionsIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Approbation des distributions
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Examinez et approuvez les distributions en attente pour assurer un contrôle de qualité et une validation appropriée.
              </Typography>
              <Button 
                component={Link} 
                to="/app/pending-distributions" 
                variant="outlined" 
                color="primary"
                sx={{ alignSelf: 'flex-start' }}
              >
                Gérer les approbations
              </Button>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <IconWrapper>
                <AssessmentIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Rapports et analyses
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Générez des rapports détaillés sur les distributions pour suivre les progrès et améliorer la planification.
              </Typography>
              <Button 
                component={Link} 
                to="/app/rapport" 
                variant="outlined" 
                color="primary"
                sx={{ alignSelf: 'flex-start' }}
              >
                Voir les rapports
              </Button>
            </FeatureCard>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, color: 'secondary.main' }}>
            Programmes spécialisés
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RestaurantIcon color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                      Programme de Nutrition
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Gérez les enregistrements et les distributions spécifiques aux programmes de nutrition pour améliorer la santé des bénéficiaires.
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button component={Link} to="/app/nutrition-registration" size="small" color="primary">
                    Enregistrement
                  </Button>
                  <Button component={Link} to="/app/nutrition-distribution" size="small" color="primary">
                    Distribution
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ListAltIcon color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                      Gestion des données
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Importez, visualisez et gérez les données des bénéficiaires et des distributions pour une meilleure organisation.
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button component={Link} to="/" size="small" color="primary">
                    Importation
                  </Button>
                  <Button component={Link} to="/data" size="small" color="primary">
                    Visualisation
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
