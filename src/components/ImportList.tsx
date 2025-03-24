import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import {
  Paper,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PageTransition } from './PageTransition';
import ManualRegistration from './ManualRegistration';
import ColumnMappingDialog from './ColumnMappingDialog';
import toast from 'react-hot-toast';
import * as databaseService from '../services/databaseService';
import { 
  transformExcelData, 
  validateExcelData,
  suggestColumnMapping, 
  getFieldOptions,
  EXCEL_MAPPINGS,
  ExcelColumnMapping,
  validateExcelColumns,
  validateExcelRow
} from '../lib/excelMapping';
import {
  parseExcel,
  parseCSV,
  isExcelFile,
  isCSVFile,
  validateFileType
} from '../lib/fileParser';
import { Site, Household, Recipient } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ColumnMapping {
  [key: string]: string;
}

interface ImportStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warnings: string[];
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function ImportList() {
  const [tabValue, setTabValue] = useState(0);
  const [beneficiaires, setBeneficiaires] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [tempFileData, setTempFileData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [importStats, setImportStats] = useState<ImportStats>({
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    warnings: []
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const sitesList = await databaseService.getAllSites();
      setSites(sitesList);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Erreur lors du chargement des sites');
    }
  };

  const columns: GridColDef[] = [
    { field: 'site_name', headerName: 'Site', flex: 1 },
    { field: 'household_id', headerName: 'ID Ménage', flex: 1 },
    { field: 'household_name', headerName: 'Nom du Ménage', flex: 1 },
    { field: 'token_number', headerName: 'Token', flex: 1 },
    { field: 'beneficiary_count', headerName: 'Bénéficiaires', width: 120, type: 'number' },
    { field: 'first_name', headerName: 'Prénom', flex: 1 },
    { field: 'middle_name', headerName: 'Post-Nom', flex: 1 },
    { field: 'last_name', headerName: 'Nom', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleDelete(params.row.id)}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      return;
    }

    try {
      await databaseService.deleteRecipient(id);
      setBeneficiaires(prev => prev.filter(b => b.id !== id));
      toast.success('Bénéficiaire supprimé avec succès');
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true);
      setError(null);

      const file = event.target.files?.[0];
      if (!file) {
        setError('Aucun fichier sélectionné');
        return;
      }

      // Valider le type de fichier
      const fileError = validateFileType(file);
      if (fileError) {
        setError(fileError);
        return;
      }

      console.log('Parsing Excel file...');
      
      // Parser le fichier selon son type
      const { headers, data } = isExcelFile(file) 
        ? await parseExcel(file)
        : await parseCSV(file);

      console.log('File headers:', headers);
      console.log('First row:', data[0]);
      console.log('Total rows:', data.length);

      if (!headers || !data || data.length === 0) {
        setError('Le fichier ne contient pas de données valides');
        return;
      }

      // Suggérer un mapping automatique
      const suggestedMapping = suggestColumnMapping(headers);
      console.log('Available columns:', headers);
      console.log('Suggested mapping:', suggestedMapping);
      console.log('Expected fields:', Object.keys(EXCEL_MAPPINGS));

      // Vérifier que nous avons au moins quelques colonnes mappées
      const mappedColumns = Object.values(suggestedMapping).filter(Boolean);
      if (mappedColumns.length === 0) {
        setError('Aucune colonne n\'a pu être mappée automatiquement. Veuillez vérifier le format du fichier.');
        return;
      }

      // Mettre à jour l'état
      setAvailableColumns(headers);
      setColumnMapping(suggestedMapping);
      setTempFileData(data);
      setShowMappingDialog(true);

    } catch (error) {
      console.error('Erreur lors de l\'import :', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'import du fichier');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setImportErrors([]);

    try {
      console.log('tempFileData:', tempFileData);
      console.log('columnMapping:', columnMapping);
      
      if (!Array.isArray(tempFileData)) {
        console.error('Data is not an array:', tempFileData);
        toast.error('Format de données invalide');
        return;
      }

      // Générer le mapping automatiquement si aucun mapping n'est défini
      const finalMapping = Object.keys(columnMapping).length === 0 
        ? suggestColumnMapping(Object.keys(tempFileData[0] || {}))
        : columnMapping;
      
      console.log('Using column mapping:', finalMapping);

      const { data, errors } = transformExcelData(tempFileData, finalMapping);
      
      if (errors.length > 0) {
        setImportErrors(errors);
        toast.error(`Validation: ${errors.length} erreurs trouvées`);
        return;
      }

      const importErrors: string[] = [];
      const now = new Date().toISOString();

      for (const [index, row] of data.entries()) {
        try {
          let site;
          if (row.site_name) {
            site = await databaseService.createSite({
              nom: row.site_name,
              adresse: row.site_address || '',
              created_at: now,
              updated_at: now
            });
          }

          const household = await databaseService.createHousehold({
            site_id: site?.id,
            nom_menage: row.household_name,
            token_number: row.token_number || '',
            nombre_beneficiaires: row.beneficiary_count || 0,
            created_at: now,
            updated_at: now
          });

          await databaseService.createRecipient({
            household_id: household.id,
            first_name: row.first_name,
            middle_name: row.middle_name || '',
            last_name: row.last_name,
            is_primary: true,
            created_at: now,
            updated_at: now
          });

          if (row.alternate_recipient) {
            const [firstName, ...lastNameParts] = row.alternate_recipient.split(' ');
            await databaseService.createRecipient({
              household_id: household.id,
              first_name: firstName,
              middle_name: '',
              last_name: lastNameParts.join(' ') || firstName,
              is_primary: false,
              created_at: now,
              updated_at: now
            });
          }
        } catch (error) {
          console.error(`Error importing row ${index + 1}:`, error);
          importErrors.push(`Ligne ${index + 1}: ${error.message || 'Erreur inconnue'}`);
        }
      }

      if (importErrors.length === 0) {
        toast.success('Importation terminée avec succès');
        setShowMappingDialog(false);
        setTempFileData([]);
        setColumnMapping({});
      } else {
        setImportErrors(importErrors);
        toast.error(`Importation terminée avec ${importErrors.length} erreurs`);
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Erreur lors de l\'importation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoMap = () => {
    const mapping = suggestColumnMapping(availableColumns);
    setColumnMapping(mapping);
  };

  const handleMappingChange = (newMapping: { [key: string]: string }) => {
    setColumnMapping(newMapping);
  };

  const handleMappingConfirm = () => {
    try {
      if (!tempFileData || tempFileData.length === 0) {
        throw new Error('Aucune donnée à importer');
      }

      console.log('Starting data transformation...');
      console.log('Column mapping:', columnMapping);
      console.log('Sample data:', tempFileData.slice(0, 2));

      // Transformer les données avec le mapping choisi
      const transformedData = transformExcelData(tempFileData, columnMapping);
      console.log('Transformation result:', {
        rowCount: transformedData.data.length,
        sampleRow: transformedData.data[0],
        errorCount: transformedData.errors.length
      });

      // Valider les données
      const dataValidation = validateExcelData(transformedData.data);
      console.log('Validation result:', {
        isValid: dataValidation.isValid,
        errorCount: dataValidation.errors.length,
        sampleErrors: dataValidation.errors.slice(0, 3)
      });

      if (!dataValidation.isValid) {
        setError(
          'Erreurs dans les données :\n' +
          dataValidation.errors.join('\n')
        );
        return;
      }

      // Si tout est valide, afficher les données
      setImportData(transformedData.data);
      
      // Afficher les statistiques
      const stats = {
        totalRows: transformedData.data.length,
        validRows: transformedData.data.length,
        errorRows: transformedData.errors.length,
        warnings: transformedData.errors
      };
      console.log('Import stats:', stats);
      setImportStats(stats);

      setShowMappingDialog(false);
      
      // Afficher un message de succès
      toast.success(`${transformedData.data.length} lignes importées avec succès`);

    } catch (error) {
      console.error('Erreur lors de la transformation :', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la transformation des données');
    }
  };

  const filteredBeneficiaires = useMemo(() => {
    return beneficiaires.filter(b => {
      const matchesSearch = (
        b.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.household?.token_number.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesSite = filterSite === 'all' || b.household?.site_id.toString() === filterSite;

      return matchesSearch && matchesSite;
    });
  }, [beneficiaires, searchTerm, filterSite]);

  return (
    <PageTransition>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Liste des Bénéficiaires" />
            <Tab label="Enregistrement Manuel" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrer par site</InputLabel>
              <Select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                label="Filtrer par site"
              >
                <MenuItem value="all">Tous les sites</MenuItem>
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id.toString()}>
                    {site.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />

            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Importation...' : 'Importer'}
            </Button>
          </Box>

          {importErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Erreurs d'importation:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {importStats.totalRows > 0 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="h6">Statistiques d'import</Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary={`Total des lignes : ${importStats.totalRows}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Lignes valides : ${importStats.validRows}`}
                    secondary={`${Math.round((importStats.validRows / importStats.totalRows) * 100)}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Lignes avec erreurs : ${importStats.errorRows}`}
                    secondary={importStats.errorRows > 0 ? 'Veuillez corriger les erreurs avant de continuer' : ''}
                    sx={{ color: importStats.errorRows > 0 ? 'error.main' : 'inherit' }}
                  />
                </ListItem>
              </List>

              {/* Affichage des avertissements */}
              {importStats.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <AlertTitle>Avertissements</AlertTitle>
                  <List>
                    {importStats.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Erreurs</AlertTitle>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {error}
              </pre>
            </Alert>
          )}

          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredBeneficiaires}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  }
                }
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              loading={isLoading}
            />
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ManualRegistration onRegistrationComplete={() => setTabValue(0)} />
        </TabPanel>

        <ColumnMappingDialog
          open={showMappingDialog}
          onClose={() => !isLoading && setShowMappingDialog(false)}
          availableColumns={availableColumns}
          columnMapping={columnMapping}
          onMappingChange={handleMappingChange}
          onConfirm={handleMappingConfirm}
        />
      </Paper>
    </PageTransition>
  );
}

export default ImportList;