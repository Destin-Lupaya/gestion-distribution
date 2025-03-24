import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'json2csv';
faker.locale = 'fr';

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
    const site_name = faker.helpers.arrayElement(sites);
    const household_id = `HH${faker.number.int({ min: 1000, max: 9999 })}`;
    const token_number = `TK${faker.number.int({ min: 10000, max: 99999 })}`;
    
    data.push({
      site_name,
      household_id,
      token_number,
      beneficiary_count: faker.number.int({ min: 1, max: 10 }),
      first_name: faker.person.firstName(),
      middle_name: faker.person.firstName(),
      last_name: faker.person.lastName()
    });
  }

  return data;
}

function generateCSV(count = 100): void {
  const data = generateTestData(count);
  const fields = [
    'site_name',
    'household_id',
    'token_number',
    'beneficiary_count',
    'first_name',
    'middle_name',
    'last_name'
  ];
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(data);
  
  const outputPath = join(__dirname, '..', '..', 'data', 'test_data.csv');
  writeFileSync(outputPath, csv);
  console.log(`CSV file generated at: ${outputPath}`);
}

// Générer le fichier CSV avec 100 enregistrements
generateCSV(100);
