import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function LabelFormDialog({
  open,
  title,
  depth = 3,
  initialValues = {},
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [L1, setL1] = useState('');
  const [L2, setL2] = useState('');
  const [L3, setL3] = useState('');

  useEffect(() => {
    if (open) {
      setL1(initialValues.L1 ?? '');
      setL2(initialValues.L2 ?? '');
      setL3(initialValues.L3 ?? '');
    }
  }, [open, initialValues]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { L1: L1.trim(), L2: L2.trim() };
    if (depth === 3) {
      payload.L3 = L3.trim();
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="L1" value={L1} onChange={(e) => setL1(e.target.value)} required fullWidth />
            <TextField label="L2" value={L2} onChange={(e) => setL2(e.target.value)} required fullWidth />
            {depth === 3 && (
              <TextField label="L3" value={L3} onChange={(e) => setL3(e.target.value)} required fullWidth />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
