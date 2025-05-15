import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import wfpLogo from '../assets/wfp-logo.svg';

const HeroSection = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundImage: 'linear-gradient(rgba(0, 105, 170, 0.9), rgba(0, 105, 170, 0.75))',
  color: '#fff',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const NavHeader = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 4),
  backgroundColor: theme.palette.primary.main,
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10,
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
}));

const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <NavHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={wfpLogo} alt="WFP Logo" style={{ height: 40, marginRight: 16 }} />
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: '1.5rem'
            }}
          >
            GESTION DISTRIBUTION
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="secondary" 
          component={Link} 
          to="/login"
          sx={{ 
            fontWeight: 600, 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }
          }}
        >
          Se Connecter
        </Button>
      </NavHeader>

      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Système de Gestion des Distributions
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, fontWeight: 400, opacity: 0.9 }}>
            Une plateforme complète pour gérer efficacement les distributions d'aide alimentaire et non alimentaire
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            onClick={() => navigate('/login')}
            sx={{ 
              py: 1.5, 
              px: 4, 
              fontWeight: 600, 
              fontSize: '1.1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
              }
            }}
          >
            Commencer une distribution
          </Button>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 6, textAlign: 'center' }}>
          Fonctionnalités principales
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardMedia
                component="img"
                height="140"
                image="https://www.wfp.org/sites/default/files/styles/large/public/images/publication/2022-04/WFP-0000137214.jpg?itok=Hl7Wd3Nq"
                alt="Enregistrement des bénéficiaires"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Enregistrement des bénéficiaires
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enregistrez facilement les bénéficiaires avec leurs informations démographiques et créez des listes de distribution.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardMedia
                component="img"
                height="140"
                image="https://www.wfp.org/sites/default/files/styles/large/public/images/publication/2022-05/WFP-0000139284.jpg?itok=Rg4Fh4Ux"
                alt="Gestion des distributions"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Gestion des distributions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Planifiez, exécutez et suivez les distributions d'aide alimentaire et non alimentaire de manière efficace.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardMedia
                component="img"
                height="140"
                image="https://www.wfp.org/sites/default/files/styles/large/public/images/publication/2022-04/WFP-0000137221.jpg?itok=LJYSdVKn"
                alt="Suivi et rapports"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Suivi et rapports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Générez des rapports détaillés et suivez les indicateurs clés de performance pour améliorer l'efficacité des opérations.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>
      
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4, mt: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                Prêt à commencer?
              </Typography>
              <Typography variant="body1">
                Connectez-vous pour accéder à toutes les fonctionnalités de la plateforme.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                component={Link}
                to="/login"
                sx={{ 
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }
                }}
              >
                Se Connecter
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicHomePage;
