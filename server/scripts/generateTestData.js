const { faker } = require('@faker-js/faker');
faker.locale = 'fr';

function generateTestData(count = 100) {
  const sites = ['Kinshasa', 'Goma', 'Bukavu', 'Lubumbashi', 'Kisangani'];
  const data = [];

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
      last_name: faker.person.lastName(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    });
  }

  return data;
}

module.exports = generateTestData;
