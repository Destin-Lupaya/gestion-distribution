"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Configuration de l'API
// Utiliser une approche compatible avec la configuration TypeScript actuelle
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const API_CONFIG = {
    BASE_URL: API_URL,
    ENDPOINTS: {
        HEALTH: '/api/health',
        SITES: '/api/sites',
        REGISTER_BENEFICIARY: '/api/register-beneficiary',
        REGISTER_DISTRIBUTION: '/api/register-distribution',
        PROCESS_QR_SCAN: '/api/process-qr-scan',
        RECORD_SIGNATURE: '/api/record-signature',
        SUGGEST_MAPPING: '/api/suggest-mapping',
        VALIDATE_DATA: '/api/validate-data',
        IMPORT: '/api/import',
        DISTRIBUTION_STATS: '/api/distribution-stats',
        GET_DISTRIBUTIONS: '/api/distributions',
        GET_BENEFICIARIES: '/api/beneficiaries'
    }
};
exports.default = API_CONFIG;
//# sourceMappingURL=api.js.map