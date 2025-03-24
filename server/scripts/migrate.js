const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });

  try {
    // Créer la base de données si elle n'existe pas
    await connection.query('CREATE DATABASE IF NOT EXISTS gestion_distribution');
    await connection.query('USE gestion_distribution');

    // Créer la table households avec la nouvelle structure
    await connection.query(`
      CREATE TABLE IF NOT EXISTS households (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_name VARCHAR(255) NOT NULL,
        household_id VARCHAR(255) NOT NULL,
        token_number VARCHAR(50) NOT NULL,
        beneficiary_count INT NOT NULL DEFAULT 0,
        first_name VARCHAR(255) NOT NULL DEFAULT '',
        middle_name VARCHAR(255) NOT NULL DEFAULT '',
        last_name VARCHAR(255) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_token (token_number),
        UNIQUE KEY unique_household (site_name, household_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
