const REQUIRED_COLUMNS = {
  site_name: {
    possibleNames: ['Site', 'Site Name', 'Nom du site', 'Localisation'],
    validate: (value) => {
      if (!value) return 'Le nom du site est requis';
      if (value.length > 255) return 'Le nom du site ne doit pas dépasser 255 caractères';
      return null;
    }
  },
  household_id: {
    possibleNames: ['Household ID', 'ID Ménage', 'Numéro Ménage', 'N° Ménage'],
    validate: (value) => {
      if (!value) return 'L\'ID du ménage est requis';
      if (value.length > 255) return 'L\'ID du ménage ne doit pas dépasser 255 caractères';
      return null;
    }
  },
  household_name: {
    possibleNames: ['Household Name', 'Nom du Ménage', 'Ménage', 'Household', 'Nom Menage'],
    validate: (value) => {
      if (!value) return 'Le nom du ménage est requis';
      if (value.length > 255) return 'Le nom du ménage ne doit pas dépasser 255 caractères';
      return null;
    }
  },
  token_number: {
    possibleNames: ['Token', 'Token Number', 'Numéro de jeton', 'N° Jeton'],
    validate: (value) => {
      if (!value) return 'Le numéro de jeton est requis';
      if (value.length > 50) return 'Le numéro de jeton ne doit pas dépasser 50 caractères';
      return null;
    }
  },
  beneficiary_count: {
    possibleNames: ['Beneficiaries', 'Beneficiary Count', 'Nombre de bénéficiaires', 'Bénéficiaires'],
    validate: (value) => {
      if (value === undefined || value === null) return 'Le nombre de bénéficiaires est requis';
      const count = parseInt(value);
      if (isNaN(count) || count < 0) return 'Le nombre de bénéficiaires doit être un nombre positif';
      return null;
    }
  },
  first_name: {
    possibleNames: ['First Name', 'Prénom', 'Given Name', 'Nom'],
    validate: (value) => {
      if (!value) return 'Le prénom est requis';
      if (value.length > 255) return 'Le prénom ne doit pas dépasser 255 caractères';
      return null;
    }
  },
  middle_name: {
    possibleNames: ['Middle Name', 'Post-nom', 'Second Name'],
    validate: (value) => {
      if (value && value.length > 255) return 'Le post-nom ne doit pas dépasser 255 caractères';
      return null;
    }
  },
  last_name: {
    possibleNames: ['Last Name', 'Nom de famille', 'Family Name', 'Surname'],
    validate: (value) => {
      if (!value) return 'Le nom de famille est requis';
      if (value.length > 255) return 'Le nom de famille ne doit pas dépasser 255 caractères';
      return null;
    }
  }
};

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const pairs1 = new Set();
  const pairs2 = new Set();

  for (let i = 0; i < s1.length - 1; i++) {
    pairs1.add(s1.slice(i, i + 2));
  }

  for (let i = 0; i < s2.length - 1; i++) {
    pairs2.add(s2.slice(i, i + 2));
  }

  const intersection = new Set([...pairs1].filter(x => pairs2.has(x)));
  const union = new Set([...pairs1, ...pairs2]);

  return intersection.size / union.size;
}

function suggestColumnMapping(headers) {
  if (!headers || !Array.isArray(headers)) {
    throw new Error('Les en-têtes doivent être un tableau non vide');
  }

  // Convertir tous les en-têtes en chaînes de caractères
  const stringHeaders = headers.map(h => String(h || '').trim());
  console.log('En-têtes reçus:', stringHeaders);

  const mapping = {};
  const usedHeaders = new Set();

  // First pass: exact matches
  Object.entries(REQUIRED_COLUMNS).forEach(([field, config]) => {
    const exactMatch = stringHeaders.find(header =>
      config.possibleNames.some(name => name.toLowerCase() === header.toLowerCase())
    );
    if (exactMatch) {
      mapping[field] = exactMatch;
      usedHeaders.add(exactMatch);
    }
  });

  // Second pass: fuzzy matches for remaining fields
  Object.entries(REQUIRED_COLUMNS).forEach(([field, config]) => {
    if (!mapping[field]) {
      const availableHeaders = stringHeaders.filter(h => !usedHeaders.has(h));
      let bestMatch = null;
      let bestScore = 0;

      availableHeaders.forEach(header => {
        config.possibleNames.forEach(possibleName => {
          const score = calculateSimilarity(header.toLowerCase(), possibleName.toLowerCase());
          if (score > bestScore && score > 0.4) {
            bestScore = score;
            bestMatch = header;
          }
        });
      });

      if (bestMatch) {
        mapping[field] = bestMatch;
        usedHeaders.add(bestMatch);
      }
    }
  });

  console.log('Mapping suggéré:', mapping);
  return mapping;
}

function validateExcelColumns(headers) {
  if (!headers || !Array.isArray(headers)) {
    throw new Error('Les en-têtes doivent être un tableau non vide');
  }

  const stringHeaders = headers.map(h => String(h || '').trim());
  const mapping = suggestColumnMapping(stringHeaders);
  const missingColumns = [];

  // Vérifier les colonnes requises
  Object.entries(REQUIRED_COLUMNS).forEach(([field, config]) => {
    if (!mapping[field]) {
      missingColumns.push(field);
    }
  });

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    mapping
  };
}

function validateExcelData(data) {
  const errors = [];
  const seenTokens = new Set();
  const seenHouseholds = new Set();

  data.forEach((row, index) => {
    // Validate required fields
    Object.entries(REQUIRED_COLUMNS).forEach(([field, config]) => {
      const error = config.validate(row[field]);
      if (error) {
        errors.push(`Ligne ${index + 2}: ${error}`);
      }
    });

    // Validate unique token
    if (row.token_number) {
      if (seenTokens.has(row.token_number)) {
        errors.push(`Ligne ${index + 2}: Le numéro de jeton '${row.token_number}' est en double`);
      }
      seenTokens.add(row.token_number);
    }

    // Validate unique household per site
    if (row.site_name && row.household_id) {
      const householdKey = `${row.site_name}|${row.household_id}`;
      if (seenHouseholds.has(householdKey)) {
        errors.push(`Ligne ${index + 2}: La combinaison site '${row.site_name}' et ID ménage '${row.household_id}' est en double`);
      }
      seenHouseholds.add(householdKey);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_COLUMNS,
  suggestColumnMapping,
  validateExcelColumns,
  validateExcelData
};
