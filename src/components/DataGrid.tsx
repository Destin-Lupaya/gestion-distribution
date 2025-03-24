import React, { useState, useEffect } from 'react';
import {
  DataGrid as MuiDataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarColumnsButton,
  GridFilterModel,
  GridFilterOperator,
  GridRowSelectionModel,
  GridDensity,
  GridFilterItem,
  frFR
} from '@mui/x-data-grid';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Alert,
  Collapse,
  LinearProgress,
  Fade,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';

import { useDatabase } from '../hooks/useDatabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { testConnection } from '../config/database';

// Types pour les données
type GridData = {
  sites: any[];
  households: any[];
  recipients: any[];
  distributions: any[];
};

// Types pour les statistiques
interface BaseStats {
  total: number;
  today: number;
  thisWeek: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface SiteStats extends BaseStats {
  beneficiaires: number;
  thisMonth: number;
}

interface HouseholdStats extends BaseStats {
  beneficiaires: number;
  moyenne: number;
}

interface RecipientStats extends BaseStats {
  primary: number;
  secondary: number;
}

interface DistributionStats extends BaseStats {
  completed: number;
  pending: number;
  cancelled: number;
}

type Stats = SiteStats | HouseholdStats | RecipientStats | DistributionStats;

// Composant personnalisé pour la barre d'outils
const CustomToolbar: React.FC<{
  numSelected: number;
  onDelete: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onPrint: () => void;
}> = ({ numSelected, onDelete, onRefresh, onExport, onPrint }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <GridToolbarContainer>
      <Stack direction="row" spacing={2} sx={{ width: '100%', p: 1 }}>
        <Stack direction="row" spacing={1}>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />
          <Tooltip title="Actualiser">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        {numSelected > 0 ? (
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={onDelete}
            >
              Supprimer ({numSelected})
            </Button>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
            >
              Exporter ({numSelected})
            </Button>
            <Button
              startIcon={<PrintIcon />}
              onClick={onPrint}
            >
              Imprimer ({numSelected})
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
            >
              Exporter
            </Button>
            <Button
              startIcon={<PrintIcon />}
              onClick={onPrint}
            >
              Imprimer
            </Button>
          </Stack>
        )}
      </Stack>
    </GridToolbarContainer>
  );
};

// Composant pour le dialogue des statistiques
interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  tabIndex: number;
}

const StatsDialog: React.FC<StatsDialogProps> = ({ open, onClose, data, tabIndex }) => {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setShowProgress(true);
      }, 100);
      return () => {
        clearTimeout(timer);
        setShowProgress(false);
      };
    }
  }, [open]);

  const isSiteStats = (stats: Stats): stats is SiteStats => {
    return 'thisMonth' in stats;
  };

  const isHouseholdStats = (stats: Stats): stats is HouseholdStats => {
    return 'moyenne' in stats;
  };

  const isRecipientStats = (stats: Stats): stats is RecipientStats => {
    return 'primary' in stats && 'secondary' in stats;
  };

  const isDistributionStats = (stats: Stats): stats is DistributionStats => {
    return 'completed' in stats && 'pending' in stats && 'cancelled' in stats;
  };

  const getStats = (): Stats => {
    switch (tabIndex) {
      case 0: // Sites
        return {
          total: data.length,
          beneficiaires: data.reduce((sum, site) => sum + (site.nombre_beneficiaires || 0), 0),
          today: data.filter(site => format(new Date(site.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
          thisWeek: data.filter(site => format(new Date(site.created_at), 'yyyy-MM-dd') >= format(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')).length,
          thisMonth: data.filter(site => format(new Date(site.created_at), 'yyyy-MM') === format(new Date(), 'yyyy-MM')).length,
          completed: 0,
          pending: 0,
          cancelled: 0
        } as SiteStats;
      case 1: // Ménages
        return {
          total: data.length,
          beneficiaires: data.reduce((sum, household) => sum + household.nombre_beneficiaires, 0),
          moyenne: data.length > 0 
            ? Math.round(data.reduce((sum, h) => sum + h.nombre_beneficiaires, 0) / data.length * 10) / 10
            : 0,
          today: data.filter(h => format(new Date(h.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
          thisWeek: data.filter(h => format(new Date(h.created_at), 'yyyy-MM-dd') >= format(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')).length,
          completed: 0,
          pending: 0,
          cancelled: 0
        } as HouseholdStats;
      case 2: // Bénéficiaires
        return {
          total: data.length,
          primary: data.filter(r => r.is_primary).length,
          secondary: data.filter(r => !r.is_primary).length,
          today: data.filter(r => format(new Date(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
          thisWeek: data.filter(r => format(new Date(r.created_at), 'yyyy-MM-dd') >= format(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')).length,
          completed: 0,
          pending: 0,
          cancelled: 0
        } as RecipientStats;
      case 3: // Distributions
        return {
          total: data.length,
          completed: data.filter(d => d.status === 'completed').length,
          pending: data.filter(d => d.status === 'pending').length,
          cancelled: data.filter(d => d.status === 'cancelled').length,
          today: data.filter(d => format(new Date(d.distribution_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
          thisWeek: data.filter(d => format(new Date(d.distribution_date), 'yyyy-MM-dd') >= format(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')).length
        } as DistributionStats;
      default:
        return {
          total: 0,
          today: 0,
          thisWeek: 0,
          completed: 0,
          pending: 0,
          cancelled: 0
        } as BaseStats;
    }
  };

  const stats = getStats();
  const titles = ['Sites', 'Ménages', 'Bénéficiaires', 'Distributions'];

  const renderStats = () => {
    const commonStats = (
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          {stats.today} nouveau(x) {titles[tabIndex].toLowerCase()} aujourd'hui
          {stats.thisWeek > stats.today && `, ${stats.thisWeek} cette semaine`}
        </Alert>
      </Box>
    );

    switch (tabIndex) {
      case 0:
        if (isSiteStats(stats)) {
          return (
            <Stack spacing={3}>
              {commonStats}
              <Typography variant="h6" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Total des sites ({stats.total})
                  </Typography>
                  <Fade in={showProgress} timeout={1000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100}
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Bénéficiaires ({stats.beneficiaires})
                  </Typography>
                  <Fade in={showProgress} timeout={1500}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((stats.beneficiaires / (stats.total * 100)) * 100, 100)}
                      color="success"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Croissance mensuelle ({stats.thisMonth} nouveaux sites)
                  </Typography>
                  <Fade in={showProgress} timeout={2000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.thisMonth / stats.total) * 100}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
              </Stack>
            </Stack>
          );
        }
        break;
      case 1:
        if (isHouseholdStats(stats)) {
          return (
            <Stack spacing={3}>
              {commonStats}
              <Typography variant="h6" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Total des ménages ({stats.total})
                  </Typography>
                  <Fade in={showProgress} timeout={1000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100}
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Bénéficiaires ({stats.beneficiaires}, moyenne: {stats.moyenne})
                  </Typography>
                  <Fade in={showProgress} timeout={1500}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((stats.beneficiaires / (stats.total * 10)) * 100, 100)}
                      color="success"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
              </Stack>
            </Stack>
          );
        }
        break;
      case 2:
        if (isRecipientStats(stats)) {
          return (
            <Stack spacing={3}>
              {commonStats}
              <Typography variant="h6" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Total des bénéficiaires ({stats.total})
                  </Typography>
                  <Fade in={showProgress} timeout={1000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100}
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Bénéficiaires principaux ({stats.primary})
                  </Typography>
                  <Fade in={showProgress} timeout={1500}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.primary / stats.total) * 100}
                      color="primary"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Bénéficiaires secondaires ({stats.secondary})
                  </Typography>
                  <Fade in={showProgress} timeout={2000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.secondary / stats.total) * 100}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
              </Stack>
            </Stack>
          );
        }
        break;
      case 3:
        if (isDistributionStats(stats)) {
          return (
            <Stack spacing={3}>
              {commonStats}
              <Typography variant="h6" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Total des distributions ({stats.total})
                  </Typography>
                  <Fade in={showProgress} timeout={1000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100}
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Distributions terminées ({stats.completed})
                  </Typography>
                  <Fade in={showProgress} timeout={1500}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.completed / stats.total) * 100}
                      color="success"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Distributions en attente ({stats.pending})
                  </Typography>
                  <Fade in={showProgress} timeout={2000}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.pending / stats.total) * 100}
                      color="warning"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Distributions annulées ({stats.cancelled})
                  </Typography>
                  <Fade in={showProgress} timeout={2500}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.cancelled / stats.total) * 100}
                      color="error"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Fade>
                </Box>
              </Stack>
            </Stack>
          );
        }
        break;
    }
    return null;
  };

  const getColumns = (): GridColDef[] => {
    switch (tabIndex) {
      case 0: // Sites
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'nom', 
            headerName: 'Nom du site', 
            width: 200,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'adresse', 
            headerName: 'Adresse', 
            width: 300,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            type: 'actions',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Voir les ménages">
                  <IconButton
                    size="small"
                    onClick={() => {
                      console.log('Voir ménages du site:', params.row.id);
                    }}
                  >
                    <PeopleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 1:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'site_name', 
            headerName: 'Site', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'household_id', 
            headerName: 'ID Ménage', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'household_name', 
            headerName: 'Nom du Ménage', 
            width: 180,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'token_number', 
            headerName: 'Token', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'beneficiary_count', 
            headerName: 'Bénéficiaires', 
            width: 120,
            type: 'number'
          },
          { 
            field: 'first_name', 
            headerName: 'Prénom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'middle_name', 
            headerName: 'Post-nom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'last_name', 
            headerName: 'Nom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 180,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 2:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'first_name', 
            headerName: 'Prénom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'middle_name', 
            headerName: 'Deuxième nom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'last_name', 
            headerName: 'Nom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'is_primary', 
            headerName: 'Bénéficiaire principal', 
            width: 150,
            type: 'boolean',
            valueFormatter: (params) => params.value ? 'Oui' : 'Non'
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            type: 'actions',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Voir les distributions">
                  <IconButton
                    size="small"
                    onClick={() => {
                      console.log('Voir distributions du bénéficiaire:', params.row.id);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 3:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'distribution_date', 
            headerName: 'Date de distribution', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          { 
            field: 'status', 
            headerName: 'Statut', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators,
            renderCell: (params) => {
              const statusMap: { [key: string]: { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } } = {
                pending: { label: 'En attente', color: 'warning' },
                completed: { label: 'Terminé', color: 'success' },
                cancelled: { label: 'Annulé', color: 'error' }
              };
              const status = statusMap[params.value] || { label: params.value, color: 'default' };
              return <Chip label={status.label} color={status.color} size="small" />;
            }
          },
          { 
            field: 'notes', 
            headerName: 'Notes', 
            width: 200,
            type: 'string',
            filterOperators: filterOperators
          }
        ];
      default:
        return [];
    }
  };

  interface FilterParams {
    value: any;
  }

  const filterOperators: GridFilterOperator[] = [
    {
      label: 'contient',
      value: 'contains',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().includes(filterItem.value.toString().toLowerCase());
        };
      }
    },
    {
      label: 'égal à',
      value: 'equals',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase() === filterItem.value.toString().toLowerCase();
        };
      }
    },
    {
      label: 'commence par',
      value: 'startsWith',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().startsWith(filterItem.value.toString().toLowerCase());
        };
      }
    },
    {
      label: 'finit par',
      value: 'endsWith',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().endsWith(filterItem.value.toString().toLowerCase());
        };
      }
    }
  ];

  const dateFilterOperators: GridFilterOperator[] = [
    {
      label: 'est le',
      value: 'is',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          const filterDate = new Date(filterItem.value);
          const paramDate = new Date(params.value);
          return (
            filterDate.getFullYear() === paramDate.getFullYear() &&
            filterDate.getMonth() === paramDate.getMonth() &&
            filterDate.getDate() === paramDate.getDate()
          );
        };
      }
    },
    {
      label: 'est après le',
      value: 'after',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return new Date(params.value) > new Date(filterItem.value);
        };
      }
    },
    {
      label: 'est avant le',
      value: 'before',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return new Date(params.value) < new Date(filterItem.value);
        };
      }
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BarChartIcon />
          <Typography variant="h6">
            {titles[tabIndex]} - Statistiques
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {renderStats()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

// Composant pour la grille de données
interface DataGridViewProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  error?: string;
  onRowClick?: (params: any) => void;
  onSelectionModelChange?: (selectionModel: GridRowSelectionModel) => void;
  selectionModel?: GridRowSelectionModel;
}

const DataGridView: React.FC<DataGridViewProps> = ({
  rows,
  columns,
  loading: externalLoading,
  error: externalError,
  onRowClick,
  onSelectionModelChange,
  selectionModel: externalSelectionModel
}) => {
  const [tabIndex, setTabIndex] = useState(1); 
  const [pageSize, setPageSize] = useState<number>(10);
  const [density, setDensity] = useState<GridDensity>('standard');
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const { 
    isLoading, 
    error: dbError, 
    getAllSites,
    getAllHouseholds,
    getAllRecipients,
    getAllDistributions 
  } = useDatabase();

  const loading = externalLoading || isLoading;
  const error = externalError || dbError;

  const [data, setData] = useState<GridData>({
    sites: [],
    households: [],
    recipients: [],
    distributions: []
  });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadError(null);
        
        // Test database connection
        const isConnected = await testConnection();
        if (!isConnected) {
          setLoadError("Erreur de connexion à la base de données. Veuillez vérifier que MySQL est en cours d'exécution.");
          return;
        }

        const [sites, households, recipients, distributions] = await Promise.all([
          getAllSites(),
          getAllHouseholds(),
          getAllRecipients(),
          getAllDistributions()
        ]);

        setData({
          sites,
          households,
          recipients,
          distributions
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadError(error instanceof Error ? error.message : String(error));
      }
    };

    loadData();
  }, [getAllSites, getAllHouseholds, getAllRecipients, getAllDistributions, refreshKey]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setRowSelectionModel([]);
  };

  const getActiveData = () => {
    switch (tabIndex) {
      case 0:
        return data.sites;
      case 1:
        return data.households;
      case 2:
        return data.recipients;
      case 3:
        return data.distributions;
      default:
        return [];
    }
  };

  const getActiveColumns = (): GridColDef[] => {
    switch (tabIndex) {
      case 0:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'nom', 
            headerName: 'Nom du site', 
            width: 200,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'adresse', 
            headerName: 'Adresse', 
            width: 300,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            type: 'actions',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Voir les ménages">
                  <IconButton
                    size="small"
                    onClick={() => {
                      console.log('Voir ménages du site:', params.row.id);
                    }}
                  >
                    <PeopleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 1:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'site_name', 
            headerName: 'Site', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'household_id', 
            headerName: 'ID Ménage', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'household_name', 
            headerName: 'Nom du Ménage', 
            width: 180,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'token_number', 
            headerName: 'Token', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'beneficiary_count', 
            headerName: 'Bénéficiaires', 
            width: 120,
            type: 'number'
          },
          { 
            field: 'first_name', 
            headerName: 'Prénom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'middle_name', 
            headerName: 'Post-nom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'last_name', 
            headerName: 'Nom', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 180,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 2:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'first_name', 
            headerName: 'Prénom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'middle_name', 
            headerName: 'Deuxième nom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'last_name', 
            headerName: 'Nom', 
            width: 150,
            type: 'string',
            filterOperators: filterOperators
          },
          { 
            field: 'is_primary', 
            headerName: 'Bénéficiaire principal', 
            width: 150,
            type: 'boolean',
            valueFormatter: (params) => params.value ? 'Oui' : 'Non'
          },
          { 
            field: 'created_at', 
            headerName: 'Date de création', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            type: 'actions',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Voir les distributions">
                  <IconButton
                    size="small"
                    onClick={() => {
                      console.log('Voir distributions du bénéficiaire:', params.row.id);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }
        ];
      case 3:
        return [
          { 
            field: 'id', 
            headerName: 'ID', 
            width: 90,
            type: 'number'
          },
          { 
            field: 'distribution_date', 
            headerName: 'Date de distribution', 
            width: 200,
            type: 'date',
            valueFormatter: (params) => format(new Date(params.value), 'Pp', { locale: fr }),
            filterOperators: dateFilterOperators
          },
          { 
            field: 'status', 
            headerName: 'Statut', 
            width: 130,
            type: 'string',
            filterOperators: filterOperators,
            renderCell: (params) => {
              const statusMap: { [key: string]: { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } } = {
                pending: { label: 'En attente', color: 'warning' },
                completed: { label: 'Terminé', color: 'success' },
                cancelled: { label: 'Annulé', color: 'error' }
              };
              const status = statusMap[params.value] || { label: params.value, color: 'default' };
              return <Chip label={status.label} color={status.color} size="small" />;
            }
          },
          { 
            field: 'notes', 
            headerName: 'Notes', 
            width: 200,
            type: 'string',
            filterOperators: filterOperators
          }
        ];
      default:
        return [];
    }
  };

  interface FilterParams {
    value: any;
  }

  const filterOperators: GridFilterOperator[] = [
    {
      label: 'contient',
      value: 'contains',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().includes(filterItem.value.toString().toLowerCase());
        };
      }
    },
    {
      label: 'égal à',
      value: 'equals',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase() === filterItem.value.toString().toLowerCase();
        };
      }
    },
    {
      label: 'commence par',
      value: 'startsWith',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().startsWith(filterItem.value.toString().toLowerCase());
        };
      }
    },
    {
      label: 'finit par',
      value: 'endsWith',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return params.value.toString().toLowerCase().endsWith(filterItem.value.toString().toLowerCase());
        };
      }
    }
  ];

  const dateFilterOperators: GridFilterOperator[] = [
    {
      label: 'est le',
      value: 'is',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          const filterDate = new Date(filterItem.value);
          const paramDate = new Date(params.value);
          return (
            filterDate.getFullYear() === paramDate.getFullYear() &&
            filterDate.getMonth() === paramDate.getMonth() &&
            filterDate.getDate() === paramDate.getDate()
          );
        };
      }
    },
    {
      label: 'est après le',
      value: 'after',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return new Date(params.value) > new Date(filterItem.value);
        };
      }
    },
    {
      label: 'est avant le',
      value: 'before',
      getApplyFilterFn: (filterItem: GridFilterItem) => {
        return (params: { value: string }) => {
          if (!filterItem.value || !params.value) return false;
          return new Date(params.value) < new Date(filterItem.value);
        };
      }
    }
  ];

  const handleExport = () => {
    const activeData = getActiveData();
    const dataToExport = rowSelectionModel.length > 0
      ? activeData.filter(row => rowSelectionModel.includes(row.id))
      : activeData;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    const tabNames = ['Sites', 'Menages', 'Beneficiaires', 'Distributions'];
    const fileName = `export_${tabNames[tabIndex]}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBulkDelete = () => {
    if (rowSelectionModel.length === 0) return;
    console.log('Suppression en masse:', rowSelectionModel);
  };

  const getStatistics = () => {
    const activeData = getActiveData();
    switch (tabIndex) {
      case 0:
        return `${activeData.length} site(s)`;
      case 1:
        const totalBeneficiaires = activeData.reduce((sum, household) => sum + household.nombre_beneficiaires, 0);
        return `${activeData.length} ménage(s) | ${totalBeneficiaires} bénéficiaire(s)`;
      case 2:
        const primaryRecipients = activeData.filter(recipient => recipient.is_primary).length;
        return `${activeData.length} bénéficiaire(s) | ${primaryRecipients} principal(aux)`;
      case 3:
        const completed = activeData.filter(dist => dist.status === 'completed').length;
        return `${activeData.length} distribution(s) | ${completed} terminée(s)`;
      default:
        return '';
    }
  };

  const activeData = getActiveData();
  const activeColumns = getActiveColumns();

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loadError && (
          <Collapse in={Boolean(loadError)}>
            <Alert 
              severity="error" 
              onClose={() => setLoadError(null)}
              sx={{ m: 2 }}
            >
              {loadError}
            </Alert>
          </Collapse>
        )}
        
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Onglets de données"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge 
                badgeContent={data.sites.length} 
                color="primary"
                max={999}
              >
                Sites
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={data.households.length} 
                color="primary"
                max={999}
              >
                Ménages
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={data.recipients.length} 
                color="primary"
                max={999}
              >
                Bénéficiaires
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={data.distributions.length} 
                color="primary"
                max={999}
              >
                Distributions
              </Badge>
            } 
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <div style={{ height: 600, width: '100%' }}>
            <MuiDataGrid
              rows={activeData}
              columns={activeColumns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 20, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              loading={loading}
              components={{
                Toolbar: CustomToolbar
              }}
              componentsProps={{
                toolbar: {
                  numSelected: rowSelectionModel.length,
                  onDelete: handleBulkDelete,
                  onRefresh: handleRefresh,
                  onExport: handleExport,
                  onPrint: handlePrint
                }
              }}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel);
              }}
              filterModel={filterModel}
              onFilterModelChange={(newFilterModel) => {
                setFilterModel(newFilterModel);
              }}
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              density={density}
              sx={{
                '& .MuiDataGrid-toolbarContainer': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)',
                  pb: 1
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            />
          </div>
        </Box>
      </Paper>

      <StatsDialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        data={activeData}
        tabIndex={tabIndex}
      />
    </Box>
  );
};

export default DataGridView;
