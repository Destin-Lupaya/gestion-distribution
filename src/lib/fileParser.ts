import * as XLSX from 'xlsx';
import { ImportRow } from '../types';
import { suggestColumnMapping, transformData, validateData } from './excelMapping';

export interface ParseResult {
  headers: string[];
  data: any[];
  totalRows: number;
  sample: any[];
}

export const isExcelFile = (file: File): boolean => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return allowedTypes.includes(file.type);
};

export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convertir en tableau d'objets
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Extraire les en-têtes (première ligne)
        const headers = jsonData[0] as string[];
        
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
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

export async function processExcelFile(file: File): Promise<{
  data: ImportRow[];
  mapping: Record<string, string>;
  validation: { isValid: boolean; errors: string[] };
}> {
  try {
    // Analyser le fichier Excel
    const { headers, data } = await parseExcelFile(file);
    console.log('Parsing Excel file...');
    console.log('File headers:', headers);
    console.log('First row:', data[0]);
    console.log('Total rows:', data.length);

    // Suggérer le mapping des colonnes
    const mapping = suggestColumnMapping(headers);
    console.log('Column mapping:', mapping);

    // Transformer les données
    const transformedData = transformData(data, mapping);
    console.log('Sample data:', transformedData.slice(0, 2));

    // Valider les données
    const validation = validateData(transformedData);
    console.log('Validation result:', validation);

    return {
      data: transformedData,
      mapping,
      validation
    };
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
}
