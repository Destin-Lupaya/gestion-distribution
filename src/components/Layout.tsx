import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="App">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Layout;
