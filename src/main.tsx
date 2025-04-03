// Apply crypto.randomUUID polyfill immediately
(function() {
  if (typeof window !== 'undefined') {
    // Function to generate a UUID v4
    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // Ensure crypto object exists
    if (!window.crypto) {
      Object.defineProperty(window, 'crypto', {
        value: {},
        writable: true,
        configurable: true
      });
    }
    
    // Add randomUUID method directly to crypto
    Object.defineProperty(window.crypto, 'randomUUID', {
      value: uuidv4,
      writable: true,
      configurable: true
    });
    
    // Also add it to the global scope as a fallback
    window.randomUUID = uuidv4;
    
    console.log('crypto.randomUUID polyfill applied from main.tsx');
  }
})();

import React from 'react'
import ReactDOM from 'react-dom/client'
// Import UUID utility early to ensure polyfill is applied
import './utils/uuid.ts'
import App from './App.tsx'
import './index.css'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <App />
      <Toaster position="top-right" />
    </LocalizationProvider>
  </React.StrictMode>,
)