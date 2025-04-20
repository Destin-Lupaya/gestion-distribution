"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbOperations = void 0;
exports.getConnection = getConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const uuid_1 = require("uuid");
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_distribution',
    port: parseInt(process.env.DB_PORT || '3306', 10)
};
// Initialize the database connection
async function getConnection() {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        return connection;
    }
    catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}
// Helper functions for database operations
exports.dbOperations = {
    // Sites Distribution
    async createSite(id, nom, adresse) {
        const conn = await getConnection();
        try {
            await conn.execute('INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)', [id, nom, adresse]);
        }
        finally {
            await conn.end();
        }
    },
    async getSites() {
        const conn = await getConnection();
        try {
            const [rows] = await conn.execute('SELECT * FROM sites');
            return rows;
        }
        finally {
            await conn.end();
        }
    },
    // Menages
    async createMenage(id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires) {
        const conn = await getConnection();
        try {
            await conn.execute('INSERT INTO menages (id, household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)', [id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires]);
        }
        finally {
            await conn.end();
        }
    },
    async getMenages() {
        const conn = await getConnection();
        try {
            const [rows] = await conn.execute(`
        SELECT m.*, s.nom as site_nom, s.adresse as site_adresse 
        FROM menages m 
        LEFT JOIN sites s ON m.site_distribution_id = s.id
      `);
            return rows;
        }
        finally {
            await conn.end();
        }
    },
    async deleteMenage(id) {
        const conn = await getConnection();
        try {
            await conn.execute('DELETE FROM menages WHERE id = ?', [id]);
        }
        finally {
            await conn.end();
        }
    },
    // Beneficiaires
    async createBeneficiaire(id, menageId, firstName, middleName, lastName, estPrincipal) {
        const conn = await getConnection();
        try {
            await conn.execute('INSERT INTO beneficiaires (id, menage_id, first_name, middle_name, last_name, est_principal) VALUES (?, ?, ?, ?, ?, ?)', [id, menageId, firstName, middleName, lastName, estPrincipal]);
        }
        finally {
            await conn.end();
        }
    },
    async getBeneficiaires() {
        const conn = await getConnection();
        try {
            const [rows] = await conn.execute(`
        SELECT b.*, m.nom_menage, m.token_number, s.nom as site_nom
        FROM beneficiaires b
        LEFT JOIN menages m ON b.menage_id = m.id
        LEFT JOIN sites s ON m.site_distribution_id = s.id
      `);
            return rows;
        }
        finally {
            await conn.end();
        }
    },
    // Import data transaction
    async importHouseholdData(siteNom, siteAdresse, householdId, nomMenage, tokenNumber, nombreBeneficiaires, recipientFirstName, recipientMiddleName, recipientLastName, nomSuppleant) {
        const conn = await getConnection();
        try {
            await conn.beginTransaction();
            // Create or get site
            const siteId = (0, uuid_1.v4)();
            const [sites] = await conn.execute('SELECT id FROM sites WHERE nom = ? AND adresse = ?', [
                siteNom,
                siteAdresse,
            ]);
            const site = sites[0];
            if (!site) {
                await conn.execute('INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)', [siteId, siteNom, siteAdresse]);
            }
            // Create menage
            const menageId = (0, uuid_1.v4)();
            await conn.execute('INSERT INTO menages (id, household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)', [menageId, householdId, nomMenage, tokenNumber, site ? site.id : siteId, nombreBeneficiaires]);
            // Create principal beneficiaire
            const beneficiaireId = (0, uuid_1.v4)();
            await conn.execute('INSERT INTO beneficiaires (id, menage_id, first_name, middle_name, last_name, est_principal) VALUES (?, ?, ?, ?, ?, true)', [beneficiaireId, menageId, recipientFirstName, recipientMiddleName, recipientLastName]);
            // Create suppleant if exists
            if (nomSuppleant) {
                const suppleantId = (0, uuid_1.v4)();
                const [firstName, ...rest] = nomSuppleant.split(' ');
                const lastName = rest.join(' ');
                await conn.execute('INSERT INTO beneficiaires (id, menage_id, first_name, last_name, est_principal) VALUES (?, ?, ?, ?, false)', [suppleantId, menageId, firstName, lastName]);
            }
            await conn.commit();
        }
        catch (error) {
            await conn.rollback();
            throw error;
        }
        finally {
            await conn.end();
        }
    },
};
//# sourceMappingURL=db.js.map