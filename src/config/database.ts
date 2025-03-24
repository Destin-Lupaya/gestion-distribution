// Ce fichier est maintenant déprécié car nous utilisons une API REST
// Toute la logique de base de données a été déplacée vers le serveur Express

export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    console.error('API connection error:', error);
    return false;
  }
};
