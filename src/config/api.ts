// Configuration de l'API
const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
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

export default API_CONFIG;
