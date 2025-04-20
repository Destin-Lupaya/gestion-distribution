"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExcelFile = void 0;
exports.parseExcelFile = parseExcelFile;
exports.processExcelFile = processExcelFile;
const XLSX = __importStar(require("xlsx"));
const excelMapping_1 = require("./excelMapping");
const isExcelFile = (file) => {
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return allowedTypes.includes(file.type);
};
exports.isExcelFile = isExcelFile;
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                // Convertir en tableau d'objets
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                // Extraire les en-têtes (première ligne)
                const headers = jsonData[0];
                // Convertir le reste des données en objets
                const rows = XLSX.utils.sheet_to_json(firstSheet);
                // Créer un échantillon des 2 premières lignes
                const sample = rows.slice(0, 2);
                resolve({
                    headers,
                    data: rows,
                    totalRows: rows.length,
                    sample
                });
            }
            catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
}
async function processExcelFile(file) {
    try {
        // Analyser le fichier Excel
        const { headers, data } = await parseExcelFile(file);
        console.log('Parsing Excel file...');
        console.log('File headers:', headers);
        console.log('First row:', data[0]);
        console.log('Total rows:', data.length);
        // Suggérer le mapping des colonnes
        const mapping = (0, excelMapping_1.suggestColumnMapping)(headers);
        console.log('Column mapping:', mapping);
        // Transformer les données
        const transformedData = (0, excelMapping_1.transformData)(data, mapping);
        console.log('Sample data:', transformedData.slice(0, 2));
        // Valider les données
        const validation = (0, excelMapping_1.validateData)(transformedData);
        console.log('Validation result:', validation);
        return {
            data: transformedData,
            mapping,
            validation
        };
    }
    catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
    }
}
//# sourceMappingURL=fileParser.js.map