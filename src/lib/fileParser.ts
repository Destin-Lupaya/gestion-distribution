import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ParseResult {
  headers: string[];
  data: any[];
}

export const isExcelFile = (file: File): boolean => {
  const excelTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  return excelTypes.includes(file.type) || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
};

export const isCSVFile = (file: File): boolean => {
  return file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
};

export const validateFileType = (file: File): string | null => {
  if (!file) return 'Aucun fichier sélectionné';
  if (!isExcelFile(file) && !isCSVFile(file)) {
    return 'Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx, .xls) ou CSV (.csv)';
  }
  return null;
};

export const parseExcel = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Erreur lors de la lecture du fichier');
        }

        let data: Uint8Array;
        if (e.target.result instanceof ArrayBuffer) {
          data = new Uint8Array(e.target.result);
        } else {
          throw new Error('Format de fichier invalide');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          throw new Error('Le fichier Excel ne contient aucune feuille');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          defval: '', // Valeur par défaut pour les cellules vides
          raw: false // Convertir les nombres en chaînes
        });

        if (!Array.isArray(jsonData) || jsonData.length < 2) {
          throw new Error('Le fichier est vide ou ne contient pas de données');
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim());
        if (headers.some(h => !h)) {
          throw new Error('Certains en-têtes de colonnes sont vides');
        }

        const rows = jsonData.slice(1).map((row: any) => {
          const rowData: { [key: string]: any } = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] !== undefined ? String(row[index]).trim() : '';
          });
          return rowData;
        });

        resolve({ headers, data: rows });
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel: ' + (error instanceof Error ? error.message : 'erreur inconnue')));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Erreur lors de la lecture du fichier CSV: ' + results.errors[0].message));
          return;
        }

        const headers = results.meta.fields || [];
        if (headers.some(h => !h)) {
          reject(new Error('Certains en-têtes de colonnes sont vides'));
          return;
        }

        resolve({ 
          headers, 
          data: results.data.map((row: any) => {
            const cleanRow: { [key: string]: string } = {};
            headers.forEach(header => {
              cleanRow[header] = row[header] !== undefined ? String(row[header]).trim() : '';
            });
            return cleanRow;
          })
        });
      },
      error: (error) => {
        reject(new Error('Erreur lors de la lecture du fichier CSV: ' + error.message));
      }
    });
  });
};
