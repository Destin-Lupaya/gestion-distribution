import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Avatar, 
  Divider, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Button,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';

// Traduction des rôles en français
const roleTranslations: Record<string, string> = {
  'admin': 'Administrateur Système',
  'manager': 'Coordinateur de Programme',
  'field': 'Agent de Terrain',
  'distribution': 'Agent de Distribution',
  'logistics': 'Gestionnaire de Stock',
  'monitoring': 'Agent de Suivi et Évaluation',
  'partner': 'Point Focal Partenaire',
  'clerk': 'Opérateur de Saisie'
};

// Traduction des permissions en français et groupement par catégorie
const permissionCategories: Record<string, { title: string, icon: React.ReactNode }> = {
  'user': { title: 'Gestion des utilisateurs', icon: <PersonIcon /> },
  'role': { title: 'Gestion des rôles', icon: <BadgeIcon /> },
  'system': { title: 'Configuration système', icon: <SecurityIcon /> },
  'audit': { title: 'Audit', icon: <VpnKeyIcon /> },
  'program': { title: 'Gestion des programmes', icon: <SecurityIcon /> },
  'distribution': { title: 'Gestion des distributions', icon: <SecurityIcon /> },
  'beneficiary': { title: 'Gestion des bénéficiaires', icon: <PersonIcon /> },
  'household': { title: 'Gestion des ménages', icon: <PersonIcon /> },
  'signature': { title: 'Collecte de signatures', icon: <SecurityIcon /> },
  'stock': { title: 'Gestion des stocks', icon: <SecurityIcon /> },
  'inventory': { title: 'Gestion des inventaires', icon: <SecurityIcon /> },
  'dispatch': { title: 'Gestion des expéditions', icon: <SecurityIcon /> },
  'report': { title: 'Rapports', icon: <SecurityIcon /> },
  'survey': { title: 'Enquêtes', icon: <SecurityIcon /> },
  'exception': { title: 'Gestion des exceptions', icon: <SecurityIcon /> },
  'data': { title: 'Saisie de données', icon: <SecurityIcon /> }
};

const permissionTranslations: Record<string, string> = {
  'create': 'Créer',
  'read': 'Consulter',
  'update': 'Modifier',
  'delete': 'Supprimer',
  'assign': 'Assigner',
  'configure': 'Configurer',
  'backup': 'Sauvegarder',
  'plan': 'Planifier',
  'approve': 'Approuver',
  'cancel': 'Annuler',
  'execute': 'Exécuter',
  'validate': 'Valider',
  'collect': 'Collecter',
  'handle': 'Gérer',
  'generate': 'Générer',
  'entry': 'Saisir'
};

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  backgroundColor: theme.palette.primary.main,
  fontSize: '2.5rem',
  marginRight: theme.spacing(3),
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
}));

const RoleChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  fontWeight: 600,
  padding: theme.spacing(0.5, 0),
  height: 32,
}));

const PermissionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.primary.light}`,
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: '#FFFFFF',
  },
}));

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  // Organiser les permissions par catégorie
  const permissionsByCategory: Record<string, string[]> = {};
  
  user.permissions?.forEach(permission => {
    const [category, action] = permission.split(':');
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push(action);
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <ProfileHeader>
          <ProfileAvatar>{user.name.charAt(0)}</ProfileAvatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" color="text.secondary">
                @{user.username}
              </Typography>
              <RoleChip label={roleTranslations[user.role] || user.role} />
            </Box>
          </Box>
        </ProfileHeader>

        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Permissions
          </Typography>

          <Grid container spacing={3}>
            {Object.entries(permissionsByCategory).map(([category, actions]) => (
              <Grid item xs={12} md={6} key={category}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 2,
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      color: 'primary.main'
                    }}
                  >
                    {permissionCategories[category]?.title || category}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {actions.map(action => (
                      <PermissionChip 
                        key={`${category}:${action}`}
                        label={permissionTranslations[action] || action}
                        size="small"
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{ px: 3, py: 1 }}
            >
              Se déconnecter
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserProfile;
