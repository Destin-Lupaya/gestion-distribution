import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import apiRoutes from './routes';
import * as path from 'path';
import * as fs from 'fs/promises';

dotenv.config();

const app = express();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// Initialize database
async function initializeDatabase() {
  try {
    // Create database and tables
    const connection = await mysql.createConnection({
      ...dbConfig,
      database: undefined // Connect without database to create it
    });

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    
    try {
      const schema = await fs.readFile(schemaPath, 'utf8');

      // Execute schema
      console.log('Creating database if not exists...');
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      
      console.log('Using database...');
      await connection.query(`USE ${dbConfig.database}`);
      
      // Split schema into separate statements and execute each one
      const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.query(statement);
      }
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error reading or executing schema:', error);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Test database connection
async function testDbConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', );

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  try {
    testDbConnection().then(dbConnected => {
      if (dbConnected) {
        return res.status(200).json({ status: 'ok', message: 'Server is healthy, database connected' });
      } else {
        return res.status(500).json({ status: 'error', message: 'Database connection failed' });
      }
    }).catch(error => {
      console.error('Health check error:', error);
      return res.status(500).json({ status: 'error', message: 'Health check failed' });
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Initialize server with error handling
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start the server
    const PORT = parseInt(process.env.PORT || '3001', 10);
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
}

// Start the server
console.log('Initializing server...');
startServer().catch(error => {
  console.error('Unhandled error during server startup:', error);
  process.exit(1);
});

export default app;
