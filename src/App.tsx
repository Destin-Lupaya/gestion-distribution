import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, ThemeProvider } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import ImportList from './components/ImportList';
import SignatureCollection from './components/SignatureCollection';
import DistributionReport from './components/DistributionReport';
import QRTester from './components/QRTester';
import TestParser from './components/TestParser';
import DataGridView from './components/DataGrid';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Container maxWidth="lg">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<ImportList />} />
                <Route path="/signatures" element={<SignatureCollection />} />
                <Route path="/report" element={<DistributionReport />} />
                <Route path="/qr-test" element={<QRTester />} />
                <Route path="/test-parser" element={<TestParser />} />
                <Route path="/data" element={<DataGridView />} />
              </Routes>
            </AnimatePresence>
          </Container>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;