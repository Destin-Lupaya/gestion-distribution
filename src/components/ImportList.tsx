import React, { useState } from 'react';
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

      // Get column mapping suggestion from backend
      const mappingResponse = await fetch('http://localhost:3001/api/suggest-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: stringHeaders })
      });

      if (!mappingResponse.ok) {
        throw new Error('Erreur lors de la suggestion du mapping des colonnes');
      }

      const { mapping, validation } = await mappingResponse.json();

      if (!validation.isValid) {
        setImportErrors(validation.errors);
        return;
      }

      // Transform data using the mapping
      const rows = jsonData.slice(1).map((row: any) => {
        const mappedRow: ImportRow = {
          site_name: '',
          household_id: '',
          household_name: '',
          token_number: '',
          beneficiary_count: 0,
          first_name: '',
          middle_name: '',
          last_name: '',
          site_address: undefined,
          alternate_recipient: undefined
        };

        Object.entries(mapping).forEach(([field, header]) => {
          const headerIndex = stringHeaders.indexOf(header);
          if (headerIndex !== -1) {
            const value = row[headerIndex];
            if (field === 'beneficiary_count') {
              mappedRow.beneficiary_count = parseInt(String(value)) || 0;
            } else if (field in mappedRow) {
              (mappedRow as any)[field] = String(value || '');
            }
          }
        });
        return mappedRow;
      });

      // Validate transformed data
      const dataValidation = await fetch('http://localhost:3001/api/validate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows })
      });

      if (!dataValidation.ok) {
        throw new Error('Erreur lors de la validation des données');
      }

      const { isValid, errors } = await dataValidation.json();

      if (!isValid) {
        setImportErrors(errors);
        return;
      }

      setTempFileData(rows);
      setColumnMapping(mapping);
      setImportErrors([]);
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
      const response = await fetch('http://localhost:3001/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: tempFileData })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }

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
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsUploading(false);
    }
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
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Résultats de l'import:</Typography>
              <ul>
                <li>Total des lignes: {importStats.totalRows}</li>
                <li>Lignes importées: {importStats.validRows}</li>
                <li>Lignes en erreur: {importStats.errorRows}</li>
                {importStats.warnings.length > 0 && (
                  <li>
                    Avertissements:
                    <ul>
                      {importStats.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </li>
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