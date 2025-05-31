// Ce fichier est maintenant déprécié car nous utilisons une API REST
// Toute la logique de base de données a été déplacée vers le serveur Express

// Importer la configuration d'environnement unifiée
import { API_CONFIG } from './environment';

// Utiliser la configuration unifiée qui fonctionne à la fois côté serveur et côté client
const API_BASE_URL = API_CONFIG.BASE_URL;

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
