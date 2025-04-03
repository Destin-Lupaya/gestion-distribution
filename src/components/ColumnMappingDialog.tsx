import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

export interface ColumnMappingDialogProps {
  open: boolean;
  onClose: () => void;
  columnMapping: Record<string, string>;
  onMappingChange: (newMapping: Record<string, string>) => void;
  onConfirm: () => void;
}

const requiredFields = [
  'site_name',
  'household_id',
  'household_name',
  'token_number',
  'beneficiary_count',
  'first_name',
  'middle_name',
  'last_name'
];

const optionalFields = [
  'site_address',
  'alternate_recipient'
];

const fieldLabels: Record<string, string> = {
  site_name: 'Nom du site',
  site_address: 'Adresse du site',
  household_id: 'ID Ménage',
  household_name: 'Nom du ménage',
  token_number: 'Numéro de jeton',
  beneficiary_count: 'Nombre de bénéficiaires',
  first_name: 'Prénom',
  middle_name: 'Post-nom',
  last_name: 'Nom',
  alternate_recipient: 'Bénéficiaire suppléant'
};

const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({
  open,
  onClose,
  columnMapping,
  onMappingChange,
  onConfirm
}) => {
  const handleChange = (field: string, value: string) => {
    onMappingChange({
      ...columnMapping,
      [field]: value
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Mapping des colonnes</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {requiredFields.map(field => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth>
                <InputLabel>{fieldLabels[field]}</InputLabel>
                <Select
                  value={columnMapping[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value as string)}
                  label={fieldLabels[field]}
                >
                  <MenuItem value="">
                    <em>Non mappé</em>
                  </MenuItem>
                  {Object.values(columnMapping).map(header => (
                    <MenuItem key={header} value={header}>
                      {header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
          
          {/* Optional Fields */}
          <Grid item xs={12}>
            <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Champs optionnels</h4>
          </Grid>
          
          {optionalFields.map(field => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth>
                <InputLabel>{fieldLabels[field]}</InputLabel>
                <Select
                  value={columnMapping[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value as string)}
                  label={fieldLabels[field]}
                >
                  <MenuItem value="">
                    <em>Non mappé</em>
                  </MenuItem>
                  {Object.values(columnMapping).map(header => (
                    <MenuItem key={header} value={header}>
                      {header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnMappingDialog;
