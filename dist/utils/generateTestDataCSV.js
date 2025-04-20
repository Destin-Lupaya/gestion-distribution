"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fr_1 = require("@faker-js/faker/locale/fr");
const fs_1 = require("fs");
const path_1 = require("path");
function generateTestData(count = 100) {
    const sites = ['Kinshasa', 'Goma', 'Bukavu', 'Lubumbashi', 'Kisangani'];
    const data = [];
    for (let i = 0; i < count; i++) {
        const household = {
            site_name: fr_1.faker.helpers.arrayElement(sites),
            household_id: fr_1.faker.string.uuid(),
            token_number: fr_1.faker.string.numeric(6),
            beneficiary_count: fr_1.faker.number.int({ min: 1, max: 10 }),
            first_name: fr_1.faker.person.firstName(),
            middle_name: fr_1.faker.helpers.maybe(() => fr_1.faker.person.firstName(), { probability: 0.3 }) || '',
            last_name: fr_1.faker.person.lastName()
        };
        data.push(household);
    }
    return data;
}
function generateCSV(count = 100) {
    const data = generateTestData(count);
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(household => Object.values(household)
        .map(value => typeof value === 'string' ? `"${value}"` : value)
        .join(','));
    const csv = [headers, ...rows].join('\n');
    const filePath = (0, path_1.join)(__dirname, '..', '..', 'data', 'test_data.csv');
    try {
        (0, fs_1.writeFileSync)(filePath, csv, 'utf-8');
        console.log(`CSV file generated at: ${filePath}`);
    }
    catch (error) {
        console.error(`Error writing CSV file: ${error}`);
    }
}
// Générer le fichier CSV avec 100 enregistrements
generateCSV(100);
//# sourceMappingURL=generateTestDataCSV.js.map