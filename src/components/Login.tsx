import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import wfpLogo from '../assets/wfp-logo.svg';

const LoginContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(2),
  background: '#f8f9fa',
}));

const LoginHeader = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 0),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.primary.main,
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10,
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 450,
  padding: 0,
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
}));

const LoginCardHeader = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  position: 'relative',
}));

const LoginForm = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.2),
  marginTop: theme.spacing(1),
  fontWeight: 600,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
}));

const FooterText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);

    try {
      // Utiliser le contexte d'authentification pour se connecter
      await login(username, password);
      navigate('/app'); // Redirection vers la page protégée après authentification
    } catch (err) {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
      console.error('Erreur de connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginContainer maxWidth={false}>
      <LoginHeader>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={wfpLogo} alt="WFP Logo" style={{ height: 40, marginRight: 16 }} />
            <Typography variant="h6" component="div" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
              GESTION DISTRIBUTION
            </Typography>
          </Box>
        </Container>
      </LoginHeader>

      <LoginCard>
        <LoginCardHeader>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: '#212121' }}>
            Se connecter
          </Typography>
        </LoginCardHeader>

        <LoginForm component="form" onSubmit={handleLogin}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <StyledTextField
            fullWidth
            label="Nom d'utilisateur"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
            placeholder="Entrez votre nom d'utilisateur"
          />

          <StyledTextField
            fullWidth
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            placeholder="Entrez votre mot de passe"
          />

          <LoginButton
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </LoginButton>

          <FooterText variant="body2">
            Vous n'avez pas de compte?{' '}
            <Link href="#" underline="hover" sx={{ fontWeight: 600 }}>
              Contactez votre administrateur
            </Link>
          </FooterText>
        </LoginForm>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
