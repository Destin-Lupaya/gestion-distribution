import React, { useState, useMemo, useEffect } from 'react';
import { 
  Paper, 
  Button, 
  Typography,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Alert,
  Link,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PageTransition } from './PageTransition';
import ManualRegistration from './ManualRegistration';
import toast from 'react-hot-toast';
import { typedSupabase } from '../lib/supabase';
import { 
  EXCEL_MAPPINGS, 
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

type SortOrder = 'asc' | 'desc';
type SortField = keyof Beneficiaire;

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
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('nomMenage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [tempFileData, setTempFileData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchBeneficiaires = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await typedSupabase
        .from('beneficiaires')
        .select(`
          *,
          menage:menages!inner(
            *,
            site:sites_distribution!inner(*)
          )
        `);

      if (fetchError) throw fetchError;

      if (data) {
        const transformedData = data.map(item => ({
          id: item.id,
          siteDistribution: item.menage.site.nom,
          adresse: item.menage.site.adresse,
          householdId: item.menage.household_id,
          nomMenage: item.menage.nom_menage,
          tokenNumber: item.menage.token_number,
          recipientFirstName: item.first_name,
          recipientMiddleName: item.middle_name,
          recipientLastName: item.last_name,
          nombreBeneficiaires: item.menage.nombre_beneficiaires,
          nomSuppleant: null // This will be populated if there's a non-principal beneficiary
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

      if (!validateFileType(file)) {
        throw new Error('Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV.');
      }

      let jsonData: any[];

      if (isExcelFile(file)) {
        jsonData = await parseExcel(file);
      } else if (isCSVFile(file)) {
        jsonData = await parseCSV(file);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      if (jsonData.length === 0) {
        setImportErrors(['Le fichier est vide']);
        toast.error('Le fichier est vide');
        return;
      }

      const columns = Object.keys(jsonData[0]);
      setAvailableColumns(columns);
      
      // Auto-map columns
      const autoMapping = autoMapColumns(columns);
      setColumnMapping(autoMapping);
      
      setTempFileData(jsonData);
      setShowMappingDialog(true);

      // Show toast with mapping results
      const mappedCount = Object.keys(autoMapping).length;
      const unmappedCount = columns.length - mappedCount;
      
      if (mappedCount > 0) {
        toast.success(`${mappedCount} colonnes mappées automatiquement${unmappedCount > 0 ? ` (${unmappedCount} non mappées)` : ''}`);
      } else {
        toast.warning('Aucune colonne n\'a pu être mappée automatiquement');
      }
    } catch (error: any) {
      console.error('Error importing file:', error);
      setImportErrors([error.message || 'Format de fichier invalide ou corrompu']);
      toast.error('Erreur lors de l\'importation du fichier');
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
      const importPromises = transformedData.map(async (record, index) => {
        try {
          const { data, error } = await typedSupabase.rpc('import_household_data', {
            p_site_nom: record.siteDistribution?.trim() || 'Site par défaut',
            p_site_adresse: record.adresse?.trim() || '',
            p_household_id: record.householdId?.trim() || `HH-${Date.now()}-${index}`,
            p_nom_menage: record.nomMenage?.trim() || `Ménage ${index + 1}`,
            p_token_number: record.tokenNumber?.trim() || `TK-${Date.now()}-${index}`,
            p_nombre_beneficiaires: record.nombreBeneficiaires || 1,
            p_recipient_first_name: record.recipientFirstName?.trim() || 'Prénom',
            p_recipient_middle_name: record.recipientMiddleName?.trim() || null,
            p_recipient_last_name: record.recipientLastName?.trim() || 'Nom',
            p_nom_suppleant: record.nomSuppleant?.trim() || null
          });

          if (error) {
            importErrors.push(`Ligne ${index + 2}: ${error.message}`);
            return null;
          }

          return data;
        } catch (err: any) {
          importErrors.push(`Ligne ${index + 2}: ${err.message}`);
          return null;
        }
      });

      const results = await Promise.all(importPromises);
      
      if (importErrors.length > 0) {
        setImportErrors(importErrors);
        toast.error('Des erreurs sont survenues lors de l\'importation');
      } else {
        toast.success('Importation réussie');
        setShowMappingDialog(false);
        fetchBeneficiaires();
      }
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