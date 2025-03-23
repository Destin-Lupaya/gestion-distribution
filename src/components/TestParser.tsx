import React, { useState } from 'react';
import { Button, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material';
import { parseExcel, parseCSV, downloadExcelFile } from '../lib/excelParser';

interface ParsedData {
  siteDistribution: string;
  householdId: string;
  nomMenage: string;
  tokenNumber: string;
  nombreBeneficiaires: number;
  recipientFirstName: string;
  recipientMiddleName?: string;
  recipientLastName: string;
  adresse: string;
  nomSuppleant?: string;
  dateInscription: string;
}

const sampleData: ParsedData[] = [
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
    recipientMiddleName: "",
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
    nomSuppleant: "",
    dateInscription: "2025-03-21"
  }
];

export default function TestParser() {
  const [parseResult, setParseResult] = useState<ParsedData[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      let result;
      if (file.name.toLowerCase().endsWith('.csv')) {
        result = await parseCSV(file);
      } else {
        result = await parseExcel(file);
      }
      setParseResult(result);
      console.log('Parsed data:', result);
    } catch (error) {
      console.error('Error parsing file:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors du parsing du fichier');
    }
  };

  const handleGenerateExcel = () => {
    try {
      downloadExcelFile(sampleData, 'donnees_test.xlsx');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la génération du fichier Excel');
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Test Excel/CSV Parser
      </Typography>
      
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="contained" component="span">
            Sélectionner un fichier
          </Button>
        </label>
        <Button variant="outlined" onClick={handleGenerateExcel}>
          Générer fichier Excel test
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {parseResult.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Données importées ({parseResult.length} enregistrements):
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell>ID Ménage</TableCell>
                  <TableCell>Nom Ménage</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell>Nb. Bénéf.</TableCell>
                  <TableCell>Nom Complet</TableCell>
                  <TableCell>Adresse</TableCell>
                  <TableCell>Suppléant</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parseResult.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.siteDistribution}</TableCell>
                    <TableCell>{row.householdId}</TableCell>
                    <TableCell>{row.nomMenage}</TableCell>
                    <TableCell>{row.tokenNumber}</TableCell>
                    <TableCell>{row.nombreBeneficiaires}</TableCell>
                    <TableCell>
                      {`${row.recipientFirstName} ${row.recipientMiddleName || ''} ${row.recipientLastName}`.trim()}
                    </TableCell>
                    <TableCell>{row.adresse}</TableCell>
                    <TableCell>{row.nomSuppleant || '-'}</TableCell>
                    <TableCell>{row.dateInscription}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
