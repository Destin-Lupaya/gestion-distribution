/**
 * Configuration d'environnement unifiée qui fonctionne à la fois côté serveur et côté client
 */

// Détecter si nous sommes dans un environnement navigateur
const isBrowser = typeof window !== 'undefined';

// Fonction pour obtenir les variables d'environnement de manière sécurisée
export function getEnv(key: string, defaultValue: string = ''): string {
  if (isBrowser) {
    // Dans le navigateur, utiliser import.meta.env (Vite)
    return (import.meta.env as any)[key] || defaultValue;
  } else {
    // Sur le serveur, utiliser process.env
    return (process?.env as any)[key] || defaultValue;
  }
}

// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: getEnv('VITE_API_URL', 'http://localhost:3001'),
  PORT: parseInt(getEnv('PORT', '3001'), 10),
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

// Configuration de la base de données
export const DB_CONFIG = {
  host: getEnv('DB_HOST', 'localhost'),
  user: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASSWORD', ''),
  database: getEnv('DB_NAME', 'gestion_distribution'),
  port: parseInt(getEnv('DB_PORT', '3306'), 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
