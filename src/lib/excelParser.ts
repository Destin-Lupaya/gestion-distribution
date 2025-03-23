import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ParseOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

export const parseExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        // Convertir en JSON avec options pour les dates
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erreur lors du parsing du fichier Excel: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = async (file: File, options: ParseOptions = {}): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: options.header ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      transformHeader: options.transformHeader,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Erreur lors du parsing CSV: ' + results.errors[0].message));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(new Error('Erreur lors du parsing CSV: ' + error))
    });
  });
};

export const generateExcelFile = (data: any[]): Blob => {
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

export const downloadExcelFile = (data: any[], filename: string = 'donnees_test.xlsx') => {
  const blob = generateExcelFile(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string = 'export.csv') => {
  const csvContent = Papa.unparse(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

const saveAs = (blob: Blob, filename: string) => {
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
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier:', error);
    throw new Error('Impossible de télécharger le fichier');
  }
};

export const validateFileType = (file: File): boolean => {
  const extension = getFileExtension(file.name).toLowerCase();
  return isExcelFile(file) || isCSVFile(file);
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isExcelFile = (file: File): boolean => {
  const extension = getFileExtension(file.name).toLowerCase();
  return ['xlsx', 'xls'].includes(extension);
};

export const isCSVFile = (file: File): boolean => {
  const extension = getFileExtension(file.name).toLowerCase();
  return extension === 'csv';
};