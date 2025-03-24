import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { REQUIRED_COLUMNS, OPTIONAL_COLUMNS } from '../lib/excelMapping';

interface ColumnMappingDialogProps {
  open: boolean;
  onClose: () => void;
  availableColumns: string[];
  columnMapping: { [key: string]: string };
  onMappingChange: (mapping: { [key: string]: string }) => void;
  onConfirm: () => void;
}

const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({
  open,
  onClose,
  availableColumns,
  columnMapping,
  onMappingChange,
  onConfirm,
}) => {
  const handleMappingChange = (field: string, excelColumn: string) => {
    const newMapping = { ...columnMapping, [field]: excelColumn };
    onMappingChange(newMapping);
  };

  // Vérifier si tous les champs requis sont mappés
  const isMappingComplete = () => {
    return Object.keys(REQUIRED_COLUMNS).every(
      (field) => columnMapping[field] && columnMapping[field] !== ''
    );
  };

  // Obtenir les colonnes non mappées
  const getUnmappedRequiredFields = () => {
    return Object.entries(REQUIRED_COLUMNS)
      .filter(([field]) => !columnMapping[field])
      .map(([_, config]) => config.possibleNames[0]);
  };

  const unmappedFields = getUnmappedRequiredFields();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Mapper les colonnes Excel</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Colonnes requises
            </Typography>
          </Grid>
          {Object.entries(REQUIRED_COLUMNS).map(([field, config]) => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth>
                <InputLabel>{config.possibleNames[0]}</InputLabel>
                <Select
                  value={columnMapping[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value as string)}
                  label={config.possibleNames[0]}
                >
                  <MenuItem value="">
                    <em>Sélectionner une colonne</em>
                  </MenuItem>
                  {availableColumns.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Colonnes optionnelles
            </Typography>
          </Grid>
          {Object.entries(OPTIONAL_COLUMNS).map(([field, config]) => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth>
                <InputLabel>{config.possibleNames[0]}</InputLabel>
                <Select
                  value={columnMapping[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value as string)}
                  label={config.possibleNames[0]}
                >
                  <MenuItem value="">
                    <em>Sélectionner une colonne</em>
                  </MenuItem>
                  {availableColumns.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>

        {unmappedFields.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Colonnes requises non mappées : {unmappedFields.join(', ')}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={!isMappingComplete()}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnMappingDialog;
