import mysql from 'mysql2/promise';

// Configuration de la base de données
export const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  user: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  database: import.meta.env.VITE_DB_NAME || 'BenefApp',
  port: parseInt(import.meta.env.VITE_DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Création du pool de connexions
export const pool = mysql.createPool(dbConfig);

// Fonction utilitaire pour exécuter des requêtes
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Fonction pour tester la connexion
export async function testConnection(): Promise<boolean> {
  try {
    await pool.getConnection();
    console.log('Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return false;
  }
}
