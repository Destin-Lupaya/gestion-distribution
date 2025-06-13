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
  CardMedia,
  Avatar,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import wfpLogo from '../assets/wfp-logo.svg';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';

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
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid rgba(0, 105, 170, 0.12)',
  boxShadow: '0 6px 16px rgba(0, 105, 170, 0.08)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 32px rgba(0, 105, 170, 0.15)',
  },
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  width: 70,
  height: 70,
  margin: '0 auto',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  boxShadow: '0 8px 16px rgba(0, 105, 170, 0.2)',
  '& .MuiSvgIcon-root': {
    fontSize: 35,
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

      <Box sx={{ py: 10, background: 'linear-gradient(to bottom, #f9f9ff, #ffffff)' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              mb: 2, 
              textAlign: 'center',
              position: 'relative',
              display: 'inline-block',
              left: '50%',
              transform: 'translateX(-50%)',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '10%',
                width: '80%',
                height: 4,
                backgroundColor: 'primary.main',
                borderRadius: 2
              }
            }}
          >
            Fonctionnalités principales
          </Typography>

          <Box sx={{ maxWidth: '700px', mx: 'auto', mb: 6 }}>
            <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mt: 2 }}>
              Une suite complète d'outils pour optimiser vos processus de distribution et améliorer l'impact de vos programmes d'assistance
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                  <FeatureIcon>
                    <PersonAddIcon />
                  </FeatureIcon>
                </Box>
                <CardContent sx={{ textAlign: 'center', pt: 0 }}>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 600, mb: 2 }}>
                    Enregistrement des bénéficiaires
                  </Typography>
                  <Divider sx={{ mb: 2, width: '40%', mx: 'auto' }} />
                  <Typography variant="body1" color="text.secondary" sx={{ px: 1 }}>
                    Enregistrez facilement les bénéficiaires avec leurs informations démographiques et créez des listes de distribution.
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                  <FeatureIcon>
                    <ReceiptLongIcon />
                  </FeatureIcon>
                </Box>
                <CardContent sx={{ textAlign: 'center', pt: 0 }}>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 600, mb: 2 }}>
                    Gestion des distributions
                  </Typography>
                  <Divider sx={{ mb: 2, width: '40%', mx: 'auto' }} />
                  <Typography variant="body1" color="text.secondary" sx={{ px: 1 }}>
                    Planifiez, exécutez et suivez les distributions d'aide alimentaire et non alimentaire de manière efficace.
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                  <FeatureIcon>
                    <AssessmentIcon />
                  </FeatureIcon>
                </Box>
                <CardContent sx={{ textAlign: 'center', pt: 0 }}>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 600, mb: 2 }}>
                    Suivi et rapports
                  </Typography>
                  <Divider sx={{ mb: 2, width: '40%', mx: 'auto' }} />
                  <Typography variant="body1" color="text.secondary" sx={{ px: 1 }}>
                    Générez des rapports détaillés et suivez les indicateurs clés de performance pour améliorer l'efficacité des opérations.
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
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
