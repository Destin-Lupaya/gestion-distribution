// React est utilisé implicitement pour les composants JSX
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import ImportList from './components/ImportList';
import ManualRegistration from './components/ManualRegistration';
import SignatureCollection from './components/SignatureCollection';
import UnifiedReport from './components/UnifiedReport';
import QRTester from './components/QRTester';
import TestParser from './components/TestParser';
import DataGridView from './components/DataGrid';
import Layout from './components/Layout';
import NutritionRegistration from './components/NutritionRegistration';
import NutritionDistribution from './components/NutritionDistribution';
import PendingDistributions from './components/PendingDistributions';
import HomePage from './components/HomePage';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';

// Create router with v7 features enabled
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <HomePage />
        },
        {
          path: 'import',
          element: <ImportList />
        },
        {
          path: 'manual-registration',
          element: <ManualRegistration />
        },
        {
          path: 'signatures',
          element: <SignatureCollection />
        },
        {
          path: 'rapport',
          element: <UnifiedReport />
        },
        {
          path: 'qr-test',
          element: <QRTester />
        },
        {
          path: 'test-parser',
          element: <TestParser />
        },
        {
          path: 'data',
          element: <DataGridView rows={[]} columns={[]} />
        },
        {
          path: 'nutrition-registration',
          element: <NutritionRegistration />
        },
        {
          path: 'nutrition-distribution',
          element: <NutritionDistribution />
        },
        {
          path: 'pending-distributions',
          element: <PendingDistributions />
        }
      ]
    }
  ]
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          <RouterProvider router={router} />
        </AnimatePresence>
      </Box>
    </ThemeProvider>
  );
}

export default App;