import React, { useState, useEffect } from 'react';
import { 
  DataGrid as MuiDataGrid, 
  GridColDef, 
  GridValueGetterParams,
  frFR,
  GridToolbar,
  GridFilterModel,
  GridSelectionModel
} from '@mui/x-data-grid';
import { 
  Box, 
  Typography, 
  Paper,
  Tabs,
  Tab,
  Button,
  Stack
} from '@mui/material';
import { useDatabase } from '../hooks/useDatabase';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

// Types pour les données
type GridData = {
  sites: any[];
  households: any[];
  recipients: any[];
  distributions: any[];
};

// Définition des colonnes pour chaque type de données
const siteColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90, filterable: true },
  { field: 'nom', headerName: 'Nom du site', width: 200, filterable: true },
  { field: 'adresse', headerName: 'Adresse', width: 300, filterable: true },
  { 
    field: 'created_at', 
    headerName: 'Date de création', 
    width: 200,
    filterable: true,
    valueGetter: (params: GridValueGetterParams) => 
      new Date(params.row.created_at).toLocaleString('fr-FR')
  }
];

const householdColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 130, filterable: true },
  { field: 'nom_menage', headerName: 'Nom du ménage', width: 200, filterable: true },
  { field: 'token_number', headerName: 'Numéro de jeton', width: 150, filterable: true },
  { field: 'nombre_beneficiaires', headerName: 'Bénéficiaires', width: 130, filterable: true, type: 'number' },
  { 
    field: 'created_at', 
    headerName: 'Date de création', 
    width: 200,
    filterable: true,
    valueGetter: (params: GridValueGetterParams) => 
      new Date(params.row.created_at).toLocaleString('fr-FR')
  }
];

const recipientColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90, filterable: true },
  { field: 'first_name', headerName: 'Prénom', width: 150, filterable: true },
  { field: 'middle_name', headerName: 'Deuxième nom', width: 150, filterable: true },
  { field: 'last_name', headerName: 'Nom', width: 150, filterable: true },
  { 
    field: 'is_primary', 
    headerName: 'Principal', 
    width: 100,
    filterable: true,
    type: 'boolean',
    valueGetter: (params: GridValueGetterParams) => 
      params.row.is_primary ? 'Oui' : 'Non'
  }
];

const distributionColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90, filterable: true },
  { field: 'household_id', headerName: 'ID Ménage', width: 130, filterable: true },
  { 
    field: 'distribution_date', 
    headerName: 'Date de distribution', 
    width: 200,
    filterable: true,
    valueGetter: (params: GridValueGetterParams) => 
      new Date(params.row.distribution_date).toLocaleString('fr-FR')
  },
  { 
    field: 'status', 
    headerName: 'Statut', 
    width: 130,
    filterable: true,
    type: 'singleSelect',
    valueOptions: ['pending', 'completed', 'cancelled'],
    valueGetter: (params: GridValueGetterParams) => {
      const status = params.row.status;
      switch (status) {
        case 'pending': return 'En attente';
        case 'completed': return 'Complété';
        case 'cancelled': return 'Annulé';
        default: return status;
      }
    }
  },
  { field: 'notes', headerName: 'Notes', width: 200, filterable: true }
];

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DataGridView: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState<GridData>({
    sites: [],
    households: [],
    recipients: [],
    distributions: []
  });
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { 
    isLoading, 
    error, 
    getAllSites,
    getAllHouseholds,
    getAllRecipients,
    getAllDistributions
  } = useDatabase();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadError(null);
        const [sites, households, recipients, distributions] = await Promise.all([
          getAllSites(),
          getAllHouseholds(),
          getAllRecipients(),
          getAllDistributions()
        ]);

        setData({
          sites: sites || [],
          households: households || [],
          recipients: recipients || [],
          distributions: distributions || []
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      }
    };

    loadData();
  }, [getAllSites, getAllHouseholds, getAllRecipients, getAllDistributions]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setSelectionModel([]); // Réinitialiser la sélection lors du changement d'onglet
  };

  const getActiveData = () => {
    switch (tabIndex) {
      case 0:
        return { data: data.sites, columns: siteColumns, name: 'Sites' };
      case 1:
        return { data: data.households, columns: householdColumns, name: 'Menages' };
      case 2:
        return { data: data.recipients, columns: recipientColumns, name: 'Beneficiaires' };
      case 3:
        return { data: data.distributions, columns: distributionColumns, name: 'Distributions' };
      default:
        return { data: [], columns: [], name: '' };
    }
  };

  const handleExport = () => {
    const { data: activeData, name } = getActiveData();
    
    // Filtrer les données sélectionnées si des lignes sont sélectionnées
    const dataToExport = selectionModel.length > 0
      ? activeData.filter((row: any) => selectionModel.includes(row.id))
      : activeData;

    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, name);

    // Générer le fichier Excel
    const fileName = `${name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const { data: activeData, columns: activeColumns } = getActiveData();

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loadError && (
          <Typography color="error" sx={{ p: 2 }}>
            Erreur: {loadError}
          </Typography>
        )}
        
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Onglets de données"
          variant="fullWidth"
        >
          <Tab label="Sites" />
          <Tab label="Ménages" />
          <Tab label="Bénéficiaires" />
          <Tab label="Distributions" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={activeData.length === 0}
            >
              Exporter {selectionModel.length > 0 ? `(${selectionModel.length} lignes)` : 'tout'}
            </Button>
          </Stack>

          <div style={{ height: 600, width: '100%' }}>
            <MuiDataGrid
              rows={activeData}
              columns={activeColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20, 50]}
              checkboxSelection
              disableSelectionOnClick
              loading={isLoading}
              components={{
                Toolbar: GridToolbar
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                }
              }}
              selectionModel={selectionModel}
              onSelectionModelChange={(newSelectionModel) => {
                setSelectionModel(newSelectionModel);
              }}
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              density="comfortable"
              sx={{
                '& .MuiDataGrid-toolbarContainer': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)',
                  pb: 1
                }
              }}
            />
          </div>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              Erreur: {error.message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DataGridView;
