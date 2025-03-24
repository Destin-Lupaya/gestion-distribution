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
} as const;

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
} as const;

export const expectedFields = [
  'site_name',
  'household_id',
  'household_name',
  'token_number',
  'beneficiary_count',
  'first_name',
  'middle_name',
  'last_name'
] as const;

export const columnDefinitions = {
  site_name: {
    field: 'site_name',
    headerName: 'Site',
    alternateNames: ['Site', 'Nom du site', 'Site de distribution']
  },
  household_id: {
    field: 'household_id',
    headerName: 'ID Ménage',
    alternateNames: ['Household ID', 'ID Ménage', 'Code Ménage']
  },
  household_name: {
    field: 'household_name',
    headerName: 'Nom du Ménage',
    alternateNames: ['Nom du Ménage', 'Ménage', 'Household']
  },
  token_number: {
    field: 'token_number',
    headerName: 'Token',
    alternateNames: ['Token', 'Numéro de jeton', 'Jeton']
  },
  beneficiary_count: {
    field: 'beneficiary_count',
    headerName: 'Bénéficiaires',
    alternateNames: ['Bénéficiaires', 'Nombre de bénéficiaires', 'Beneficiaries']
  },
  first_name: {
    field: 'first_name',
    headerName: 'Prénom',
    alternateNames: ['Prénom', 'Prénom du bénéficiaire', 'First name']
  },
  middle_name: {
    field: 'middle_name',
    headerName: 'Post-nom',
    alternateNames: ['Post-Nom', 'Deuxième prénom', 'Middle name']
  },
  last_name: {
    field: 'last_name',
    headerName: 'Nom',
    alternateNames: ['Nom', 'Nom de famille', 'Last name']
  }
} as const;

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  if (str1.toLowerCase().includes(str2.toLowerCase()) || str2.toLowerCase().includes(str1.toLowerCase())) return 0.8;
  
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function findBestMatch(input: string, candidates: string[]): { bestMatch: string; score: number } {
  let bestMatch = '';
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = calculateSimilarity(input, candidate);
    console.log(`Comparing "${input}" with "${candidate}": score = ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return { bestMatch, score: bestScore };
}

export function suggestColumnMapping(headers: string[]): Record<string, string> {
  console.log('Starting column mapping suggestion...');
  console.log('Input headers:', headers);

  const mapping: Record<string, string> = {};

  for (const field of expectedFields) {
    console.log(`Looking for matches for field: ${field}`);
    
    const definition = field in REQUIRED_COLUMNS 
      ? REQUIRED_COLUMNS[field as keyof typeof REQUIRED_COLUMNS]
      : OPTIONAL_COLUMNS[field as keyof typeof OPTIONAL_COLUMNS];

    const candidates = [field, ...definition.possibleNames];

    let bestMatch = '';
    let bestScore = 0;

    for (const header of headers) {
      const { score } = findBestMatch(header, candidates);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = header;
      }
    }

    if (bestScore >= 0.5) {
      console.log(`Found match for ${field}: "${bestMatch}" (score: ${bestScore})`);
      mapping[field] = bestMatch;
    }
  }

  console.log('Final mapping:', mapping);
  return mapping;
}

export function transformData(data: any[], columnMapping: Record<string, string>): ImportRow[] {
  return data.map(row => {
    const transformedRow: ImportRow = {
      site_name: row[columnMapping.site_name] || '',
      household_id: row[columnMapping.household_id] || '',
      household_name: row[columnMapping.household_name] || '',
      token_number: row[columnMapping.token_number] || '',
      beneficiary_count: parseInt(row[columnMapping.beneficiary_count]) || 0,
      first_name: row[columnMapping.first_name] || '',
      middle_name: row[columnMapping.middle_name] || '',
      last_name: row[columnMapping.last_name] || ''
    };

    return transformedRow;
  });
}

export function validateData(data: ImportRow[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;

    if (!row.site_name) {
      errors.push(`Ligne ${rowNum}: Le site est requis`);
    }

    if (!row.household_id) {
      errors.push(`Ligne ${rowNum}: L'ID du ménage est requis`);
    }

    if (!row.token_number) {
      errors.push(`Ligne ${rowNum}: Le numéro de jeton est requis`);
    }

    if (row.beneficiary_count < 0) {
      errors.push(`Ligne ${rowNum}: Le nombre de bénéficiaires doit être positif`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExcelRow(row: ImportRow): string | null {
  if (!row.site_name) return 'Le site est requis';
  if (!row.household_id) return "L'ID du ménage est requis";
  if (!row.token_number) return 'Le numéro de jeton est requis';
  if (row.beneficiary_count < 0) return 'Le nombre de bénéficiaires doit être positif';
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

export function suggestExcelColumnMapping(headers: string[]): { [key: string]: string } {
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