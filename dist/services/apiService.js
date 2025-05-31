"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Service API centralisé pour gérer tous les appels API
const api_1 = __importDefault(require("../config/api"));
/**
 * Classe de service pour gérer les appels API
 */
class ApiService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = api_1.default.BASE_URL;
    }
    /**
     * Méthode pour effectuer un appel GET
     * @param endpoint - L'endpoint API à appeler
     * @param params - Paramètres optionnels de requête
     * @param timeoutMs - Délai d'expiration en millisecondes (par défaut: 10000ms)
     * @returns La réponse de l'API
     */
    async get(endpoint, params, timeoutMs = 10000) {
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
        }
        catch (error) {
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
     * @returns La réponse de l'API
     */
    async post(endpoint, data) {
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
    async put(endpoint, data) {
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
    async delete(endpoint) {
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
        return this.get(api_1.default.ENDPOINTS.HEALTH);
    }
    /**
     * Méthode pour enregistrer une distribution
     * @param distributionData - Données de la distribution
     * @returns Résultat de l'enregistrement
     */
    async registerDistribution(distributionData) {
        return this.post(api_1.default.ENDPOINTS.REGISTER_DISTRIBUTION, distributionData);
    }
    /**
     * Méthode pour valider un QR code
     * @param qrData - Données du QR code
     * @returns Résultat de la validation
     */
    async validateQr(qrData) {
        return this.post('/api/validate-qr', qrData);
    }
    /**
     * Méthode pour importer des données
     * @param data - Données à importer
     * @returns Résultat de l'importation
     */
    async importData(data) {
        return this.post(api_1.default.ENDPOINTS.IMPORT, data);
    }
    /**
     * Méthode pour récupérer les distributions
     * @returns Liste des distributions
     */
    async getDistributions() {
        return this.get(api_1.default.ENDPOINTS.GET_DISTRIBUTIONS);
    }
    /**
     * Méthode pour approuver une distribution
     * @param distributionId - ID de la distribution à approuver
     * @returns Résultat de l'approbation
     */
    async approveDistribution(distributionId) {
        return this.put(`/api/distributions/${distributionId}/approve`, {});
    }
    /**
     * Méthode pour annuler une distribution
     * @param distributionId - ID de la distribution à annuler
     * @returns Résultat de l'annulation
     */
    async cancelDistribution(distributionId) {
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
exports.default = apiService;
//# sourceMappingURL=apiService.js.map