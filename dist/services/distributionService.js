"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQRCode = validateQRCode;
exports.getAvailableItems = getAvailableItems;
exports.completeDistribution = completeDistribution;
const db_1 = require("../lib/db");
const uuid_1 = require("uuid");
async function validateQRCode(qrData) {
    const connection = await (0, db_1.getConnection)();
    try {
        // Vérifier l'existence et l'éligibilité du ménage
        const [rows] = await connection.execute(`SELECT 
        m.household_id as household_id,
        m.nom_menage,
        m.nombre_beneficiaires,
        s.nom as site_name,
        CONCAT(b.first_name, ' ', b.last_name) as beneficiaire_principal,
        (
          SELECT MAX(date_distribution)
          FROM distributions
          WHERE menage_id = m.id
        ) as derniere_distribution,
        TRUE as est_valide
      FROM menages m
      JOIN sites_distribution s ON m.site_distribution_id = s.id
      LEFT JOIN beneficiaires b ON m.id = b.menage_id AND b.est_principal = true
      WHERE m.household_id = ?`, [qrData]);
        if (!rows.length) {
            throw new Error('Ménage non trouvé');
        }
        const result = rows[0];
        // Create empty history for now
        const historyItems = [];
        result.historique_recent = historyItems;
        result.statut = result.est_valide
            ? 'Éligible pour distribution'
            : 'Distribution récente - Non éligible';
        return result;
    }
    catch (error) {
        throw error;
    }
    finally {
        await connection.end();
    }
}
async function getAvailableItems() {
    const connection = await (0, db_1.getConnection)();
    try {
        // Placeholder for now - we'll implement this properly later
        const items = [
            { id: 1, nom: 'Riz', unite_mesure: 'kg', stock_disponible: 100 },
            { id: 2, nom: 'Huile', unite_mesure: 'L', stock_disponible: 50 },
            { id: 3, nom: 'Sel', unite_mesure: 'kg', stock_disponible: 30 },
            { id: 4, nom: 'Sucre', unite_mesure: 'kg', stock_disponible: 40 }
        ];
        return items;
    }
    catch (error) {
        throw error;
    }
    finally {
        await connection.end();
    }
}
async function completeDistribution(request) {
    const connection = await (0, db_1.getConnection)();
    try {
        await connection.beginTransaction();
        // Find the menage_id from the household_id
        const [menages] = await connection.execute('SELECT id FROM menages WHERE household_id = ?', [request.household_id]);
        if (!menages.length) {
            throw new Error('Ménage non trouvé');
        }
        const menageId = menages[0].id;
        // Create the distribution record
        const distributionId = (0, uuid_1.v4)();
        await connection.execute('INSERT INTO distributions (id, menage_id, date_distribution, signature) VALUES (?, ?, NOW(), ?)', [distributionId, menageId, request.signature_data]);
        // Insert the distribution items
        for (const item of request.items) {
            await connection.execute('INSERT INTO distribution_items (distribution_id, item_id, quantite) VALUES (?, ?, ?)', [distributionId, item.id, item.quantite]);
        }
        await connection.commit();
        return { distribution_id: distributionId };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        await connection.end();
    }
}
//# sourceMappingURL=distributionService.js.map