import { Beneficiaire } from '../types';

// Define column mapping types
export interface ExcelColumnMapping {
  excelField: string;
  appField: keyof Beneficiaire;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  validate?: (value: any) => string | null;
  isFirstColumn?: boolean;
  possibleMatches?: string[];
}

// Define available mappings with validation and possible matches
export const EXCEL_MAPPINGS: Record<string, ExcelColumnMapping> = {
  'Site de distribution': {
    excelField: 'Site de distribution',
    appField: 'siteDistribution',
    required: false,
    type: 'string',
    validate: (value) => null,
    isFirstColumn: true,
    possibleMatches: ['site', 'site distribution', 'site de distribution', 'lieu', 'lieu de distribution', 'centre']
  },
  'Adresse': {
    excelField: 'Adresse',
    appField: 'adresse',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['adresse', 'address', 'localisation', 'location']
  },
  'Household ID': {
    excelField: 'Household ID',
    appField: 'householdId',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['household id', 'id menage', 'id du menage', 'household', 'menage id']
  },
  'Nom du Ménage': {
    excelField: 'Nom du Ménage',
    appField: 'nomMenage',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['nom du menage', 'nom menage', 'household name', 'nom', 'name']
  },
  'Token Number': {
    excelField: 'Token Number',
    appField: 'tokenNumber',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['token', 'token number', 'numero token', 'token id', 'token #']
  },
  'Recipient First Name': {
    excelField: 'Recipient First Name',
    appField: 'recipientFirstName',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['prenom', 'first name', 'prénom', 'recipient first name', 'prenom beneficiaire']
  },
  'Recipient Middle Name': {
    excelField: 'Recipient Middle Name',
    appField: 'recipientMiddleName',
    required: false,
    type: 'string',
    possibleMatches: ['deuxieme prenom', 'middle name', 'second prenom', 'autre prenom']
  },
  'Recipient Last Name': {
    excelField: 'Recipient Last Name',
    appField: 'recipientLastName',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['nom', 'last name', 'nom de famille', 'recipient last name', 'nom beneficiaire']
  },
  'Nombre des Bénéficiaires Enrôlés': {
    excelField: 'Nombre des Bénéficiaires Enrôlés',
    appField: 'nombreBeneficiaires',
    required: false,
    type: 'number',
    validate: (value) => {
      if (value !== undefined && value !== null && value !== '') {
        const num = parseInt(value);
        if (isNaN(num)) return 'Le nombre de bénéficiaires doit être un nombre';
        if (num < 1) return 'Le nombre de bénéficiaires doit être supérieur à 0';
      }
      return null;
    },
    possibleMatches: ['nombre beneficiaires', 'nb beneficiaires', 'beneficiaires', 'total beneficiaires', 'nombre', 'total']
  },
  'Nom Suppléant': {
    excelField: 'Nom Suppléant',
    appField: 'nomSuppleant',
    required: false,
    type: 'string',
    possibleMatches: ['suppleant', 'nom suppleant', 'alternate', 'alternate name', 'remplacant']
  }
};

// Helper function to normalize text for comparison
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// Helper function to find best match for a column
export const findBestMatch = (columnName: string): string | null => {
  const normalizedColumn = normalizeText(columnName);
  
  // First try exact match
  for (const [key, mapping] of Object.entries(EXCEL_MAPPINGS)) {
    if (normalizeText(mapping.excelField) === normalizedColumn) {
      return key;
    }
  }

  // Then try possible matches
  for (const [key, mapping] of Object.entries(EXCEL_MAPPINGS)) {
    if (mapping.possibleMatches?.some(match => normalizeText(match) === normalizedColumn)) {
      return key;
    }
  }

  // Finally try partial matches
  for (const [key, mapping] of Object.entries(EXCEL_MAPPINGS)) {
    if (
      normalizeText(mapping.excelField).includes(normalizedColumn) ||
      mapping.possibleMatches?.some(match => normalizeText(match).includes(normalizedColumn))
    ) {
      return key;
    }
  }

  return null;
};

// Helper function to automatically map columns
export const autoMapColumns = (columns: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  columns.forEach(column => {
    const bestMatch = findBestMatch(column);
    if (bestMatch) {
      mapping[column] = EXCEL_MAPPINGS[bestMatch].excelField;
    }
  });

  return mapping;
};

// Helper function to validate a single row
export const validateExcelRow = (
  row: Record<string, any>, 
  rowIndex: number,
  customMapping?: Record<string, string>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  Object.entries(EXCEL_MAPPINGS).forEach(([key, mapping]) => {
    const excelField = customMapping?.[mapping.excelField] || mapping.excelField;
    const value = row[excelField];

    if (value !== undefined && value !== null && value !== '') {
      // Type validation
      if (mapping.type === 'number' && isNaN(Number(value))) {
        errors.push(`Ligne ${rowIndex}: Le champ "${mapping.excelField}" doit être un nombre`);
      }

      // Custom validation
      if (mapping.validate) {
        const validationError = mapping.validate(value);
        if (validationError) {
          errors.push(`Ligne ${rowIndex}: ${validationError}`);
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Transform Excel data to app format
export const transformExcelData = (
  data: Record<string, any>[], 
  customMapping?: Record<string, string>
): { data: Partial<Beneficiaire>[]; errors: string[] } => {
  const transformedData: Partial<Beneficiaire>[] = [];
  const errors: string[] = [];

  // First, validate that we have data
  if (!data || data.length === 0) {
    errors.push('Le fichier est vide');
    return { data: [], errors };
  }

  data.forEach((row, index) => {
    const { valid, errors: rowErrors } = validateExcelRow(row, index + 2, customMapping);
    
    if (valid) {
      const transformedRow: Partial<Beneficiaire> = {
        id: crypto.randomUUID()
      };

      Object.values(EXCEL_MAPPINGS).forEach(mapping => {
        const excelField = customMapping?.[mapping.excelField] || mapping.excelField;
        const value = row[excelField];

        if (value !== undefined && value !== null && value !== '') {
          if (mapping.type === 'number') {
            transformedRow[mapping.appField] = Number(value);
          } else {
            transformedRow[mapping.appField] = typeof value === 'string' ? value.trim() : value;
          }
        }
      });

      transformedData.push(transformedRow);
    } else {
      errors.push(...rowErrors);
    }
  });

  return {
    data: transformedData,
    errors
  };
};

// Get field options for mapping UI
export const getFieldOptions = () => {
  return Object.entries(EXCEL_MAPPINGS).map(([key, mapping]) => ({
    value: mapping.excelField,
    label: key,
    required: mapping.required,
    isFirstColumn: mapping.isFirstColumn
  }));
};