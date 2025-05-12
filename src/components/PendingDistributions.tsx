import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiService from '../services/apiService';

interface Distribution {
  id: string;
  distribution_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  site_name: string;
  household_name: string;
  token_number: string;
  first_name: string;
  last_name: string;
  beneficiary_count: number;
  notes?: string;
}

const PendingDistributions: React.FC = () => {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchPendingDistributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPendingDistributions();
      if (response && response.data) {
        setDistributions(response.data);
      } else {
        setError('Aucune donnée reçue du serveur');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des distributions en attente:', err);
      setError('Erreur lors de la récupération des distributions en attente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDistributions();
  }, []);

  const handleApproveClick = (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    setOpenApproveDialog(true);
  };

  const handleCancelClick = (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    setOpenCancelDialog(true);
  };

  const handleDetailsClick = (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    setOpenDetailsDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedDistribution) return;
    
    setActionLoading(true);
    try {
      const response = await apiService.approveDistribution(selectedDistribution.id);
      if (response && response.success) {
        setSnackbar({
          open: true,
          message: 'Distribution approuvée avec succès',
          severity: 'success'
        });
        // Mettre à jour la liste des distributions
        setDistributions(prevDistributions => 
          prevDistributions.filter(d => d.id !== selectedDistribution.id)
        );
      } else {
        throw new Error(response.message || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      console.error('Erreur lors de l\'approbation de la distribution:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur lors de l\'approbation de la distribution',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setOpenApproveDialog(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedDistribution) return;
    
    setActionLoading(true);
    try {
      const response = await apiService.cancelDistribution(selectedDistribution.id);
      if (response && response.success) {
        setSnackbar({
          open: true,
          message: 'Distribution annulée avec succès',
          severity: 'success'
        });
        // Mettre à jour la liste des distributions
        setDistributions(prevDistributions => 
          prevDistributions.filter(d => d.id !== selectedDistribution.id)
        );
      } else {
        throw new Error(response.message || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la distribution:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur lors de l\'annulation de la distribution',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setOpenCancelDialog(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRefresh = () => {
    fetchPendingDistributions();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Distributions en attente d'approbation
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={loading}
        >
          Actualiser
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tableau des distributions en attente">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Ménage</TableCell>
                <TableCell>Bénéficiaire</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Chargement des distributions...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : distributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucune distribution en attente d'approbation
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                distributions.map((distribution) => (
                  <TableRow key={distribution.id} hover>
                    <TableCell>
                      {format(new Date(distribution.distribution_date), 'Pp', { locale: fr })}
                    </TableCell>
                    <TableCell>{distribution.site_name}</TableCell>
                    <TableCell>{distribution.household_name}</TableCell>
                    <TableCell>
                      {`${distribution.first_name} ${distribution.last_name}`}
                    </TableCell>
                    <TableCell align="center">{distribution.beneficiary_count}</TableCell>
                    <TableCell>
                      <Chip 
                        label="En attente" 
                        color="warning" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="success" 
                          onClick={() => handleApproveClick(distribution)}
                          title="Approuver"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDetailsClick(distribution)}
                          title="Voir les détails"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleCancelClick(distribution)}
                          title="Annuler"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialogue de confirmation d'approbation */}
      <Dialog
        open={openApproveDialog}
        onClose={() => !actionLoading && setOpenApproveDialog(false)}
      >
        <DialogTitle>Approuver la distribution</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir approuver cette distribution pour{' '}
            {selectedDistribution ? `${selectedDistribution.first_name} ${selectedDistribution.last_name}` : ''}?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenApproveDialog(false)} 
            disabled={actionLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleApproveConfirm} 
            color="success" 
            variant="contained" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Approbation...' : 'Approuver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation d'annulation */}
      <Dialog
        open={openCancelDialog}
        onClose={() => !actionLoading && setOpenCancelDialog(false)}
      >
        <DialogTitle>Annuler la distribution</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir annuler cette distribution pour{' '}
            {selectedDistribution ? `${selectedDistribution.first_name} ${selectedDistribution.last_name}` : ''}?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCancelDialog(false)} 
            disabled={actionLoading}
          >
            Retour
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Annulation...' : 'Annuler la distribution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de détails */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails de la distribution</DialogTitle>
        <DialogContent>
          {selectedDistribution && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Informations générales
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" width="30%">ID</TableCell>
                      <TableCell>{selectedDistribution.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Date</TableCell>
                      <TableCell>
                        {format(new Date(selectedDistribution.distribution_date), 'PPP', { locale: fr })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Statut</TableCell>
                      <TableCell>
                        <Chip 
                          label="En attente" 
                          color="warning" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" gutterBottom>
                Informations du bénéficiaire
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" width="30%">Site</TableCell>
                      <TableCell>{selectedDistribution.site_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Ménage</TableCell>
                      <TableCell>{selectedDistribution.household_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Token</TableCell>
                      <TableCell>{selectedDistribution.token_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Bénéficiaire</TableCell>
                      <TableCell>{`${selectedDistribution.first_name} ${selectedDistribution.last_name}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Nombre de bénéficiaires</TableCell>
                      <TableCell>{selectedDistribution.beneficiary_count}</TableCell>
                    </TableRow>
                    {selectedDistribution.notes && (
                      <TableRow>
                        <TableCell component="th" scope="row">Notes</TableCell>
                        <TableCell>{selectedDistribution.notes}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            Fermer
          </Button>
          <Button 
            onClick={() => {
              setOpenDetailsDialog(false);
              handleApproveClick(selectedDistribution!);
            }} 
            color="success" 
            variant="contained"
          >
            Approuver
          </Button>
          <Button 
            onClick={() => {
              setOpenDetailsDialog(false);
              handleCancelClick(selectedDistribution!);
            }} 
            color="error" 
            variant="outlined"
          >
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingDistributions;
