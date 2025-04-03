// Ce fichier est maintenant déprécié car nous utilisons une API REST
// Toute la logique de base de données a été déplacée vers le serveur Express

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing connection to:', `${API_BASE_URL}/api/health`);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('API health check failed:', error);
      return false;
    }
    
    console.log('API connection successful');
    return true;
  } catch (error) {
    console.error('API connection error:', error);
    return false;
  }
};
