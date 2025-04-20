"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestData = generateTestData;
const fr_1 = require("@faker-js/faker/locale/fr");
function generateTestData(count = 100) {
    const sites = ['Kinshasa', 'Goma', 'Bukavu', 'Lubumbashi', 'Kisangani'];
    const data = [];
    for (let i = 0; i < count; i++) {
        const site_name = fr_1.faker.helpers.arrayElement(sites);
        const household_id = `HH${fr_1.faker.number.int({ min: 1000, max: 9999 })}`;
        const token_number = `TK${fr_1.faker.number.int({ min: 10000, max: 99999 })}`;
        data.push({
            site_name,
            household_id,
            token_number,
            beneficiary_count: fr_1.faker.number.int({ min: 1, max: 10 }),
            first_name: fr_1.faker.person.firstName(),
            middle_name: fr_1.faker.person.firstName(),
            last_name: fr_1.faker.person.lastName(),
            created_at: fr_1.faker.date.past(),
            updated_at: fr_1.faker.date.recent()
        });
    }
    return data;
}
//# sourceMappingURL=generateTestData.js.map