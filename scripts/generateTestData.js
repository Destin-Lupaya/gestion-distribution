import * as XLSX from 'xlsx';

const data = [
  {
    "Site": "Site A",
    "ID Ménage": "HH001",
    "Nom du Ménage": "Famille Dupont",
    "Token": "TK001",
    "Bénéficiaires": 4,
    "Prénom": "Jean",
    "Nom": "Dupont"
  },
  {
    "Site": "Site B",
    "ID Ménage": "HH002",
    "Nom du Ménage": "Famille Martin",
    "Token": "TK002",
    "Bénéficiaires": 3,
    "Prénom": "Marie",
    "Nom": "Martin"
  },
  {
    "Site": "Site A",
    "ID Ménage": "HH003",
    "Nom du Ménage": "Famille Bernard",
    "Token": "TK003",
    "Bénéficiaires": 5,
    "Prénom": "Pierre",
    "Nom": "Bernard"
  }
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiaires");
XLSX.writeFile(workbook, "test_data.xlsx");
