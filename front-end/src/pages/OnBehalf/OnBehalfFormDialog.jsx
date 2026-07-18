import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const emptyValues = {
  'On-Behalf': '',
  Name: '',
  Relationship: '',
};

export default function OnBehalfFormDialog({
  open,
  isEdit,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [values, setValues] = useState(emptyValues);

  useEffect(() => {
    if (open) {
      setValues({
        'On-Behalf': initialValues?.['On-Behalf'] ?? '',
        Name: initialValues?.Name ?? '',
        Relationship: initialValues?.Relationship ?? '',
      });
    }
  }, [open, initialValues]);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const isValid =
    values['On-Behalf'].trim() !== ''
    && values.Name.trim() !== ''
    && values.Relationship.trim() !== '';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      'On-Behalf': values['On-Behalf'].trim(),
      Name: values.Name.trim(),
      Relationship: values.Relationship.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="On-Behalf"
              fullWidth
              required
              value={values['On-Behalf']}
              onChange={handleChange('On-Behalf')}
              helperText="Short label used in expense dropdowns"
            />
            <TextField
              label="Name"
              fullWidth
              required
              value={values.Name}
              onChange={handleChange('Name')}
            />
            <TextField
              label="Relationship"
              fullWidth
              required
              value={values.Relationship}
              onChange={handleChange('Relationship')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !isValid}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
