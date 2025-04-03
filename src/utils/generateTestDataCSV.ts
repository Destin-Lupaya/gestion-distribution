import { faker } from '@faker-js/faker/locale/fr';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Household {
  site_name: string;
  household_id: string;
  token_number: string;
  beneficiary_count: number;
  first_name: string;
  middle_name: string;
  last_name: string;
}

function generateTestData(count = 100): Household[] {
  const sites = ['Kinshasa', 'Goma', 'Bukavu', 'Lubumbashi', 'Kisangani'];
  const data: Household[] = [];

  for (let i = 0; i < count; i++) {
    const household: Household = {
      site_name: faker.helpers.arrayElement(sites),
      household_id: faker.string.uuid(),
      token_number: faker.string.numeric(6),
      beneficiary_count: faker.number.int({ min: 1, max: 10 }),
      first_name: faker.person.firstName(),
      middle_name: faker.helpers.maybe(() => faker.person.firstName(), { probability: 0.3 }) || '',
      last_name: faker.person.lastName()
    };
    data.push(household);
  }

  return data;
}

function generateCSV(count = 100): void {
  const data = generateTestData(count);
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(household => 
    Object.values(household)
      .map(value => typeof value === 'string' ? `"${value}"` : value)
      .join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const filePath = join(__dirname, '..', '..', 'data', 'test_data.csv');
  
  try {
    writeFileSync(filePath, csv, 'utf-8');
    console.log(`CSV file generated at: ${filePath}`);
  } catch (error) {
    console.error(`Error writing CSV file: ${error}`);
  }
}

// Générer le fichier CSV avec 100 enregistrements
generateCSV(100);
