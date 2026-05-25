import React, { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import theme from '../../assets/theme';
import { useAdminLabelCascade } from '../../hooks/useAdminLabelCascade';

const MODES_DEPTH_3 = [
  { value: 'new-l1', label: 'New category' },
  { value: 'add-l2', label: 'Add sub-category' },
  { value: 'add-l3', label: 'Add item' },
];

const MODES_DEPTH_2 = [
  { value: 'new-l1', label: 'New category' },
  { value: 'add-l2', label: 'Add sub-category' },
];

function formatPath(parts) {
  return parts.filter(Boolean).join(' / ');
}

function ParentSelect({ label, value, options, onChange, id }) {
  return (
    <FormControl fullWidth required>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function LabelFormDialog({
  open,
  depth = 3,
  labels = [],
  initialValues = {},
  isEdit = false,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const modes = depth === 3 ? MODES_DEPTH_3 : MODES_DEPTH_2;
  const [mode, setMode] = useState('new-l1');
  const [L1, setL1] = useState('');
  const [L2, setL2] = useState('');
  const [L3, setL3] = useState('');

  const { l1Options } = useAdminLabelCascade(labels, { l1: '', l2: '' }, depth);

  const l2OptionsForL3 = useAdminLabelCascade(
    labels,
    { l1: L1, l2: '' },
    depth
  ).l2Options;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setL1(initialValues.L1 ?? '');
      setL2(initialValues.L2 ?? '');
      setL3(initialValues.L3 ?? '');
      return;
    }
    setMode('new-l1');
    setL1('');
    setL2('');
    setL3('');
  }, [open, isEdit, initialValues]);

  useEffect(() => {
    if (isEdit || !open) return;
    if (mode === 'new-l1') {
      setL1('');
      setL2('');
      setL3('');
    } else if (mode === 'add-l2') {
      setL1('');
      setL2('');
      setL3('');
    } else if (mode === 'add-l3') {
      setL1('');
      setL2('');
      setL3('');
    }
  }, [mode, isEdit, open]);

  const previewPath = useMemo(() => {
    if (isEdit) {
      return depth === 3
        ? formatPath([initialValues.L1, initialValues.L2, L3.trim() || initialValues.L3])
        : formatPath([initialValues.L1, L2.trim() || initialValues.L2]);
    }
    if (mode === 'new-l1') {
      return depth === 3
        ? formatPath([L1.trim(), L2.trim(), L3.trim()])
        : formatPath([L1.trim(), L2.trim()]);
    }
    if (mode === 'add-l2') {
      return depth === 3
        ? formatPath([L1, L2.trim(), L3.trim()])
        : formatPath([L1, L2.trim()]);
    }
    return formatPath([L1, L2, L3.trim()]);
  }, [isEdit, mode, depth, L1, L2, L3, initialValues]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isEdit) {
      const payload = {
        L1: initialValues.L1,
        L2: depth === 3 ? initialValues.L2 : L2.trim(),
      };
      if (depth === 3) {
        payload.L3 = L3.trim();
      }
      onSubmit(payload);
      return;
    }

    if (mode === 'new-l1') {
      const payload = { L1: L1.trim(), L2: L2.trim() };
      if (depth === 3) payload.L3 = L3.trim();
      onSubmit(payload);
      return;
    }
    if (mode === 'add-l2') {
      const payload = { L1, L2: L2.trim() };
      if (depth === 3) payload.L3 = L3.trim();
      onSubmit(payload);
      return;
    }
    onSubmit({ L1, L2, L3: L3.trim() });
  };

  const titleSx = {
    borderLeft: `4px solid ${theme.palette.secondary.main}`,
    pl: 2,
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={titleSx}>{isEdit ? 'Edit Label' : 'Add Label'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!isEdit && (
              <RadioGroup
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                {modes.map(({ value, label }) => (
                  <FormControlLabel
                    key={value}
                    value={value}
                    control={<Radio color="secondary" />}
                    label={label}
                  />
                ))}
              </RadioGroup>
            )}

            {isEdit && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Path
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {depth === 3
                    ? formatPath([initialValues.L1, initialValues.L2, initialValues.L3])
                    : formatPath([initialValues.L1, initialValues.L2])}
                </Typography>
                <TextField
                  label="L1"
                  value={initialValues.L1 ?? ''}
                  fullWidth
                  disabled
                />
                <TextField
                  label="L2"
                  value={depth === 3 ? (initialValues.L2 ?? '') : L2}
                  onChange={(e) => setL2(e.target.value)}
                  fullWidth
                  disabled={depth === 3}
                  required
                />
                {depth === 3 && (
                  <TextField
                    label="L3"
                    value={L3}
                    onChange={(e) => setL3(e.target.value)}
                    required
                    fullWidth
                  />
                )}
              </>
            )}

            {!isEdit && mode === 'new-l1' && (
              <>
                <TextField label="L1" value={L1} onChange={(e) => setL1(e.target.value)} required fullWidth />
                <TextField label="L2" value={L2} onChange={(e) => setL2(e.target.value)} required fullWidth />
                {depth === 3 && (
                  <TextField label="L3" value={L3} onChange={(e) => setL3(e.target.value)} required fullWidth />
                )}
              </>
            )}

            {!isEdit && mode === 'add-l2' && (
              <>
                <ParentSelect
                  id="add-l2-l1"
                  label="L1"
                  value={L1}
                  options={l1Options}
                  onChange={setL1}
                />
                <TextField label="L2" value={L2} onChange={(e) => setL2(e.target.value)} required fullWidth />
                {depth === 3 && (
                  <TextField label="L3" value={L3} onChange={(e) => setL3(e.target.value)} required fullWidth />
                )}
              </>
            )}

            {!isEdit && mode === 'add-l3' && depth === 3 && (
              <>
                <ParentSelect
                  id="add-l3-l1"
                  label="L1"
                  value={L1}
                  options={l1Options}
                  onChange={(value) => {
                    setL1(value);
                    setL2('');
                  }}
                />
                <ParentSelect
                  id="add-l3-l2"
                  label="L2"
                  value={L2}
                  options={l2OptionsForL3}
                  onChange={setL2}
                />
                <TextField label="L3" value={L3} onChange={(e) => setL3(e.target.value)} required fullWidth />
              </>
            )}

            {previewPath && (
              <Typography variant="body2" color="text.secondary">
                Preview: {previewPath}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
