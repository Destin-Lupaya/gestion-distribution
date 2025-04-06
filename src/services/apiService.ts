// Service API centralisé pour gérer tous les appels API
import API_CONFIG from '../config/api';

/**
 * Classe de service pour gérer les appels API
 */
class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Méthode pour effectuer un appel GET
   * @param endpoint - L'endpoint API à appeler
   * @param params - Paramètres optionnels de requête
   * @returns La réponse de l'API
   */
  async get(endpoint: string, params?: Record<string, string>) {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }

  /**
   * Méthode pour effectuer un appel POST
   * @param endpoint - L'endpoint API à appeler
   * @param data - Les données à envoyer
   * @returns La réponse de l'API
   */
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }

  /**
   * Méthode pour effectuer un appel PUT
   * @param endpoint - L'endpoint API à appeler
   * @param data - Les données à envoyer
   * @returns La réponse de l'API
   */
  async put(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }

  /**
   * Méthode pour effectuer un appel DELETE
   * @param endpoint - L'endpoint API à appeler
   * @returns La réponse de l'API
   */
  async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }

  /**
   * Méthode pour vérifier la santé du serveur
   * @returns État de santé du serveur
   */
  async checkHealth() {
    return this.get(API_CONFIG.ENDPOINTS.HEALTH);
  }

  /**
   * Méthode pour enregistrer une distribution
   * @param distributionData - Données de la distribution
   * @returns Résultat de l'enregistrement
   */
  async registerDistribution(distributionData: any) {
    return this.post(API_CONFIG.ENDPOINTS.REGISTER_DISTRIBUTION, distributionData);
  }

  /**
   * Méthode pour valider un QR code
   * @param qrData - Données du QR code
   * @returns Résultat de la validation
   */
  async validateQr(qrData: any) {
    return this.post('/api/validate-qr', qrData);
  }

  /**
   * Méthode pour importer des données
   * @param data - Données à importer
   * @returns Résultat de l'importation
   */
  async importData(data: any) {
    return this.post(API_CONFIG.ENDPOINTS.IMPORT, data);
  }
}

// Exporter une instance singleton du service
const apiService = new ApiService();
export default apiService;
