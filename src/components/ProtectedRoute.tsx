import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  requiredPermissions 
}) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Vérification de l'authentification...
        </Typography>
      </Box>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'utilisateur a les rôles requis
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier si l'utilisateur a les permissions requises
  if (requiredPermissions && requiredPermissions.some(permission => !hasPermission(permission))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si toutes les vérifications sont passées, afficher les composants enfants
  return <Outlet />;
};

export default ProtectedRoute;
