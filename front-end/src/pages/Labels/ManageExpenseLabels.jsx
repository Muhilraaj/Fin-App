import React, { useMemo, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextField from '@mui/material/TextField';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import DropDown from '../../components/DropDown/DropDown';
import { useLabelFilter } from '../../hooks/useLabelFilter';
import {
  useCreateExpenseLabelMutation,
  useDeleteExpenseLabelMutation,
  useGetAdminExpenseLabelsQuery,
  useRenameExpenseLabelMutation,
} from '../../stores/api/labelsAdminApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import LabelFormDialog from './LabelFormDialog';

const expenseColumns = [
  { field: 'L1', headerName: 'L1', flex: 1, minWidth: 160 },
  { field: 'L2', headerName: 'L2', flex: 1, minWidth: 160 },
  { field: 'L3', headerName: 'L3', flex: 1, minWidth: 160 },
];

function filterRows(rows, { l1, l2, l3, search }) {
  let result = rows;
  if (l1 !== '*') result = result.filter((row) => row.L1 === l1);
  if (l2 !== '*') result = result.filter((row) => row.L2 === l2);
  if (l3 !== '*') result = result.filter((row) => row.L3 === l3);

  const term = search.trim().toLowerCase();
  if (!term) return result;
  return result.filter((row) =>
    ['L1', 'L2', 'L3'].some((key) => String(row[key] ?? '').toLowerCase().includes(term))
  );
}

export default function ManageExpenseLabels() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [scope, setScope] = useState('regular');
  const [filterL1, setFilterL1] = useState('*');
  const [filterL2, setFilterL2] = useState('*');
  const [filterL3, setFilterL3] = useState('*');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data = [], isLoading, isError } = useGetAdminExpenseLabelsQuery(scope);
  const [createLabel, { isLoading: isCreating }] = useCreateExpenseLabelMutation();
  const [renameLabel, { isLoading: isRenaming }] = useRenameExpenseLabelMutation();
  const [deleteLabel, { isLoading: isDeleting }] = useDeleteExpenseLabelMutation();

  const { l1Options, l2Options, l3Options } = useLabelFilter(
    data,
    { l1: filterL1, l2: filterL2, l3: filterL3 },
    3
  );

  const rows = useMemo(
    () => filterRows(data, { l1: filterL1, l2: filterL2, l3: filterL3, search }),
    [data, filterL1, filterL2, filterL3, search]
  );

  const columnDefs = useMemo(
    () => [
      ...expenseColumns,
      {
        headerName: 'Actions',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Button size="small" onClick={() => { setEditingRow(params.data); setDialogOpen(true); }}>
              Edit
            </Button>
            <Button size="small" color="error" onClick={() => setDeleteTarget(params.data)}>
              Delete
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  const handleFilterL1 = (e) => {
    setFilterL1(e.target.value);
    setFilterL2('*');
    setFilterL3('*');
  };

  const handleFilterL2 = (e) => {
    setFilterL2(e.target.value);
    setFilterL3('*');
  };

  const handleSave = async (payload) => {
    try {
      if (payload.type === 'rename') {
        const result = await renameLabel({
          scope,
          level: payload.level,
          id: payload.id,
          from: payload.from,
          to: payload.to,
        }).unwrap();
        const count = result.updatedCount ?? 1;
        dispatch(showSnackbar({
          message: count === 1 ? 'Label updated' : `Renamed ${count} labels`,
          type: 'success',
        }));
      } else {
        const body = scope === 'construction'
          ? { ...payload.body, Custom: 'Construction' }
          : payload.body;
        await createLabel({ scope, body }).unwrap();
        dispatch(showSnackbar({ message: 'Label created', type: 'success' }));
      }
      setDialogOpen(false);
      setEditingRow(null);
    } catch (error) {
      dispatch(showSnackbar({
        message: error?.data?.error ?? 'Failed to save label',
        type: 'error',
      }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLabel({ id: deleteTarget.id, scope }).unwrap();
      dispatch(showSnackbar({ message: 'Label deleted', type: 'success' }));
      setDeleteTarget(null);
    } catch (error) {
      dispatch(showSnackbar({
        message: error?.data?.error ?? 'Failed to delete label',
        type: 'error',
      }));
    }
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={() => navigate('/page/home')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
            Expense Labels
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => { setEditingRow(null); setDialogOpen(true); }}
          >
            Add Label
          </Button>
        </Toolbar>
      </AppBar>

      <Box p={4} flex={1}>
        <Stack spacing={3}>
          <Tabs
            value={scope}
            onChange={(_, value) => {
              setScope(value);
              setSearch('');
              setFilterL1('*');
              setFilterL2('*');
              setFilterL3('*');
            }}
            TabIndicatorProps={{ sx: { bgcolor: 'success.main' } }}
            sx={{
              '& .MuiTab-root.Mui-selected': { color: 'success.main' },
            }}
          >
            <Tab value="regular" label="Regular" />
            <Tab value="construction" label="Construction" />
          </Tabs>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} flexWrap="wrap">
            <DropDown
              id="filter-l1"
              p={1}
              boxShadow={5}
              options={l1Options}
              value={filterL1}
              handler={handleFilterL1}
              label="L1"
            />
            <DropDown
              id="filter-l2"
              p={1}
              boxShadow={5}
              options={l2Options}
              value={filterL2}
              handler={handleFilterL2}
              label="L2"
            />
            <DropDown
              id="filter-l3"
              p={1}
              boxShadow={5}
              options={l3Options}
              value={filterL3}
              handler={(e) => setFilterL3(e.target.value)}
              label="L3"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search labels"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 280 }}
            />
            <Typography variant="body2" color="text.secondary">
              {rows.length} label{rows.length === 1 ? '' : 's'}
            </Typography>
          </Stack>

          {isLoading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          )}
          {isError && <Alert severity="error">Failed to load labels.</Alert>}
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
        </Stack>
      </Box>

      <LabelFormDialog
        open={dialogOpen}
        depth={3}
        labels={data}
        isEdit={Boolean(editingRow)}
        initialValues={editingRow ?? {}}
        onClose={() => { setDialogOpen(false); setEditingRow(null); }}
        onSubmit={handleSave}
        isSubmitting={isCreating || isRenaming}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Label?</DialogTitle>
        <DialogContent>
          Delete {deleteTarget?.L1} / {deleteTarget?.L2} / {deleteTarget?.L3}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
