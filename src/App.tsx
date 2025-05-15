// React est utilisé implicitement pour les composants JSX
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import ImportList from './components/ImportList';
import ManualRegistration from './components/ManualRegistration';
import SignatureCollection from './components/SignatureCollection';
import UnifiedReport from './components/UnifiedReport';
import QRTester from './components/QRTester';
import TestParser from './components/TestParser';
import DataGridView from './components/DataGrid';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import NutritionRegistration from './components/NutritionRegistration';
import NutritionDistribution from './components/NutritionDistribution';
import PendingDistributions from './components/PendingDistributions';
import HomePage from './components/HomePage';
import PublicHomePage from './components/PublicHomePage';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import Unauthorized from './components/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import BeneficiaireSearch from './pages/BeneficiaireSearch';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Définition des routes avec protection par rôle
const router = createBrowserRouter([
  // Routes publiques
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <PublicHomePage />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'unauthorized',
        element: <Unauthorized />
      },
      // Route catch-all pour les URLs non trouvées
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  },
  // Routes protégées (nécessite authentification)
  {
    path: '/app',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'profile',
        element: <UserProfile />
      },
      // Routes protégées pour les agents de terrain et les agents de distribution
      {
        element: <ProtectedRoute allowedRoles={['field', 'distribution', 'admin', 'manager']} />,
        children: [
          {
            path: 'signatures',
            element: <SignatureCollection />
          },
          {
            path: 'recherche-beneficiaires',
            element: <BeneficiaireSearch />
          },
        ]
      },
      // Routes protégées pour les agents de distribution et les coordinateurs
      {
        element: <ProtectedRoute allowedRoles={['distribution', 'admin', 'manager']} />,
        children: [
          {
            path: 'pending-distributions',
            element: <PendingDistributions />
          },
        ]
      },
      // Routes protégées pour les agents de terrain et les gestionnaires
      {
        element: <ProtectedRoute allowedRoles={['field', 'admin', 'manager']} />,
        children: [
          {
            path: 'manual-registration',
            element: <ManualRegistration />
          },
        ]
      },
      // Routes protégées pour les coordinateurs et administrateurs
      {
        element: <ProtectedRoute allowedRoles={['admin', 'manager', 'monitoring']} />,
        children: [
          {
            path: 'rapport',
            element: <UnifiedReport />
          },
          {
            path: 'import',
            element: <ImportList />
          },
        ]
      },
      // Routes protégées pour les agents de nutrition
      {
        element: <ProtectedRoute allowedRoles={['admin', 'manager', 'field']} />,
        children: [
          {
            path: 'nutrition-registration',
            element: <NutritionRegistration />
          },
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['admin', 'manager', 'distribution']} />,
        children: [
          {
            path: 'nutrition-distribution',
            element: <NutritionDistribution />
          },
        ]
      },
      // Routes protégées pour les administrateurs et les agents de suivi
      {
        element: <ProtectedRoute allowedRoles={['admin', 'monitoring', 'manager']} />,
        children: [
          {
            path: 'data',
            element: <DataGridView rows={[]} columns={[]} />
          },
          {
            path: 'qr-test',
            element: <QRTester />
          },
          {
            path: 'test-parser',
            element: <TestParser />
          },
        ]
      },
      // Route catch-all pour les URLs non trouvées dans la section protégée
      {
        path: '*',
        element: <Navigate to="/app" replace />
      },
    ]
  }
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <RouterProvider router={router} />
          </AnimatePresence>
        </AuthProvider>
      </Box>
    </ThemeProvider>
  );
}

export default App;