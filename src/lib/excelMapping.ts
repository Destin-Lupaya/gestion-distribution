import { ImportRow } from '../types';

// Définition des colonnes requises et leurs validations
export const REQUIRED_COLUMNS = {
  site_name: {
    required: true,
    possibleNames: ['Site', 'Nom du site', 'Site de distribution', 'site_name'],
    validate: (value: any) => {
      if (!value) return 'Le nom du site est requis';
      if (typeof value !== 'string') return 'Le nom du site doit être une chaîne de caractères';
      if (value.length < 2) return 'Le nom du site doit contenir au moins 2 caractères';
      return null;
    }
  },
  household_id: {
    required: true,
    possibleNames: ['household_id', 'Household ID', 'ID Ménage', 'Code Ménage'],
    validate: (value: any) => {
      if (!value) return 'L\'ID du ménage est requis';
      if (typeof value !== 'string') return 'L\'ID du ménage doit être une chaîne de caractères';
      return null;
    }
  },
  household_name: {
    required: true,
    possibleNames: ['household_name', 'Nom du Ménage', 'Ménage', 'Household'],
    validate: (value: any) => {
      if (!value) return 'Le nom du ménage est requis';
      if (typeof value !== 'string') return 'Le nom du ménage doit être une chaîne de caractères';
      return null;
    }
  },
  token_number: {
    required: true,
    possibleNames: ['token_number', 'Token', 'Numéro de jeton', 'Jeton'],
    validate: (value: any) => {
      if (!value) return 'Le numéro de jeton est requis';
      if (!/^[A-Za-z0-9-]+$/.test(value)) return 'Le numéro de jeton ne doit contenir que des lettres, chiffres et tirets';
      return null;
    }
  },
  beneficiary_count: {
    required: true,
    possibleNames: ['beneficiary_count', 'Bénéficiaires', 'Nombre de bénéficiaires', 'Beneficiaries'],
    validate: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Le nombre de bénéficiaires doit être un nombre';
      if (num < 1) return 'Le nombre de bénéficiaires doit être supérieur à 0';
      return null;
    }
  },
  first_name: {
    required: true,
    possibleNames: ['first_name', 'Prénom', 'Prénom du bénéficiaire', 'First name'],
    validate: (value: any) => {
      if (!value) return 'Le prénom est requis';
      if (typeof value !== 'string') return 'Le prénom doit être une chaîne de caractères';
      return null;
    }
  },
  middle_name: {
    required: true,
    possibleNames: ['middle_name', 'Post-Nom', 'Deuxième prénom', 'Middle name'],
    validate: (value: any) => {
      if (!value) return 'Le post-nom est requis';
      if (typeof value !== 'string') return 'Le post-nom doit être une chaîne de caractères';
      return null;
    }
  },
  last_name: {
    required: true,
    possibleNames: ['last_name', 'Nom', 'Nom de famille', 'Last name'],
    validate: (value: any) => {
      if (!value) return 'Le nom est requis';
      if (typeof value !== 'string') return 'Le nom doit être une chaîne de caractères';
      return null;
    }
  }
};

// Colonnes optionnelles
export const OPTIONAL_COLUMNS = {
  site_address: {
    required: false,
    possibleNames: ['site_address', 'Adresse', 'Adresse du site', 'Address'],
    validate: (value: any) => {
      if (value && typeof value !== 'string') return 'L\'adresse doit être une chaîne de caractères';
      return null;
    }
  },
  alternate_recipient: {
    required: false,
    possibleNames: ['alternate_recipient', 'Suppléant', 'Bénéficiaire suppléant', 'Alternate'],
    validate: (value: any) => {
      if (value && typeof value !== 'string') return 'Le nom du suppléant doit être une chaîne de caractères';
      return null;
    }
  }
};

// Define column mapping types
export interface ExcelColumnMapping {
  excelField: string;
  appField: keyof ImportRow;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  validate?: (value: any) => string | null;
  isFirstColumn?: boolean;
  possibleMatches?: string[];
}

// Define available mappings with validation and possible matches
export const EXCEL_MAPPINGS: Record<string, ExcelColumnMapping> = {
  'Site de distribution': {
    excelField: 'site_name',
    appField: 'site_name',
    required: false,
    type: 'string',
    validate: (value) => null,
    isFirstColumn: true,
    possibleMatches: ['site', 'site distribution', 'site de distribution', 'lieu', 'lieu de distribution', 'centre', 'distribution site', 'location']
  },
  'Adresse': {
    excelField: 'site_address',
    appField: 'site_address',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['adresse', 'address', 'localisation', 'location', 'site address', 'adresse site']
  },
  'Household ID': {
    excelField: 'household_id',
    appField: 'household_id',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['household id', 'id menage', 'id du menage', 'household', 'menage id', 'code menage', 'household code']
  },
  'Nom du Ménage': {
    excelField: 'household_name',
    appField: 'household_name',
    required: true,
    type: 'string',
    validate: (value) => !value ? 'Le nom du ménage est requis' : null,
    possibleMatches: ['nom du menage', 'nom menage', 'household name', 'nom', 'name', 'menage']
  },
  'Token Number': {
    excelField: 'token_number',
    appField: 'token_number',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['token', 'token number', 'numero token', 'token id', 'token #', 'code token', 'token code']
  },
  'Recipient First Name': {
    excelField: 'first_name',
    appField: 'first_name',
    required: true,
    type: 'string',
    validate: (value) => !value ? 'Le prénom du bénéficiaire est requis' : null,
    possibleMatches: ['prenom', 'first name', 'prénom', 'recipient first name', 'prenom beneficiaire', 'prenom principal']
  },
  'Recipient Middle Name': {
    excelField: 'middle_name',
    appField: 'middle_name',
    required: true,
    type: 'string',
    validate: (value) => !value ? 'Le post-nom du bénéficiaire est requis' : null,
    possibleMatches: ['middle name', 'deuxieme prenom', 'autre prenom', 'second prenom', 'post-nom']
  },
  'Recipient Last Name': {
    excelField: 'last_name',
    appField: 'last_name',
    required: true,
    type: 'string',
    validate: (value) => !value ? 'Le nom de famille du bénéficiaire est requis' : null,
    possibleMatches: ['nom', 'last name', 'nom de famille', 'recipient last name', 'nom beneficiaire']
  },
  'Nombre des Bénéficiaires Enrôlés': {
    excelField: 'beneficiary_count',
    appField: 'beneficiary_count',
    required: false,
    type: 'number',
    validate: (value) => {
      if (!value) return null;
      const num = Number(value);
      if (isNaN(num)) return 'Le nombre de bénéficiaires doit être un nombre';
      if (num < 0) return 'Le nombre de bénéficiaires ne peut pas être négatif';
      if (num > 100) return 'Le nombre de bénéficiaires semble trop élevé';
      return null;
    },
    possibleMatches: ['nombre beneficiaires', 'nb beneficiaires', 'beneficiaires', 'total beneficiaires', 'nombre', 'total', 'household size', 'taille menage']
  },
  'Nom Suppléant': {
    excelField: 'alternate_recipient',
    appField: 'alternate_recipient',
    required: false,
    type: 'string',
    validate: (value) => null,
    possibleMatches: ['suppleant', 'alternate', 'remplacant', 'nom suppleant', 'alternate name', 'nom remplacant']
  }
};

interface FieldOption {
  value: keyof ImportRow;
  label: string;
  required: boolean;
}

export function getFieldOptions(): FieldOption[] {
  return [
    { value: 'site_name', label: 'Nom du Site', required: true },
    { value: 'site_address', label: 'Adresse du Site', required: false },
    { value: 'household_id', label: 'ID du Ménage', required: true },
    { value: 'household_name', label: 'Nom du Ménage', required: true },
    { value: 'token_number', label: 'Token', required: true },
    { value: 'beneficiary_count', label: 'Nombre de Bénéficiaires', required: true },
    { value: 'first_name', label: 'Prénom', required: true },
    { value: 'middle_name', label: 'Post-Nom', required: true },
    { value: 'last_name', label: 'Nom', required: true },
    { value: 'alternate_recipient', label: 'Suppléant', required: false }
  ];
}

export function validateExcelRow(data: ImportRow): string | null {
  const requiredFields = getFieldOptions().filter(f => f.required).map(f => f.value);
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Le champ "${getFieldOptions().find(f => f.value === field)?.label}" est requis`;
    }
  }

  if (data.beneficiary_count && isNaN(Number(data.beneficiary_count))) {
    return 'Le nombre de bénéficiaires doit être un nombre';
  }

  return null;
}

export function transformExcelData(data: any[], columnMapping: { [key: string]: string }) {
  const errors: string[] = [];
  const transformedData = data.map((row, index) => {
    const transformedRow: any = {};

    // Appliquer le mapping des colonnes
    Object.entries(columnMapping).forEach(([field, excelColumn]) => {
      if (excelColumn) {
        transformedRow[field] = row[excelColumn];
      }
    });

    // Valider les données transformées
    Object.entries(REQUIRED_COLUMNS).forEach(([field, config]) => {
      const value = transformedRow[field];
      const error = config.validate(value);
      if (error) {
        errors.push(`Ligne ${index + 2}: ${error}`);
      }
    });

    // Valider les colonnes optionnelles si présentes
    Object.entries(OPTIONAL_COLUMNS).forEach(([field, config]) => {
      if (transformedRow[field] !== undefined) {
        const error = config.validate(transformedRow[field]);
        if (error) {
          errors.push(`Ligne ${index + 2}: ${error}`);
        }
      }
    });

    return transformedRow;
  });

  return {
    data: transformedData,
    errors
  };
}

// Fonction pour suggérer automatiquement le mapping des colonnes
export function suggestColumnMapping(headers: string[]): { [key: string]: string } {
  console.log('Starting column mapping suggestion...');
  console.log('Input headers:', headers);

  const mapping: { [key: string]: string } = {};
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: normalizeText(h)
  }));

  // Pour chaque colonne requise
  Object.entries(REQUIRED_COLUMNS).forEach(([fieldName, field]) => {
    console.log(`Looking for matches for field: ${fieldName}`);
    
    let bestMatch = '';
    let bestScore = 0;

    // Pour chaque en-tête
    normalizedHeaders.forEach(header => {
      // Si cet en-tête n'a pas déjà été mappé
      if (!Object.values(mapping).includes(header.original)) {
        // Vérifier la similarité avec chaque nom possible
        field.possibleNames.forEach(possibleName => {
          const score = calculateSimilarity(header.original, possibleName);
          console.log(`Comparing "${header.original}" with "${possibleName}": score = ${score}`);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = header.original;
          }
        });
      }
    });

    // Si on a trouvé une correspondance avec un score suffisant
    if (bestScore >= 0.5) {
      console.log(`Found match for ${fieldName}: "${bestMatch}" (score: ${bestScore})`);
      mapping[fieldName] = bestMatch;
    } else {
      console.log(`No good match found for ${fieldName}`);
    }
  });

  // Pour les colonnes optionnelles
  Object.entries(OPTIONAL_COLUMNS).forEach(([fieldName, field]) => {
    if (!mapping[fieldName]) { // Ne pas écraser les mappings existants
      let bestMatch = '';
      let bestScore = 0;

      normalizedHeaders.forEach(header => {
        if (!Object.values(mapping).includes(header.original)) {
          field.possibleNames.forEach(possibleName => {
            const score = calculateSimilarity(header.original, possibleName);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = header.original;
            }
          });
        }
      });

      if (bestScore >= 0.5) {
        mapping[fieldName] = bestMatch;
      }
    }
  });

  console.log('Final mapping:', mapping);
  return mapping;
};

// Fonction pour normaliser le texte pour la comparaison
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
};

// Fonction pour calculer la similarité entre deux chaînes
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // Si les chaînes sont identiques après normalisation
  if (s1 === s2) return 1;

  // Si une chaîne est incluse dans l'autre
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Compter les mots communs
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const commonWords = [...words1].filter(word => words2.has(word));

  return commonWords.length / Math.max(words1.size, words2.size);
};

export function validateExcelColumns(headers: string[]): { isValid: boolean; missingColumns: string[]; errors: string[] } {
  const missingColumns: string[] = [];
  const errors: string[] = [];
  const foundColumns: { [key: string]: string } = {};

  // Vérifier les colonnes requises
  for (const [field, config] of Object.entries(REQUIRED_COLUMNS)) {
    const matchingHeader = headers.find(header => 
      config.possibleNames.some(name => 
        name.toLowerCase() === header.toLowerCase()
      )
    );

    if (!matchingHeader) {
      missingColumns.push(config.possibleNames[0]);
      errors.push(`La colonne "${config.possibleNames[0]}" est requise`);
    } else {
      foundColumns[field] = matchingHeader;
    }
  }

  // Vérifier les colonnes optionnelles
  for (const [field, config] of Object.entries(OPTIONAL_COLUMNS)) {
    const matchingHeader = headers.find(header => 
      config.possibleNames.some(name => 
        name.toLowerCase() === header.toLowerCase()
      )
    );

    if (matchingHeader) {
      foundColumns[field] = matchingHeader;
    }
  }

  // Vérifier les colonnes inconnues
  const unknownColumns = headers.filter(header => 
    !Object.values(foundColumns).some(found => 
      found.toLowerCase() === header.toLowerCase()
    )
  );

  if (unknownColumns.length > 0) {
    errors.push(`Colonnes inconnues trouvées : ${unknownColumns.join(', ')}`);
  }

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    errors
  };
}

export function validateExcelData(data: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  data.forEach((row, index) => {
    // Valider les champs requis
    for (const [field, config] of Object.entries(REQUIRED_COLUMNS)) {
      const value = row[field];
      const error = config.validate(value);
      if (error) {
        errors.push(`Ligne ${index + 1} : ${error}`);
      }
    }

    // Valider les champs optionnels s'ils sont présents
    for (const [field, config] of Object.entries(OPTIONAL_COLUMNS)) {
      if (field in row) {
        const value = row[field];
        const error = config.validate(value);
        if (error) {
          errors.push(`Ligne ${index + 1} : ${error}`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}