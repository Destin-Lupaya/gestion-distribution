const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Définir les en-têtes avec des commentaires
const headers = [
  'site_name', // Nom du site de distribution (OBLIGATOIRE)
  'household_id', // Identifiant unique du ménage (OBLIGATOIRE)
  'household_name', // Nom du ménage bénéficiaire (OBLIGATOIRE)
  'token_number', // Numéro de jeton unique (OBLIGATOIRE)
  'beneficiary_count', // Nombre de personnes dans le ménage (OBLIGATOIRE)
  'first_name', // Prénom du bénéficiaire principal (OBLIGATOIRE)
  'middle_name', // Post-nom/deuxième prénom (OPTIONNEL)
  'last_name', // Nom de famille du bénéficiaire principal (OBLIGATOIRE)
  'site_address', // Adresse du site de distribution (OPTIONNEL)
  'alternate_recipient' // Nom du bénéficiaire suppléant (OPTIONNEL)
];

// Données d'exemple
const exampleData = [
  [
    'Kinshasa Est', 
    'MEN001', 
    'Famille Dupont', 
    'TOK001', 
    4, 
    'Jean', 
    'Pierre', 
    'Dupont', 
    '123 Avenue Principale', 
    'Marie Dupont'
  ],
  [
    'Kinshasa Ouest', 
    'MEN002', 
    'Famille Martin', 
    'TOK002', 
    3, 
    'Paul', 
    'Jacques', 
    'Martin', 
    '456 Rue Secondaire', 
    ''
  ],
  [
    'Kinshasa Sud', 
    'MEN003', 
    'Famille Dubois', 
    'TOK003', 
    5, 
    'Sophie', 
    '', 
    'Dubois', 
    '789 Boulevard Central', 
    ''
  ]
];

// Créer un nouveau classeur
const workbook = xlsx.utils.book_new();

// Créer une feuille d'instructions
const instructionsData = [
  ['INSTRUCTIONS POUR L\'IMPORTATION DE DONNÉES'],
  [''],
  ['Champs obligatoires:'],
  ['- site_name (Nom du site de distribution)'],
  ['- household_id (Identifiant unique du ménage)'],
  ['- household_name (Nom du ménage bénéficiaire)'],
  ['- token_number (Numéro de jeton unique)'],
  ['- beneficiary_count (Nombre de personnes dans le ménage)'],
  ['- first_name (Prénom du bénéficiaire principal)'],
  ['- last_name (Nom de famille du bénéficiaire principal)'],
  [''],
  ['Champs optionnels:'],
  ['- middle_name (Deuxième prénom/Post-nom du bénéficiaire principal)'],
  ['- site_address (Adresse du site de distribution)'],
  ['- alternate_recipient (Nom du bénéficiaire suppléant)'],
  [''],
  ['Notes importantes:'],
  ['1. Ne modifiez pas les noms des colonnes.'],
  ['2. Assurez-vous que tous les champs obligatoires sont remplis pour chaque ligne.'],
  ['3. Les lignes avec des champs obligatoires manquants seront ignorées lors de l\'importation.'],
  ['4. Le numéro de jeton doit être unique pour chaque ménage.'],
  ['5. L\'ID Ménage doit être unique pour chaque site.'],
  [''],
  ['Pour importer ce fichier:'],
  ['1. Remplissez toutes les données nécessaires dans l\'onglet "Données".'],
  ['2. Enregistrez le fichier au format Excel (.xlsx).'],
  ['3. Dans l\'application, cliquez sur "Importer" et sélectionnez ce fichier.']
];

const instructionsWs = xlsx.utils.aoa_to_sheet(instructionsData);

// Ajuster la largeur des colonnes pour les instructions
instructionsWs['!cols'] = [{ wch: 80 }];

// Ajouter la feuille d'instructions au classeur
xlsx.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');

// Créer une feuille de données avec les en-têtes et les exemples
const dataWs = xlsx.utils.aoa_to_sheet([headers, ...exampleData]);

// Ajuster la largeur des colonnes pour les données
dataWs['!cols'] = headers.map(() => ({ wch: 20 }));

// Ajouter des commentaires pour les en-têtes
const headerComments = {
  A1: { t: 'OBLIGATOIRE: Nom du site de distribution' },
  B1: { t: 'OBLIGATOIRE: Identifiant unique du ménage' },
  C1: { t: 'OBLIGATOIRE: Nom du ménage bénéficiaire' },
  D1: { t: 'OBLIGATOIRE: Numéro de jeton unique' },
  E1: { t: 'OBLIGATOIRE: Nombre de personnes dans le ménage' },
  F1: { t: 'OBLIGATOIRE: Prénom du bénéficiaire principal' },
  G1: { t: 'OPTIONNEL: Post-nom/deuxième prénom' },
  H1: { t: 'OBLIGATOIRE: Nom de famille du bénéficiaire principal' },
  I1: { t: 'OPTIONNEL: Adresse du site de distribution' },
  J1: { t: 'OPTIONNEL: Nom du bénéficiaire suppléant' }
};

dataWs['!comments'] = headerComments;

// Ajouter la feuille de données au classeur
xlsx.utils.book_append_sheet(workbook, dataWs, 'Données');

// Définir le chemin de sortie
const outputPath = path.resolve(__dirname, '..', 'modele_import_excel.xlsx');

// Écrire le fichier Excel
xlsx.writeFile(workbook, outputPath);

console.log(`Modèle Excel créé avec succès: ${outputPath}`);

// Créer également un modèle CSV
const csvContent = [
  headers.join(','),
  ...exampleData.map(row => row.join(','))
].join('\n');

const csvPath = path.resolve(__dirname, '..', 'modele_import.csv');
fs.writeFileSync(csvPath, csvContent, 'utf8');

console.log(`Modèle CSV créé avec succès: ${csvPath}`);
