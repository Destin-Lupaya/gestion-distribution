import { useState, useEffect } from 'react';
import { testConnection } from '../config/database';
import { Alert, Box, CircularProgress } from '@mui/material';

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Error testing database connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2}>
      {isConnected ? (
        <Alert severity="success">
          Base de données connectée avec succès
        </Alert>
      ) : (
        <Alert severity="error">
          Erreur de connexion à la base de données
        </Alert>
      )}
    </Box>
  );
}
