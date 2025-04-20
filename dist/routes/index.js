"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const uuid_1 = require("uuid");
const db_1 = require("../lib/db");
const nutritionRoutes_1 = __importDefault(require("./nutritionRoutes"));
const router = (0, express_1.Router)();
// Mount nutrition routes
router.use('/nutrition', nutritionRoutes_1.default);
// Health check endpoint
router.get('/health', async (_req, res) => {
    try {
        // Test MySQL connection
        const connection = await promise_1.default.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gestion_distribution',
            port: parseInt(process.env.DB_PORT || '3306', 10)
        });
        await connection.ping();
        await connection.end();
        res.status(200).json({
            status: 'ok',
            message: 'Backend server is running and database connection is successful',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: String(error)
        });
    }
});
// Sites endpoints
router.get('/sites', async (_req, res) => {
    try {
        const sites = await db_1.dbOperations.getSites();
        res.status(200).json(sites);
    }
    catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
});
router.post('/sites', async (req, res) => {
    try {
        const { nom, adresse } = req.body;
        const id = (0, uuid_1.v4)();
        await db_1.dbOperations.createSite(id, nom, adresse);
        res.status(201).json({ id, nom, adresse });
    }
    catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Menages endpoints
router.get('/menages', async (_req, res) => {
    try {
        const menages = await db_1.dbOperations.getMenages();
        res.status(200).json(menages);
    }
    catch (error) {
        console.error('Error fetching menages:', error);
        res.status(500).json({ error: String(error) });
    }
});
router.post('/menages', async (req, res) => {
    try {
        const { householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires } = req.body;
        const id = (0, uuid_1.v4)();
        await db_1.dbOperations.createMenage(id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires);
        res.status(201).json({ id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires });
    }
    catch (error) {
        console.error('Error creating menage:', error);
        res.status(500).json({ error: String(error) });
    }
});
router.delete('/menages/:id', async (req, res) => {
    try {
        await db_1.dbOperations.deleteMenage(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting menage:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Beneficiaires endpoints
router.get('/beneficiaires', async (_req, res) => {
    try {
        const beneficiaires = await db_1.dbOperations.getBeneficiaires();
        res.status(200).json(beneficiaires);
    }
    catch (error) {
        console.error('Error fetching beneficiaires:', error);
        res.status(500).json({ error: String(error) });
    }
});
router.post('/beneficiaires', async (req, res) => {
    try {
        const { menageId, firstName, middleName, lastName, estPrincipal } = req.body;
        const id = (0, uuid_1.v4)();
        await db_1.dbOperations.createBeneficiaire(id, menageId, firstName, middleName, lastName, estPrincipal);
        res.status(201).json({ id, menageId, firstName, middleName, lastName, estPrincipal });
    }
    catch (error) {
        console.error('Error creating beneficiaire:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Import data endpoint
router.post('/import', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format. Expected an array of objects.'
            });
        }
        const results = [];
        // Process each row in the data array
        for (const row of data) {
            try {
                // Extract fields from the row data
                // Support multiple possible field names to make the endpoint more flexible
                const siteNom = row.site_name || row.siteNom || '';
                const siteAdresse = row.site_address || row.siteAdresse || '';
                const householdId = row.household_id || row.householdId || '';
                const nomMenage = row.household_name || row.nomMenage || '';
                const tokenNumber = row.token_number || row.tokenNumber || '';
                const nombreBeneficiaires = parseInt(row.beneficiary_count || row.nombreBeneficiaires || '0');
                const recipientFirstName = row.first_name || row.recipientFirstName || '';
                const recipientMiddleName = row.middle_name || row.recipientMiddleName || null;
                const recipientLastName = row.last_name || row.recipientLastName || '';
                const nomSuppleant = row.alternate_recipient || row.nomSuppleant || null;
                // Import the household data
                await db_1.dbOperations.importHouseholdData(siteNom, siteAdresse, householdId, nomMenage, tokenNumber, nombreBeneficiaires, recipientFirstName, recipientMiddleName, recipientLastName, nomSuppleant);
                results.push({
                    success: true,
                    householdId,
                    message: 'Household imported successfully'
                });
            }
            catch (error) {
                console.error('Error importing row:', error);
                results.push({
                    success: false,
                    error: String(error),
                    data: row
                });
            }
        }
        res.status(200).json({
            success: true,
            message: 'Import completed',
            results
        });
    }
    catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({
            success: false,
            error: String(error)
        });
    }
});
// Column mapping suggestion endpoint
router.post('/suggest-mapping', async (req, res) => {
    try {
        const { headers } = req.body;
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid headers format. Expected an array of strings.'
            });
        }
        // Define expected column names and their possible variations
        const columnMappings = {
            'site_name': ['Site', 'Nom du site', 'Site de distribution', 'site_name'],
            'site_address': ['Adresse', 'Adresse du site', 'Address', 'site_address'],
            'household_id': ['household_id', 'Household ID', 'ID Ménage', 'Code Ménage'],
            'household_name': ['household_name', 'Nom du Ménage', 'Ménage', 'Household', 'Nom Menage'],
            'token_number': ['token_number', 'Token', 'Numéro de jeton', 'Jeton'],
            'beneficiary_count': ['beneficiary_count', 'Bénéficiaires', 'Nombre de bénéficiaires', 'Beneficiaries'],
            'first_name': ['first_name', 'Prénom', 'Prénom du bénéficiaire', 'First name'],
            'middle_name': ['middle_name', 'Post-Nom', 'Deuxième prénom', 'Middle name'],
            'last_name': ['last_name', 'Nom', 'Nom de famille', 'Last name'],
            'alternate_recipient': ['alternate_recipient', 'Suppléant', 'Bénéficiaire suppléant', 'Alternate']
        };
        const requiredColumns = ['site_name', 'household_id', 'household_name', 'token_number', 'beneficiary_count', 'first_name', 'last_name'];
        // Find the best match for each expected column
        const mapping = {};
        const missingColumns = [];
        for (const [field, possibleNames] of Object.entries(columnMappings)) {
            // Find if any of the possible names match a header
            const matchedHeader = headers.find(header => possibleNames.some(name => name.toLowerCase() === header.toLowerCase()));
            if (matchedHeader) {
                mapping[field] = matchedHeader;
            }
            else if (requiredColumns.includes(field)) {
                missingColumns.push(field);
            }
        }
        const isValid = missingColumns.length === 0;
        res.status(200).json({
            mapping,
            isValid,
            missingColumns
        });
    }
    catch (error) {
        console.error('Error suggesting mapping:', error);
        res.status(500).json({
            success: false,
            error: String(error)
        });
    }
});
// Validate data endpoint
router.post('/validate-data', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                isValid: false,
                errors: ['Invalid data format. Expected an array of objects.']
            });
        }
        const errors = [];
        // Validate each row
        data.forEach((row, index) => {
            const rowNum = index + 1;
            // Check required fields
            if (!row.site_name) {
                errors.push(`Ligne ${rowNum}: Le nom du site est requis`);
            }
            if (!row.household_id) {
                errors.push(`Ligne ${rowNum}: L'ID du ménage est requis`);
            }
            if (!row.household_name) {
                errors.push(`Ligne ${rowNum}: Le nom du ménage est requis`);
            }
            if (!row.token_number) {
                errors.push(`Ligne ${rowNum}: Le numéro de jeton est requis`);
            }
            if (row.beneficiary_count === undefined || row.beneficiary_count < 0) {
                errors.push(`Ligne ${rowNum}: Le nombre de bénéficiaires doit être un nombre positif`);
            }
            if (!row.first_name) {
                errors.push(`Ligne ${rowNum}: Le prénom est requis`);
            }
            if (!row.last_name) {
                errors.push(`Ligne ${rowNum}: Le nom est requis`);
            }
        });
        res.status(200).json({
            isValid: errors.length === 0,
            errors
        });
    }
    catch (error) {
        console.error('Error validating data:', error);
        res.status(500).json({
            isValid: false,
            errors: [String(error)]
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map