import React, { useId, useMemo, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, IconButton, Menu, MenuItem, Stack, TextField,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { AgGridReact } from 'ag-grid-react';
import dayjs from 'dayjs';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useDispatch } from 'react-redux';
import { useLabelFilter } from '../../hooks/useLabelFilter';
import { useDeleteExpenseMutation, useUpdateExpenseMutation } from '../../stores/api/expenseApi';
import { useDeleteIncomeMutation, useUpdateIncomeMutation } from '../../stores/api/incomeApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import { isLabelActive } from '../../utils/labelActive';

function isEditable(row) {
  return Boolean(row?.transactionId && row.version && Date.parse(row.editExpiresAt) > Date.now());
}

function TransactionActions({ onSelect }) {
  const id = useId();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);
  const select = (mode) => {
    close();
    onSelect(mode);
  };

  return (
    <Stack alignItems="center" justifyContent="center" height="100%">
      <IconButton
        id={id}
        aria-label="Transaction actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        MenuListProps={{ id: `${id}-menu`, 'aria-labelledby': id }}
      >
        <MenuItem onClick={() => select('edit')}>Edit</MenuItem>
        <MenuItem onClick={() => select('delete')} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </Stack>
  );
}

function getFields(row, amountField) {
  return {
    amount: String(row[amountField] ?? ''),
    note: row[amountField + '_Note'] ?? '',
    timestamp: (row.Timestamp ?? '').replace(' ', 'T'),
    ...(amountField === 'Expense' && { onBehalfId: row.onBehalfId ?? '' }),
  };
}

function getLabelPath(label) {
  return {
    l1: String(label?.L1 ?? '').trim(),
    l2: String(label?.L2 ?? '').trim(),
    l3: String(label?.L3 ?? '').trim(),
  };
}

export default function TransactionReportGrid({ rows, columns, type, labels, onBehalfUsers }) {
  const dispatch = useDispatch();
  const [action, setAction] = useState(null);
  const [fields, setFields] = useState({});
  const [labelPath, setLabelPath] = useState(null);
  const [error, setError] = useState('');
  const [updateExpense, expenseUpdate] = useUpdateExpenseMutation();
  const [deleteExpense, expenseDelete] = useDeleteExpenseMutation();
  const [updateIncome, incomeUpdate] = useUpdateIncomeMutation();
  const [deleteIncome, incomeDelete] = useDeleteIncomeMutation();
  const isExpense = type === 'expense';
  const amountField = isExpense ? 'Expense' : 'Income';
  const busy = (isExpense ? expenseUpdate : incomeUpdate).isLoading
    || (isExpense ? expenseDelete : incomeDelete).isLoading;

  const columnDefs = useMemo(() => [
    ...columns,
    {
      colId: 'transactionActions',
      headerName: 'Actions',
      width: 96,
      lockPosition: 'right',
      sortable: false,
      filter: false,
      cellRenderer: ({ data }) => {
        if (!isEditable(data)) return null;
        const open = (mode) => {
          if (!isEditable(data)) {
            dispatch(showSnackbar({ message: 'The 7-day window has ended.', type: 'error' }));
            return;
          }
          setError('');
          setAction({ mode, row: data });
          if (mode === 'edit') {
            setFields(getFields(data, amountField));
            setLabelPath(null);
          }
        };
        return <TransactionActions onSelect={open} />;
      },
    },
  ], [amountField, columns, dispatch]);

  const recipients = Object.entries(onBehalfUsers?.userKeyByName ?? {});
  const editing = action?.mode === 'edit';
  const editRow = editing ? action.row : null;
  const currentLabel = useMemo(() => {
    if (!editRow) return null;
    return labels?.find((label) => label.id === editRow.labelId) ?? { ...editRow, id: editRow.labelId };
  }, [editRow, labels]);
  const labelOptions = useMemo(() => {
    const active = (labels ?? []).filter(isLabelActive);
    if (currentLabel && !active.some((label) => label.id === currentLabel.id)) {
      return [...active, currentLabel];
    }
    return active;
  }, [currentLabel, labels]);
  const originalPath = getLabelPath(currentLabel);
  const { l1, l2, l3 } = labelPath ?? originalPath;
  const { l1Options, l2Options, l3Options, selectedLabelId } = useLabelFilter(
    labelOptions, { l1, l2, l3 }, isExpense ? 3 : 2
  );
  const labelChanged = l1 !== originalPath.l1 || l2 !== originalPath.l2
    || (isExpense && l3 !== originalPath.l3);
  const labelLevels = [
    { level: 'l1', value: l1, options: l1Options },
    { level: 'l2', value: l2, options: l2Options, disabled: !l1 },
    ...(isExpense ? [{ level: 'l3', value: l3, options: l3Options, disabled: !l2 }] : []),
  ];
  const close = () => setAction(null);
  const change = (field) => (event) => {
    setFields((previous) => ({ ...previous, [field]: event.target.value }));
    setError('');
  };
  const changeLabel = (level, value) => {
    const nextPath = { l1, l2, l3, [level]: value };
    if (level === 'l1') nextPath.l2 = '';
    if (level !== 'l3') nextPath.l3 = '';
    setLabelPath(nextPath);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!action || busy) return;
    const request = { id: action.row.transactionId, version: action.row.version };
    try {
      if (editing) {
        const original = getFields(action.row, amountField);
        const changes = Object.fromEntries(Object.entries(fields).filter(
          ([field, value]) => original[field] !== value
        ));
        if (labelChanged) {
          if (!selectedLabelId) {
            setError('Select all label levels.');
            return;
          }
          if (selectedLabelId !== action.row.labelId) changes.labelId = selectedLabelId;
        }
        if (Object.keys(changes).length === 0) {
          close();
          return;
        }
        if (changes.timestamp !== undefined) {
          const timestamp = dayjs(changes.timestamp);
          if (timestamp.isAfter(dayjs())) {
            setError('Transaction date and time cannot be in the future.');
            return;
          }
          changes.timestamp = timestamp.format('YYYY-MM-DD HH:mm:ss');
        }
        await (isExpense ? updateExpense : updateIncome)({ ...request, changes }).unwrap();
      } else {
        await (isExpense ? deleteExpense : deleteIncome)(request).unwrap();
      }
      dispatch(showSnackbar({ message: `${amountField} ${editing ? 'updated' : 'deleted'}.`, type: 'success' }));
      close();
    } catch (requestError) {
      setError(requestError?.data?.error ?? `Could not ${editing ? 'save' : 'delete'} this ${type}.`);
    }
  };

  return (
    <>
      <AgGridReact rowData={rows} columnDefs={columnDefs} />
      <Dialog open={action !== null} onClose={busy ? undefined : close} fullWidth maxWidth="sm">
        <form onSubmit={submit}>
          <DialogTitle>{editing ? 'Edit' : 'Delete'} {type}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {editing ? (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField label="Amount (₹)" type="number" inputProps={{ step: 'any' }}
                  value={fields.amount} onChange={change('amount')} required />
                <TextField label="Date and time" type="datetime-local" InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 1, max: dayjs().format('YYYY-MM-DDTHH:mm:ss') }}
                  value={fields.timestamp} onChange={change('timestamp')} required />
                {labelLevels.map(({ level, value, options, disabled }) => (
                  <TextField
                    key={level}
                    select
                    label={level.toUpperCase()}
                    value={value}
                    disabled={disabled}
                    onChange={(event) => changeLabel(level, event.target.value)}
                  >
                    <MenuItem value="" disabled>Select Label</MenuItem>
                    {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                ))}
                {isExpense && (
                  <TextField select label="On behalf of" value={fields.onBehalfId}
                    onChange={change('onBehalfId')} required>
                    {!recipients.some(([, id]) => id === fields.onBehalfId) && (
                      <MenuItem value={fields.onBehalfId}>{action.row['On-Behalf']}</MenuItem>
                    )}
                    {recipients.map(([name, id]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
                  </TextField>
                )}
                <TextField label="Note" value={fields.note} onChange={change('note')} multiline minRows={2} />
              </Stack>
            ) : action && (
              <DialogContentText>Delete this {type} of ₹{action.row[amountField]}?</DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="contained" color={editing ? 'primary' : 'error'} disabled={busy}>
              {editing ? 'Save changes' : 'Delete'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
