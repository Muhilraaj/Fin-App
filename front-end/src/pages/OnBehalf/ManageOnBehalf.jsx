import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useDispatch } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  useCreateOnBehalfUserMutation,
  useGetAdminOnBehalfUsersQuery,
  useUpdateOnBehalfUserMutation,
} from '../../stores/api/onBehalfAdminApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import { usePageActions } from '../../components/layout/PageActionsContext';
import OnBehalfFormDialog from './OnBehalfFormDialog';

const emptyValues = {
  'On-Behalf': '',
  Name: '',
  Relationship: '',
};

const searchableFields = ['On-Behalf', 'Name', 'Relationship', 'id'];

function filterRows(rows, search) {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) =>
    searchableFields.some((key) => String(row[key] ?? '').toLowerCase().includes(term))
  );
}

export default function ManageOnBehalf() {
  const dispatch = useDispatch();
  const { setActions } = usePageActions();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const { data = [], isLoading, isError } = useGetAdminOnBehalfUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateOnBehalfUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateOnBehalfUserMutation();

  const rows = useMemo(() => filterRows(data, search), [data, search]);

  const columnDefs = useMemo(
    () => [
      { field: 'On-Behalf', headerName: 'On-Behalf', flex: 1, minWidth: 120 },
      { field: 'Name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'Relationship', headerName: 'Relationship', flex: 1, minWidth: 120 },
      { field: 'id', headerName: 'ID', flex: 1, minWidth: 220 },
      { field: 'pk', headerName: 'PK', width: 80 },
      {
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Button
            size="small"
            sx={{ mt: 0.5 }}
            onClick={() => {
              setEditingRow(params.data);
              setDialogOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  const handleSave = async (body) => {
    try {
      if (editingRow) {
        await updateUser({ id: editingRow.id, body }).unwrap();
        dispatch(showSnackbar({ message: 'User updated', type: 'success' }));
      } else {
        await createUser(body).unwrap();
        dispatch(showSnackbar({ message: 'User created', type: 'success' }));
      }
      setDialogOpen(false);
      setEditingRow(null);
    } catch (error) {
      dispatch(showSnackbar({
        message: error?.data?.error ?? 'Failed to save user',
        type: 'error',
      }));
    }
  };

  useEffect(() => {
    setActions(
      <Button
        variant="contained"
        color="success"
        onClick={() => {
          setEditingRow(null);
          setDialogOpen(true);
        }}
      >
        Add User
      </Button>
    );
    return () => setActions(null);
  }, [setActions]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          label="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
        />
        <Typography variant="body2" color="text.secondary">
          {rows.length} user{rows.length === 1 ? '' : 's'}
        </Typography>
      </Stack>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load on-behalf users.</Alert>}
      {!isLoading && !isError && (
        <Box className="ag-theme-quartz" sx={{ width: '100%', height: 480 }}>
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            pagination
            paginationPageSize={25}
          />
        </Box>
      )}

      <OnBehalfFormDialog
        open={dialogOpen}
        isEdit={Boolean(editingRow)}
        initialValues={editingRow ?? emptyValues}
        onClose={() => {
          setDialogOpen(false);
          setEditingRow(null);
        }}
        onSubmit={handleSave}
        isSubmitting={isCreating || isUpdating}
      />
    </Stack>
  );
}
