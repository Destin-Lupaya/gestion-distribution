const mysql = require('mysql2/promise');
const generateTestData = require('./generateTestData');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion_distribution'
  });

  try {
    // Générer les données de test
    const testData = generateTestData(100);

    // Insérer les données dans la table households
    for (const household of testData) {
      await connection.query(
        `INSERT INTO households (
          site_name, household_id, token_number, beneficiary_count,
          first_name, middle_name, last_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          household.site_name,
          household.household_id,
          household.token_number,
          household.beneficiary_count,
          household.first_name,
          household.middle_name,
          household.last_name
        ]
      );
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
