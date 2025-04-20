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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCSVFile = exports.isExcelFile = exports.getFileExtension = exports.validateFileType = exports.exportToCSV = exports.downloadExcelFile = exports.generateExcelFile = exports.parseCSV = exports.parseExcel = void 0;
const XLSX = __importStar(require("xlsx"));
const papaparse_1 = __importDefault(require("papaparse"));
const parseExcel = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                if (!data) {
                    throw new Error('Données du fichier vides');
                }
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                // Convertir en JSON avec options pour les dates
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    dateNF: 'yyyy-mm-dd',
                    defval: '', // Valeur par défaut pour les cellules vides
                    header: 1 // Utiliser la première ligne comme en-têtes
                });
                // Vérifier que nous avons des données
                if (!Array.isArray(jsonData) || jsonData.length < 2) {
                    throw new Error('Le fichier ne contient pas assez de données');
                }
                // Extraire les en-têtes (première ligne)
                const headers = jsonData[0];
                if (!Array.isArray(headers) || headers.length === 0) {
                    throw new Error('En-têtes de colonnes invalides');
                }
                // Convertir les données en tableau d'objets
                const result = jsonData.slice(1).map((row) => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
                console.log('Parsed Excel data:', result); // Debug log
                resolve(result);
            }
            catch (error) {
                reject(new Error('Erreur lors du parsing du fichier Excel: ' + error));
            }
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsArrayBuffer(file);
    });
};
exports.parseExcel = parseExcel;
const parseCSV = async (file, options = {}) => {
    return new Promise((resolve, reject) => {
        papaparse_1.default.parse(file, {
            header: options.header ?? true,
            skipEmptyLines: options.skipEmptyLines ?? true,
            transformHeader: options.transformHeader,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error('Erreur lors du parsing CSV: ' + results.errors[0].message));
                }
                else {
                    resolve(results.data);
                }
            },
            error: (error) => reject(new Error('Erreur lors du parsing CSV: ' + error))
        });
    });
};
exports.parseCSV = parseCSV;
const generateExcelFile = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiaires");
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
    });
    return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};
exports.generateExcelFile = generateExcelFile;
const downloadExcelFile = (data, filename = 'donnees_test.xlsx') => {
    const blob = (0, exports.generateExcelFile)(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
exports.downloadExcelFile = downloadExcelFile;
const exportToCSV = (data, filename = 'export.csv') => {
    const csvContent = papaparse_1.default.unparse(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
};
exports.exportToCSV = exportToCSV;
const saveAs = (blob, filename) => {
    try {
        // Créer une URL pour le blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        // Ajouter le lien au document, cliquer, puis nettoyer
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Libérer l'URL
        URL.revokeObjectURL(url);
    }
    catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier:', error);
        throw new Error('Impossible de télécharger le fichier');
    }
};
const validateFileType = (file) => {
    const extension = (0, exports.getFileExtension)(file.name).toLowerCase();
    return (0, exports.isExcelFile)(file) || (0, exports.isCSVFile)(file);
};
exports.validateFileType = validateFileType;
const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};
exports.getFileExtension = getFileExtension;
const isExcelFile = (file) => {
    const extension = (0, exports.getFileExtension)(file.name).toLowerCase();
    return ['xlsx', 'xls'].includes(extension);
};
exports.isExcelFile = isExcelFile;
const isCSVFile = (file) => {
    const extension = (0, exports.getFileExtension)(file.name).toLowerCase();
    return extension === 'csv';
};
exports.isCSVFile = isCSVFile;
//# sourceMappingURL=excelParser.js.map