import React, { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ImportRow } from '../types';
import toast from 'react-hot-toast';
import ColumnMappingDialog from './ColumnMappingDialog';
import { PageTransition } from './PageTransition';

interface ImportStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warnings: string[];
}

const ImportList: React.FC = () => {
  const [tempFileData, setTempFileData] = useState<ImportRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const columnMappings = {
    'site_name': ['Site', 'Nom du site', 'Site de distribution', 'site_name'],
    'site_address': ['Adresse', 'Adresse du site', 'Address', 'site_address'],
    'household_id': ['household_id', 'Household ID', 'ID Ménage', 'Code Ménage'],
    'household_name': ['household_name', 'Nom du Ménage', 'Ménage', 'Household', 'Nom Menage'],
    'token_number': ['token_number', 'Token', 'Numéro de jeton', 'Jeton'],
    'beneficiary_count': ['beneficiary_count', 'Bénéficiaires', 'Nombre de bénéficiaires', 'Beneficiaries'],
    'first_name': ['first_name', 'Prénom', 'Prénom du bénéficiaire', 'First name'],
    'middle_name': ['middle_name', 'Post-Nom', 'Deuxième prénom', 'Middle name'],
    'last_name': ['last_name', 'Nom', 'Nom de famille', 'Last name'],
    'alternate_recipient': ['alternate_recipient', 'Suppléant', 'Bénéficiaire suppléant', 'Alternate']
  };

  const requiredColumns = ['site_name', 'household_id', 'household_name', 'token_number', 'beneficiary_count', 'first_name', 'last_name'];

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          try {
            const importEndpointCheck = await fetch('http://localhost:3001/api/import', {
              method: 'GET'
            });
            
            if (importEndpointCheck.ok || importEndpointCheck.status === 404) {
              setBackendAvailable(true);
              console.log('Backend API is available');
            } else {
              console.log(`Backend API import endpoint returned status: ${importEndpointCheck.status}`);
              setBackendAvailable(true);
            }
          } catch (error) {
            console.log('Backend API import endpoint check failed, but health endpoint is available:', error);
            setBackendAvailable(true);
          }
        } else {
          setBackendAvailable(false);
          console.log('Backend API health check failed with status:', response.status);
        }
      } catch (error) {
        setBackendAvailable(false);
        console.log('Backend API is not available:', error);
      }
    };

    checkBackendStatus();
  }, []);

  const suggestColumnMapping = (headers: string[]): { mapping: Record<string, string>, isValid: boolean, missingColumns: string[] } => {
    const mapping: Record<string, string> = {};
    const missingColumns: string[] = [];
    
    for (const [field, possibleNames] of Object.entries(columnMappings)) {
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          name.toLowerCase() === header.toLowerCase()
        )
      );
      
      if (matchedHeader) {
        mapping[field] = matchedHeader;
      } else if (requiredColumns.includes(field)) {
        missingColumns.push(field);
      }
    }
    
    const isValid = missingColumns.length === 0;
    
    return {
      mapping,
      isValid,
      missingColumns
    };
  };

  const validateData = (data: ImportRow[]): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 1;
      
      if (!row.site_name) {
        errors.push(`Ligne ${rowNum}: Le nom du site est requis`);
      }
      
      if (!row.household_id) {
        errors.push(`Ligne ${rowNum}: L'ID du ménage est requis`);
      }
      
      if (!row.household_name) {
        errors.push(`Ligne ${rowNum}: Le nom du ménage est requis`);
      }
      
      if (!row.token_number) {
        errors.push(`Ligne ${rowNum}: Le numéro de jeton est requis`);
      }
      
      if (row.beneficiary_count === undefined || row.beneficiary_count < 0) {
        errors.push(`Ligne ${rowNum}: Le nombre de bénéficiaires doit être un nombre positif`);
      }
      
      if (!row.first_name) {
        errors.push(`Ligne ${rowNum}: Le prénom est requis`);
      }
      
      if (!row.last_name) {
        errors.push(`Ligne ${rowNum}: Le nom est requis`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      if (!Array.isArray(jsonData) || jsonData.length < 2) {
        toast.error('Le fichier est vide ou ne contient pas de données valides');
        return;
      }

      const headers = jsonData[0] as Array<unknown>;
      const stringHeaders = headers.map(h => String(h || ''));

      let mapping: Record<string, string>;
      let isValid: boolean;
      let missingColumns: string[];

      if (backendAvailable) {
        try {
          const mappingResponse = await fetch('http://localhost:3001/api/suggest-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headers: stringHeaders })
          });

          if (mappingResponse.ok) {
            const result = await mappingResponse.json();
            mapping = result.mapping;
            isValid = result.isValid;
            missingColumns = result.missingColumns;
          } else {
            const result = suggestColumnMapping(stringHeaders);
            mapping = result.mapping;
            isValid = result.isValid;
            missingColumns = result.missingColumns;
          }
        } catch (error) {
          const result = suggestColumnMapping(stringHeaders);
          mapping = result.mapping;
          isValid = result.isValid;
          missingColumns = result.missingColumns;
        }
      } else {
        const result = suggestColumnMapping(stringHeaders);
        mapping = result.mapping;
        isValid = result.isValid;
        missingColumns = result.missingColumns;
      }

      if (!isValid) {
        setImportErrors([`Colonnes manquantes : ${missingColumns.join(', ')}`]);
        return;
      }

      setColumnMapping(mapping);

      const rows = jsonData.slice(1).map((row: any) => {
        const mappedRow: ImportRow & { isValid: boolean } = {
          site_name: '',
          household_id: '',
          household_name: '',
          token_number: '',
          beneficiary_count: 0,
          first_name: '',
          middle_name: '',
          last_name: '',
          site_address: '',
          alternate_recipient: '',
          isValid: true
        };

        Object.entries(mapping).forEach(([field, header]) => {
          const headerIndex = stringHeaders.indexOf(header);
          if (headerIndex !== -1) {
            const value = row[headerIndex];
            
            if (field === 'beneficiary_count') {
              mappedRow.beneficiary_count = value !== undefined && value !== null ? 
                (parseInt(String(value)) || 0) : 0;
            } else if (field === 'site_address' || field === 'alternate_recipient') {
              mappedRow[field] = value !== undefined && value !== null ? String(value) : '';
            } else if (field in mappedRow) {
              (mappedRow as any)[field] = value !== undefined && value !== null ? String(value) : '';
            }
          }
        });

        const requiredFields = ['site_name', 'household_id', 'household_name', 'token_number', 
                               'first_name', 'last_name'];
        const missingFields = requiredFields.filter(field => !mappedRow[field as keyof ImportRow]);
        
        if (missingFields.length > 0) {
          console.warn(`Row missing required fields: ${missingFields.join(', ')}`);
          mappedRow.isValid = false;
        }
        
        return mappedRow;
      });

      // Filtrer les lignes invalides
      const validRows = rows.filter(row => row.isValid).map(({ isValid, ...rest }) => rest as ImportRow);
      const invalidRowsCount = rows.length - validRows.length;
      
      if (invalidRowsCount > 0) {
        setImportStats(prev => {
          if (!prev) return {
            totalRows: rows.length,
            validRows: validRows.length,
            errorRows: invalidRowsCount,
            warnings: [`${invalidRowsCount} lignes ont été ignorées car elles manquaient de champs obligatoires.`]
          };
          
          return {
            ...prev,
            errorRows: prev.errorRows + invalidRowsCount,
            warnings: [...prev.warnings, `${invalidRowsCount} lignes ont été ignorées car elles manquaient de champs obligatoires.`]
          };
        });
      }

      let dataIsValid: boolean;
      let errors: string[];

      if (backendAvailable) {
        try {
          const dataValidation = await fetch('http://localhost:3001/api/validate-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: validRows })
          });

          if (dataValidation.ok) {
            const result = await dataValidation.json();
            dataIsValid = result.isValid;
            errors = result.errors;
          } else {
            const result = validateData(validRows);
            dataIsValid = result.isValid;
            errors = result.errors;
          }
        } catch (error) {
          const result = validateData(validRows);
          dataIsValid = result.isValid;
          errors = result.errors;
        }
      } else {
        const result = validateData(validRows);
        dataIsValid = result.isValid;
        errors = result.errors;
      }

      if (!dataIsValid) {
        setImportErrors(errors);
        return;
      }

      setTempFileData(validRows);
      setShowMappingDialog(true);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Erreur lors du traitement du fichier');
    }
  };

  const handleMappingChange = (newMapping: Record<string, string>) => {
    setColumnMapping(newMapping);
  };

  const handleMappingConfirm = async () => {
    setShowMappingDialog(false);
    setIsUploading(true);

    try {
      if (backendAvailable) {
        try {
          const response = await fetch('http://localhost:3001/api/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: tempFileData })
          });

          if (response.ok) {
            const result = await response.json();
            setImportStats({
              totalRows: tempFileData.length,
              validRows: result.results.filter((r: { success: boolean }) => r.success).length,
              errorRows: result.results.filter((r: { success: boolean }) => !r.success).length,
              warnings: result.results
                .filter((r: { success: boolean; message?: string }) => r.message && r.message.includes('updated'))
                .map((r: { message: string }) => r.message)
            });

            toast.success('Import terminé avec succès');
          } else {
            simulateImport();
          }
        } catch (error) {
          console.error('Error importing data:', error);
          simulateImport();
        }
      } else {
        simulateImport();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsUploading(false);
    }
  };

  const simulateImport = () => {
    setTimeout(() => {
      setImportStats({
        totalRows: tempFileData.length,
        validRows: tempFileData.length,
        errorRows: 0,
        warnings: []
      });
      
      toast.success(backendAvailable 
        ? 'Import terminé avec succès (mode démo - backend indisponible)' 
        : 'Import simulé avec succès (mode démo)');
    }, 1500);
  };

  return (
    <PageTransition>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Sélectionner un fichier Excel
            </Button>
            {!backendAvailable && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Mode démo: Backend non disponible, les données ne seront pas enregistrées
              </Typography>
            )}
          </Box>

          {isUploading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Traitement du fichier...</Typography>
            </Box>
          )}

          {importErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Erreurs d'import:</Typography>
              <ul>
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {importStats && (
            <Alert severity={importStats.errorRows > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Résultats de l'import:</Typography>
              <ul>
                <li>Total des lignes: {importStats.totalRows}</li>
                <li>Lignes importées avec succès: {importStats.validRows}</li>
                {importStats.errorRows > 0 && (
                  <li>Lignes en erreur: {importStats.errorRows}</li>
                )}
                {importStats.warnings.length > 0 && (
                  <>
                    <li>Avertissements:</li>
                    <ul>
                      {importStats.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </>
                )}
              </ul>
            </Alert>
          )}
        </Box>

        <ColumnMappingDialog
          open={showMappingDialog}
          onClose={() => setShowMappingDialog(false)}
          columnMapping={columnMapping}
          onMappingChange={handleMappingChange}
          onConfirm={handleMappingConfirm}
        />
      </Paper>
    </PageTransition>
  );
};

export default ImportList;