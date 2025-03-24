import * as XLSX from 'xlsx';

const data = [
  {
    "site_name": "Kinshasa Centre",
    "household_id": "HH001",
    "token_number": "TK001",
    "beneficiary_count": 4,
    "first_name": "Jean",
    "middle_name": "Pierre",
    "last_name": "Dupont"
  },
  {
    "site_name": "Goma Est",
    "household_id": "HH002",
    "token_number": "TK002",
    "beneficiary_count": 3,
    "first_name": "Marie",
    "middle_name": "Claire",
    "last_name": "Martin"
  },
  {
    "site_name": "Bukavu Sud",
    "household_id": "HH003",
    "token_number": "TK003",
    "beneficiary_count": 5,
    "first_name": "Paul",
    "middle_name": "Jacques",
    "last_name": "Dubois"
  },
  {
    "site_name": "Lubumbashi Nord",
    "household_id": "HH004",
    "token_number": "TK004",
    "beneficiary_count": 2,
    "first_name": "Sophie",
    "middle_name": "Anne",
    "last_name": "Leroy"
  },
  {
    "site_name": "Kisangani Ouest",
    "household_id": "HH005",
    "token_number": "TK005",
    "beneficiary_count": 6,
    "first_name": "Michel",
    "middle_name": "Robert",
    "last_name": "Bernard"
  }
];

// Créer un nouveau workbook
const wb = XLSX.utils.book_new();

// Convertir les données en feuille de calcul
const ws = XLSX.utils.json_to_sheet(data);

// Ajouter la feuille au workbook
XLSX.utils.book_append_sheet(wb, ws, "Households");

// Écrire le fichier
XLSX.writeFile(wb, "test_data.xlsx");

console.log("Fichier Excel généré avec succès : test_data.xlsx");
