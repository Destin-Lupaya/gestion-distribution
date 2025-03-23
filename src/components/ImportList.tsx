import React, { useState, useMemo, useEffect } from 'react';
import { 
  Paper, 
  Button, 
  Typography,
  TextField,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PageTransition } from './PageTransition';
import ManualRegistration from './ManualRegistration';
import toast from 'react-hot-toast';
import { typedSupabase } from '../lib/supabase';
import { 
  validateExcelRow, 
  transformExcelData, 
  getFieldOptions,
  autoMapColumns
} from '../lib/excelMapping';
import { Beneficiaire } from '../types';
import { parseExcel, parseCSV, isExcelFile, isCSVFile, validateFileType } from '../lib/excelParser';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ColumnMapping {
  [key: string]: string;
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
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
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
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const columns: GridColDef[] = [
    { field: 'siteDistribution', headerName: 'Site', flex: 1 },
    { field: 'householdId', headerName: 'ID Ménage', flex: 1 },
    { field: 'nomMenage', headerName: 'Nom du Ménage', flex: 1 },
    { field: 'tokenNumber', headerName: 'Token', flex: 1 },
    { field: 'nombreBeneficiaires', headerName: 'Bénéficiaires', width: 120, type: 'number' },
    { field: 'recipientFirstName', headerName: 'Prénom', flex: 1 },
    { field: 'recipientLastName', headerName: 'Nom', flex: 1 },
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await typedSupabase
        .from('menages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBeneficiaires(prev => prev.filter(b => b.id !== id));
      toast.success('Bénéficiaire supprimé avec succès');
    } catch (err) {
      console.error('Error deleting beneficiary:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const fetchBeneficiaires = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await typedSupabase
        .from('menages')
        .select(`
          id,
          household_id,
          nom_menage,
          token_number,
          nombre_beneficiaires,
          sites_distribution!inner (
            nom,
            adresse
          ),
          beneficiaires!inner (
            id,
            first_name,
            middle_name,
            last_name,
            est_principal
          )
        `)
        .eq('beneficiaires.est_principal', true);

      if (fetchError) throw fetchError;

      if (data) {
        const transformedData = data.map(item => ({
          id: item.id,
          siteDistribution: item.sites_distribution.nom,
          adresse: item.sites_distribution.adresse,
          householdId: item.household_id,
          nomMenage: item.nom_menage,
          tokenNumber: item.token_number,
          recipientFirstName: item.beneficiaires[0].first_name,
          recipientMiddleName: item.beneficiaires[0].middle_name,
          recipientLastName: item.beneficiaires[0].last_name,
          nombreBeneficiaires: item.nombre_beneficiaires,
          nomSuppleant: null
        }));

        setBeneficiaires(transformedData);
      }
    } catch (err) {
      console.error('Error fetching beneficiaires:', err);
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaires();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setImportErrors([]);
      setError(null);

      if (!validateFileType(file)) {
        throw new Error('Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV.');
      }

      let jsonData: any[];

      try {
        if (isExcelFile(file)) {
          jsonData = await parseExcel(file);
          toast.success('Fichier Excel chargé avec succès');
        } else if (isCSVFile(file)) {
          jsonData = await parseCSV(file);
          toast.success('Fichier CSV chargé avec succès');
        } else {
          throw new Error('Format de fichier non supporté');
        }
      } catch (parseError: any) {
        console.error('Erreur de parsing:', parseError);
        throw new Error('Erreur lors de la lecture du fichier. Vérifiez que le fichier n\'est pas corrompu.');
      }

      if (!jsonData || jsonData.length === 0) {
        setImportErrors(['Le fichier est vide']);
        toast.error('Le fichier est vide');
        return;
      }

      // Vérifier la structure des données
      const columns = Object.keys(jsonData[0]);
      if (columns.length === 0) {
        throw new Error('Le fichier ne contient pas de colonnes valides');
      }

      setAvailableColumns(columns);
      const autoMapping = autoMapColumns(columns);
      setColumnMapping(autoMapping);
      setTempFileData(jsonData);
      setShowMappingDialog(true);

      const mappedCount = Object.keys(autoMapping).length;
      const unmappedCount = columns.length - mappedCount;
      
      if (mappedCount > 0) {
        toast.success(`${mappedCount} colonnes mappées automatiquement${unmappedCount > 0 ? ` (${unmappedCount} non mappées)` : ''}`);
      } else {
        toast.error('Aucune colonne n\'a pu être mappée automatiquement');
      }

    } catch (error: any) {
      console.error('Error importing file:', error);
      setImportErrors([error.message || 'Format de fichier invalide ou corrompu']);
      toast.error(error.message || 'Erreur lors de l\'importation du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setImportErrors([]);

      const { data: transformedData, errors } = transformExcelData(tempFileData, columnMapping);
      
      if (errors.length > 0) {
        setImportErrors(errors);
        toast.error('Erreurs de validation dans les données');
        return;
      }

      const importErrors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < transformedData.length; i++) {
        const record = transformedData[i];
        try {
          const { data, error } = await typedSupabase.rpc('import_household_data', {
            p_site_nom: record.siteDistribution?.trim() || 'Site par défaut',
            p_site_adresse: record.adresse?.trim() || '',
            p_household_id: record.householdId?.trim() || `HH-${Date.now()}-${i}`,
            p_nom_menage: record.nomMenage?.trim() || `Ménage ${i + 1}`,
            p_token_number: record.tokenNumber?.trim() || `TK-${Date.now()}-${i}`,
            p_nombre_beneficiaires: record.nombreBeneficiaires || 1,
            p_recipient_first_name: record.recipientFirstName?.trim() || 'Prénom',
            p_recipient_middle_name: record.recipientMiddleName?.trim() || null,
            p_recipient_last_name: record.recipientLastName?.trim() || 'Nom',
            p_nom_suppleant: record.nomSuppleant?.trim() || null
          });

          if (error) {
            importErrors.push(`Ligne ${i + 2}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          importErrors.push(`Ligne ${i + 2}: ${err.message}`);
        }

        // Update progress every 10 records
        if (i % 10 === 0) {
          toast.loading(`Importation en cours... ${i + 1}/${transformedData.length}`, {
            id: 'import-progress'
          });
        }
      }

      toast.dismiss('import-progress');
      
      if (importErrors.length > 0) {
        setImportErrors(importErrors);
        if (successCount > 0) {
          toast.success(`${successCount} enregistrements importés avec succès`);
        }
        toast.error(`${importErrors.length} erreurs lors de l'importation`);
      } else {
        toast.success('Importation réussie');
        setShowMappingDialog(false);
      }

      await fetchBeneficiaires();
    } catch (err: any) {
      console.error('Error importing data:', err);
      setError(err.message || 'Erreur lors de l\'importation des données');
      toast.error('Erreur lors de l\'importation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredBeneficiaires = useMemo(() => {
    return beneficiaires.filter(b => {
      const searchMatch = searchTerm === '' || 
        Object.values(b).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const siteMatch = filterSite === 'all' || b.siteDistribution === filterSite;
      
      return searchMatch && siteMatch;
    });
  }, [beneficiaires, searchTerm, filterSite]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Vérification de la Liste
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.9rem',
              fontWeight: 500
            }
          }}
        >
          <Tab label="Import Excel" />
          <Tab label="Enregistrement Manuel" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Paper className="p-6">
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Button
                variant="outlined"
                size="large"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                sx={{ mb: 2 }}
              >
                {isUploading ? 'Importation...' : 'Importer un fichier'}
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                Formats supportés: .xlsx, .xls, .csv
              </Typography>
            </Box>
          </Paper>

          {importErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Erreurs d'importation:
              </Typography>
              <ul className="list-disc pl-4">
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Paper sx={{ mt: 3, height: 400 }}>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Rechercher..."
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
              <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel>Site</InputLabel>
                <Select
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  label="Site"
                >
                  <MenuItem value="all">Tous les sites</MenuItem>
                  {Array.from(new Set(beneficiaires.map(b => b.siteDistribution))).map(site => (
                    <MenuItem key={site} value={site}>{site}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <DataGrid
              rows={filteredBeneficiaires}
              columns={columns}
              loading={isLoading}
              disableRowSelectionOnClick
              autoPageSize
              pageSizeOptions={[10, 25, 50]}
              sx={{
                '& .MuiDataGrid-cell': {
                  py: 1,
                },
              }}
            />
          </Paper>

          <Dialog
            open={showMappingDialog}
            onClose={() => setShowMappingDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Mapper les Colonnes
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Veuillez associer les colonnes de votre fichier aux champs correspondants.
                </Typography>
                
                {availableColumns.map((column) => (
                  <FormControl
                    key={column}
                    fullWidth
                    margin="normal"
                    size="small"
                  >
                    <InputLabel>{column}</InputLabel>
                    <Select
                      value={columnMapping[column] || ''}
                      onChange={(e) => {
                        setColumnMapping(prev => ({
                          ...prev,
                          [column]: e.target.value
                        }));
                      }}
                      label={column}
                    >
                      <MenuItem value="">
                        <em>Ne pas importer</em>
                      </MenuItem>
                      {getFieldOptions().map((option) => (
                        <MenuItem 
                          key={option.value} 
                          value={option.value}
                          disabled={Object.values(columnMapping).includes(option.value)}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setShowMappingDialog(false)}
                color="inherit"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleImportData}
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading && <CircularProgress size={20} />}
              >
                {isLoading ? 'Importation...' : 'Importer les Données'}
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ManualRegistration onRegistrationComplete={fetchBeneficiaires} />
        </TabPanel>
      </div>
    </PageTransition>
  );
}

export default ImportList;