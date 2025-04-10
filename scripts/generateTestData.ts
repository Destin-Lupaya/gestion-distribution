import * as XLSX from 'xlsx';

const testData = [
  {
    siteDistribution: "Kinshasa Centre",
    householdId: "KIN001",
    nomMenage: "Famille Mutombo",
    tokenNumber: "TK001",
    nombreBeneficiaires: 5,
    recipientFirstName: "Jean",
    recipientMiddleName: "Pierre",
    recipientLastName: "Mutombo",
    adresse: "123 Avenue de la Paix",
    nomSuppleant: "Marie Mutombo",
    dateInscription: "2025-03-21"
  },
  {
    siteDistribution: "Kinshasa Est",
    householdId: "KIN002",
    nomMenage: "Famille Kabongo",
    tokenNumber: "TK002",
    nombreBeneficiaires: 3,
    recipientFirstName: "Paul",
    recipientMiddleName: null,
    recipientLastName: "Kabongo",
    adresse: "45 Avenue du Commerce",
    nomSuppleant: "Sarah Kabongo",
    dateInscription: "2025-03-21"
  },
  {
    siteDistribution: "Kinshasa Ouest",
    householdId: "KIN003",
    nomMenage: "Famille Lukaku",
    tokenNumber: "TK003",
    nombreBeneficiaires: 4,
    recipientFirstName: "David",
    recipientMiddleName: "James",
    recipientLastName: "Lukaku",
    adresse: "78 Avenue des Arts",
    nomSuppleant: null,
    dateInscription: "2025-03-21"
  },
  {
    siteDistribution: "Kinshasa Centre",
    householdId: "KIN004",
    nomMenage: "Famille Mbuyi",
    tokenNumber: "TK004",
    nombreBeneficiaires: 6,
    recipientFirstName: "Sophie",
    recipientMiddleName: "Marie",
    recipientLastName: "Mbuyi",
    adresse: "90 Avenue du Marché",
    nomSuppleant: "Pierre Mbuyi",
    dateInscription: "2025-03-21"
  },
  {
    siteDistribution: "Kinshasa Est",
    householdId: "KIN005",
    nomMenage: "Famille Tshilumba",
    tokenNumber: "TK005",
    nombreBeneficiaires: 4,
    recipientFirstName: "Marc",
    recipientMiddleName: null,
    recipientLastName: "Tshilumba",
    adresse: "34 Avenue de l'École",
    nomSuppleant: "Anne Tshilumba",
    dateInscription: "2025-03-21"
  }
];

// Créer le workbook Excel
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);

// Ajouter la feuille au workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiaires");

// Écrire le fichier
XLSX.writeFile(workbook, "donnees_test.xlsx");
