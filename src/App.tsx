import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, Container } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import ImportList from './components/ImportList';
import SignatureCollection from './components/SignatureCollection';
import DistributionReport from './components/DistributionReport';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <AnimatePresence mode="wait">
            <Container maxWidth="xl" sx={{ py: 4 }}>
              <Routes>
                <Route path="/" element={<ImportList />} />
                <Route path="/signatures" element={<SignatureCollection />} />
                <Route path="/rapport" element={<DistributionReport />} />
              </Routes>
            </Container>
          </AnimatePresence>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;