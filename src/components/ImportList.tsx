import React, { useState, useMemo } from 'react';
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
  InputAdornment
} from '@mui/material';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import { PageTransition } from './PageTransition';
import ManualRegistration from './ManualRegistration';
import toast from 'react-hot-toast';
import { dbOperations } from '../lib/db';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

interface Beneficiaire {
  id: string;
  siteDistribution: string;
  adresse: string;
  householdId: string;
  nomMenage: string;
  tokenNumber: string;
  recipientFirstName: string;
  recipientMiddleName: string | null;
  recipientLastName: string;
  nombreBeneficiaires: number;
  nomSuppleant: string | null;
}

type SortOrder = 'asc' | 'desc';
type SortField = keyof Beneficiaire;

const FIELD_MAPPING = {
  'Site de distribution': 'siteDistribution',
  'Adresse': 'adresse',
  'Household ID': 'householdId',
  'Nom du Ménage': 'nomMenage',
  'Token Number': 'tokenNumber',
  'Recipient First Name': 'recipientFirstName',
  'Recipient Middle Name': 'recipientMiddleName',
  'Recipient Last Name': 'recipientLastName',
  'Nombre des Bénéficiaires Enrôlés': 'nombreBeneficiaires',
  'Nom Suppléant': 'nomSuppleant'
};

const REQUIRED_FIELDS = [
  'Site de distribution',
  'Adresse',
  'Household ID',
  'Nom du Ménage',
  'Token Number',
  'Recipient First Name',
  'Recipient Last Name',
  'Nombre des Bénéficiaires Enrôlés',
  'Nom Suppléant'
];

function ImportList() {
  const [tabValue, setTabValue] = useState(0);
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('tous');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('nomMenage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const validateData = (data: any[]): { valid: Beneficiaire[], errors: string[] } => {
    const errors: string[] = [];
    const validData: Beneficiaire[] = [];

    if (data.length === 0) {
      errors.push('Le fichier est vide');
      return { valid: [], errors };
    }

    const firstRow = data[0];
    const headers = Object.keys(firstRow);
    const missingColumns = REQUIRED_FIELDS.filter(field => 
      !headers.includes(field)
    );

    if (missingColumns.length > 0) {
      errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
      return { valid: [], errors };
    }

    data.forEach((row, index) => {
      const rowNumber = index + 2;
      const currentErrors: string[] = [];

      REQUIRED_FIELDS.forEach(field => {
        const value = row[field];
        if (!value && value !== 0 && field !== 'Nom Suppléant') {
          currentErrors.push(`Ligne ${rowNumber}: Le champ "${field}" est obligatoire`);
        }
      });

      const nombreBeneficiaires = parseInt(String(row['Nombre des Bénéficiaires Enrôlés']));
      if (isNaN(nombreBeneficiaires) || nombreBeneficiaires < 1) {
        currentErrors.push(`Ligne ${rowNumber}: Le nombre de bénéficiaires doit être un nombre positif`);
      }

      if (currentErrors.length === 0) {
        validData.push({
          id: crypto.randomUUID(),
          siteDistribution: row['Site de distribution'],
          adresse: row['Adresse'],
          householdId: row['Household ID'],
          nomMenage: row['Nom du Ménage'],
          tokenNumber: row['Token Number'],
          recipientFirstName: row['Recipient First Name'],
          recipientMiddleName: row['Recipient Middle Name'] || null,
          recipientLastName: row['Recipient Last Name'],
          nombreBeneficiaires,
          nomSuppleant: row['Nom Suppléant'] || null
        });
      } else {
        errors.push(...currentErrors);
      }
    });

    return { valid: validData, errors };
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (jsonData.length === 0) {
          setImportErrors(['Le fichier est vide']);
          toast.error('Le fichier est vide');
          return;
        }

        const { valid, errors } = validateData(jsonData);
        setImportErrors(errors);

        if (valid.length > 0) {
          // Import data to SQLite
          for (const beneficiaire of valid) {
            try {
              dbOperations.importHouseholdData(
                beneficiaire.siteDistribution,
                beneficiaire.adresse,
                beneficiaire.householdId,
                beneficiaire.nomMenage,
                beneficiaire.tokenNumber,
                beneficiaire.nombreBeneficiaires,
                beneficiaire.recipientFirstName,
                beneficiaire.recipientMiddleName,
                beneficiaire.recipientLastName,
                beneficiaire.nomSuppleant
              );
            } catch (error) {
              console.error('Error importing data:', error);
              errors.push(`Erreur d'importation pour ${beneficiaire.nomMenage}`);
            }
          }

          setBeneficiaires(valid);
          toast.success(`${valid.length} bénéficiaires importés avec succès${errors.length > 0 ? ' (avec des erreurs)' : ''}`);
        } else {
          toast.error('Aucune donnée valide n\'a pu être importée');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        setImportErrors(['Format de fichier invalide ou corrompu']);
        toast.error('Erreur lors de l\'importation du fichier');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = {
      'Site de distribution': '',
      'Adresse': '',
      'Household ID': '',
      'Nom du Ménage': '',
      'Token Number': '',
      'Recipient First Name': '',
      'Recipient Middle Name': '',
      'Recipient Last Name': '',
      'Nombre des Bénéficiaires Enrôlés': 1,
      'Nom Suppléant': ''
    };

    const ws = XLSX.utils.json_to_sheet([template]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bénéficiaires');
    XLSX.writeFile(wb, 'modele_beneficiaires.xlsx');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel')) {
      handleFileUpload(file);
    } else {
      setImportErrors(['Format de fichier non supporté. Utilisez un fichier Excel (.xlsx)']);
      toast.error('Format de fichier non supporté. Utilisez un fichier Excel (.xlsx)');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete from SQLite
      dbOperations.deleteMenage.run(id);
      setBeneficiaires(prev => prev.filter(b => b.id !== id));
      toast.success('Bénéficiaire supprimé');
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const filteredAndSortedData = useMemo(() => {
    return beneficiaires
      .filter(b => {
        const matchesSearch = (
          b.nomMenage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.recipientFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.recipientLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.householdId.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesSite = filterSite === 'tous' || b.siteDistribution === filterSite;
        return matchesSearch && matchesSite;
      })
      .sort((a, b) => {
        const compareValue = (va: any, vb: any) => {
          if (typeof va === 'string' && typeof vb === 'string') {
            return va.localeCompare(vb, 'fr', { sensitivity: 'base' });
          }
          return va - vb;
        };
        
        const value = compareValue(a[sortField], b[sortField]);
        return sortOrder === 'asc' ? value : -value;
      });
  }, [beneficiaires, searchTerm, filterSite, sortField, sortOrder]);

  const uniqueSites = useMemo(() => 
    ['tous', ...new Set(beneficiaires.map(b => b.siteDistribution))],
    [beneficiaires]
  );

  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalBeneficiaires = filteredAndSortedData.length;
  const totalPersonnes = filteredAndSortedData.reduce((sum, b) => sum + b.nombreBeneficiaires, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Enregistrement des Bénéficiaires
        </Typography>

        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Import Excel" />
            <Tab label="Enregistrement Manuel" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Paper
                className={`p-8 text-center border-2 border-dashed ${
                  isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                } transition-colors duration-200`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Glissez-déposez votre fichier Excel ici
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Format requis: .xlsx ou .xls
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Colonnes requises: {REQUIRED_FIELDS.join(', ')}
                  </Typography>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={downloadTemplate}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, margin: '0 auto' }}
                  >
                    <DownloadIcon fontSize="small" />
                    Télécharger le modèle Excel
                  </Link>
                </Box>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  Sélectionner un fichier
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </Button>
              </Paper>
            </motion.div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ManualRegistration
              onRegistrationComplete={() => {
                // Refresh the list after manual registration
                const menages = dbOperations.getMenages.all();
                setBeneficiaires(menages.map(m => ({
                  id: m.id,
                  siteDistribution: m.site_nom,
                  adresse: m.site_adresse,
                  householdId: m.household_id,
                  nomMenage: m.nom_menage,
                  tokenNumber: m.token_number,
                  recipientFirstName: m.first_name,
                  recipientMiddleName: m.middle_name,
                  recipientLastName: m.last_name,
                  nombreBeneficiaires: m.nombre_beneficiaires,
                  nomSuppleant: m.nom_suppleant
                })));
              }}
            />
          </TabPanel>
        </Paper>

        {importErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert 
              severity="error" 
              onClose={() => setImportErrors([])}
              sx={{
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Erreurs d'importation:
              </Typography>
              <ul className="list-disc pl-4">
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="error">
                  Veuillez corriger ces erreurs et réessayer l'importation.
                </Typography>
                <Link
                  component="button"
                  variant="body2"
                  onClick={downloadTemplate}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <DownloadIcon fontSize="small" />
                  Télécharger le modèle Excel
                </Link>
              </Box>
            </Alert>
          </motion.div>
        )}

        {beneficiaires.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Liste des bénéficiaires ({totalBeneficiaires})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`Total bénéficiaires: ${totalPersonnes}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Liste validée"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Paper className="mb-4 p-4">
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  select
                  size="small"
                  label="Site de distribution"
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  {uniqueSites.map((site) => (
                    <MenuItem key={site} value={site}>
                      {site === 'tous' ? 'Tous les sites' : site}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Filtres actifs">
                  <IconButton color="primary">
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            <TableContainer component={Paper} className="shadow-lg">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'householdId'}
                        direction={sortField === 'householdId' ? sortOrder : 'asc'}
                        onClick={() => handleSort('householdId')}
                      >
                        Household ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'nomMenage'}
                        direction={sortField === 'nomMenage' ? sortOrder : 'asc'}
                        onClick={() => handleSort('nomMenage')}
                      >
                        Nom du Ménage
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Token Number</TableCell>
                    <TableCell>Bénéficiaire Principal</TableCell>
                    <TableCell>Site de distribution</TableCell>
                    <TableCell>Nombre de Bénéficiaires</TableCell>
                    <TableCell>Suppléant</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((beneficiaire) => (
                    <TableRow 
                      key={beneficiaire.id}
                      hover
                      className="transition-colors duration-200"
                    >
                      <TableCell>{beneficiaire.householdId}</TableCell>
                      <TableCell>{beneficiaire.nomMenage}</TableCell>
                      <TableCell>{beneficiaire.tokenNumber}</TableCell>
                      <TableCell>
                        {`${beneficiaire.recipientFirstName} ${beneficiaire.recipientMiddleName || ''} ${beneficiaire.recipientLastName}`}
                      </TableCell>
                      <TableCell>{beneficiaire.siteDistribution}</TableCell>
                      <TableCell>{beneficiaire.nombreBeneficiaires}</TableCell>
                      <TableCell>{beneficiaire.nomSuppleant || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            color="error"
                            size="small"
                            onClick={() => handleDelete(beneficiaire.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredAndSortedData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page"
              />
            </TableContainer>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

export default ImportList;