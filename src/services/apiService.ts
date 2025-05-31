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
   * @param timeoutMs - Délai d'expiration en millisecondes (par défaut: 10000ms)
   * @returns La réponse de l'API
   */
  async get(endpoint: string, params?: Record<string, string>, timeoutMs: number = 10000) {
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
    
    // Implémenter un timeout pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`API Call: GET ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      // Annuler le timeout car la requête a réussi
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`API Response: GET ${url} - Status: ${response.status} - Time: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      // Annuler le timeout en cas d'erreur
      clearTimeout(timeoutId);
      
      // Gérer spécifiquement les erreurs d'abandon
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API Timeout: GET ${url} - Request aborted after ${timeoutMs}ms`);
        throw new Error(`La requête a pris trop de temps et a été annulée. Veuillez réessayer.`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`API Error: GET ${url} - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Méthode pour effectuer un appel POST
   * @param endpoint - L'endpoint API à appeler
   * @param data - Les données à envoyer
   * @param timeoutMs - Délai d'expiration en millisecondes (par défaut: 10000ms)
   * @returns La réponse de l'API
   */
  async post(endpoint: string, data: any, timeoutMs: number = 10000) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Implémenter un timeout pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`API Call: POST ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      // Annuler le timeout car la requête a réussi
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`API Response: POST ${url} - Status: ${response.status} - Time: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        // Si la réponse n'est pas OK, vérifier si c'est du HTML ou du JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlContent = await response.text();
          console.error(`API Error: Received HTML instead of JSON`, htmlContent.substring(0, 200) + '...');
          throw new Error(`API Error: ${response.status} ${response.statusText} - Received HTML instead of JSON`);
        } else {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error(`API Error: Failed to parse JSON response`, jsonError);
        const textContent = await response.text();
        console.error(`Raw response:`, textContent.substring(0, 200) + '...');
        throw new Error(`API Error: Failed to parse JSON response - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
      }
    } catch (error: unknown) {
      // Annuler le timeout en cas d'erreur
      clearTimeout(timeoutId);
      
      // Gérer spécifiquement les erreurs d'abandon
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API Timeout: POST ${url} - Request aborted after ${timeoutMs}ms`);
        throw new Error(`La requête a pris trop de temps et a été annulée. Veuillez réessayer.`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`API Error: POST ${url} - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Méthode pour effectuer un appel PUT
   * @param endpoint - L'endpoint API à appeler
   * @param data - Les données à envoyer
   * @param timeoutMs - Délai d'expiration en millisecondes (par défaut: 10000ms)
   * @returns La réponse de l'API
   */
  async put(endpoint: string, data: any, timeoutMs: number = 10000) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Implémenter un timeout pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`API Call: PUT ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      // Annuler le timeout car la requête a réussi
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`API Response: PUT ${url} - Status: ${response.status} - Time: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        // Si la réponse n'est pas OK, vérifier si c'est du HTML ou du JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlContent = await response.text();
          console.error(`API Error: Received HTML instead of JSON`, htmlContent.substring(0, 200) + '...');
          throw new Error(`API Error: ${response.status} ${response.statusText} - Received HTML instead of JSON`);
        } else {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error(`API Error: Failed to parse JSON response`, jsonError);
        const textContent = await response.text();
        console.error(`Raw response:`, textContent.substring(0, 200) + '...');
        throw new Error(`API Error: Failed to parse JSON response - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
      }
    } catch (error: unknown) {
      // Annuler le timeout en cas d'erreur
      clearTimeout(timeoutId);
      
      // Gérer spécifiquement les erreurs d'abandon
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API Timeout: PUT ${url} - Request aborted after ${timeoutMs}ms`);
        throw new Error(`La requête a pris trop de temps et a été annulée. Veuillez réessayer.`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`API Error: PUT ${url} - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Méthode pour effectuer un appel DELETE
   * @param endpoint - L'endpoint API à appeler
   * @param timeoutMs - Délai d'expiration en millisecondes (par défaut: 10000ms)
   * @returns La réponse de l'API
   */
  async delete(endpoint: string, timeoutMs: number = 10000) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Implémenter un timeout pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`API Call: DELETE ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      // Annuler le timeout car la requête a réussi
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`API Response: DELETE ${url} - Status: ${response.status} - Time: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        // Si la réponse n'est pas OK, vérifier si c'est du HTML ou du JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlContent = await response.text();
          console.error(`API Error: Received HTML instead of JSON`, htmlContent.substring(0, 200) + '...');
          throw new Error(`API Error: ${response.status} ${response.statusText} - Received HTML instead of JSON`);
        } else {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      }
      
      // Pour les requêtes DELETE, la réponse peut être vide
      if (response.headers.get('content-length') === '0') {
        return { success: true };
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error(`API Error: Failed to parse JSON response`, jsonError);
        const textContent = await response.text();
        if (!textContent) {
          // Si la réponse est vide, on considère que c'est un succès
          return { success: true };
        }
        console.error(`Raw response:`, textContent.substring(0, 200) + '...');
        throw new Error(`API Error: Failed to parse JSON response - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
      }
    } catch (error: unknown) {
      // Annuler le timeout en cas d'erreur
      clearTimeout(timeoutId);
      
      // Gérer spécifiquement les erreurs d'abandon
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API Timeout: DELETE ${url} - Request aborted after ${timeoutMs}ms`);
        throw new Error(`La requête a pris trop de temps et a été annulée. Veuillez réessayer.`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`API Error: DELETE ${url} - ${errorMessage}`);
      throw error;
    }
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

  /**
   * Méthode pour récupérer les distributions
   * @returns Liste des distributions
   */
  async getDistributions() {
    return this.get(API_CONFIG.ENDPOINTS.GET_DISTRIBUTIONS);
  }

  /**
   * Méthode pour approuver une distribution
   * @param distributionId - ID de la distribution à approuver
   * @returns Résultat de l'approbation
   */
  async approveDistribution(distributionId: string) {
    return this.put(`/api/distributions/${distributionId}/approve`, {});
  }

  /**
   * Méthode pour annuler une distribution
   * @param distributionId - ID de la distribution à annuler
   * @returns Résultat de l'annulation
   */
  async cancelDistribution(distributionId: string) {
    return this.put(`/api/distributions/${distributionId}/cancel`, {});
  }

  /**
   * Méthode pour récupérer les distributions en attente
   * @returns Liste des distributions en attente
   */
  async getPendingDistributions() {
    return this.get('/api/distributions/pending');
  }
}

// Exporter une instance singleton du service
const apiService = new ApiService();
export default apiService;
