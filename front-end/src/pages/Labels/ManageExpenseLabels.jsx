import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useDispatch } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import DropDown from '../../components/DropDown/DropDown';
import { useLabelFilter } from '../../hooks/useLabelFilter';
import {
  useCreateExpenseLabelMutation,
  useGetAdminExpenseLabelsQuery,
  useRenameExpenseLabelMutation,
  useSetExpenseLabelStatusMutation,
} from '../../stores/api/labelsAdminApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import { usePageActions } from '../../components/layout/PageActionsContext';
import { isLabelActive, labelActiveLabel } from '../../utils/labelActive';
import LabelFormDialog from './LabelFormDialog';

const expenseColumns = [
  { field: 'L1', headerName: 'L1', flex: 1, minWidth: 140 },
  { field: 'L2', headerName: 'L2', flex: 1, minWidth: 140 },
  { field: 'L3', headerName: 'L3', flex: 1, minWidth: 140 },
];

function filterRows(rows, { l1, l2, l3, activeFilter, search }) {
  let result = rows;
  if (l1 !== '*') result = result.filter((row) => row.L1 === l1);
  if (l2 !== '*') result = result.filter((row) => row.L2 === l2);
  if (l3 !== '*') result = result.filter((row) => row.L3 === l3);
  if (activeFilter === 'active') result = result.filter((row) => isLabelActive(row));
  if (activeFilter === 'inactive') result = result.filter((row) => !isLabelActive(row));

  const term = search.trim().toLowerCase();
  if (!term) return result;
  return result.filter((row) =>
    ['L1', 'L2', 'L3'].some((key) => String(row[key] ?? '').toLowerCase().includes(term))
  );
}

export default function ManageExpenseLabels() {
  const dispatch = useDispatch();
  const { setActions } = usePageActions();
  const [scope, setScope] = useState('regular');
  const [filterL1, setFilterL1] = useState('*');
  const [filterL2, setFilterL2] = useState('*');
  const [filterL3, setFilterL3] = useState('*');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const { data = [], isLoading, isError } = useGetAdminExpenseLabelsQuery(scope);
  const [createLabel, { isLoading: isCreating }] = useCreateExpenseLabelMutation();
  const [renameLabel, { isLoading: isRenaming }] = useRenameExpenseLabelMutation();
  const [setLabelStatus, { isLoading: isUpdatingStatus }] = useSetExpenseLabelStatusMutation();

  const { l1Options, l2Options, l3Options } = useLabelFilter(
    data,
    { l1: filterL1, l2: filterL2, l3: filterL3 },
    3
  );

  const rows = useMemo(
    () => filterRows(data, { l1: filterL1, l2: filterL2, l3: filterL3, activeFilter, search }),
    [data, filterL1, filterL2, filterL3, activeFilter, search]
  );

  const columnDefs = useMemo(
    () => [
      ...expenseColumns,
      {
        headerName: 'Status',
        field: 'Active',
        width: 110,
        cellRenderer: (params) => (
          <Chip
            size="small"
            label={labelActiveLabel(params.data)}
            color={isLabelActive(params.data) ? 'success' : 'default'}
            variant={isLabelActive(params.data) ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        headerName: 'Actions',
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const active = isLabelActive(params.data);
          return (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Button size="small" onClick={() => { setEditingRow(params.data); setDialogOpen(true); }}>
                Edit
              </Button>
              <Button
                size="small"
                color={active ? 'warning' : 'success'}
                onClick={() => setStatusTarget({ row: params.data, nextActive: active ? 'N' : 'Y' })}
              >
                {active ? 'Deactivate' : 'Activate'}
              </Button>
            </Stack>
          );
        },
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
        await createLabel({ scope, body: payload.body }).unwrap();
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

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      await setLabelStatus({
        id: statusTarget.row.id,
        active: statusTarget.nextActive,
        scope,
      }).unwrap();
      dispatch(showSnackbar({
        message: statusTarget.nextActive === 'Y' ? 'Label activated' : 'Label deactivated',
        type: 'success',
      }));
      setStatusTarget(null);
    } catch (error) {
      dispatch(showSnackbar({
        message: error?.data?.error ?? 'Failed to update label status',
        type: 'error',
      }));
    }
  };

  useEffect(() => {
    setActions(
      <Button
        variant="contained"
        color="success"
        onClick={() => { setEditingRow(null); setDialogOpen(true); }}
      >
        Add Label
      </Button>
    );
    return () => setActions(null);
  }, [setActions]);

  const statusDialogTitle = statusTarget?.nextActive === 'Y' ? 'Activate label?' : 'Deactivate label?';

  return (
    <Stack spacing={3}>
      <Tabs
        value={scope}
        onChange={(_, value) => {
          setScope(value);
          setSearch('');
          setFilterL1('*');
          setFilterL2('*');
          setFilterL3('*');
          setActiveFilter('all');
        }}
        TabIndicatorProps={{ sx: { bgcolor: 'success.main' } }}
        sx={{ '& .MuiTab-root.Mui-selected': { color: 'success.main' } }}
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
        <FormControl size="small" sx={{ minWidth: 160, p: 1, boxShadow: 5, bgcolor: 'background.paper' }}>
          <InputLabel id="filter-status-label">Status</InputLabel>
          <Select
            labelId="filter-status-label"
            value={activeFilter}
            label="Status"
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
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

      <LabelFormDialog
        open={dialogOpen}
        depth={3}
        labels={data.filter(isLabelActive)}
        isEdit={Boolean(editingRow)}
        initialValues={editingRow ?? {}}
        onClose={() => { setDialogOpen(false); setEditingRow(null); }}
        onSubmit={handleSave}
        isSubmitting={isCreating || isRenaming}
      />

      <Dialog open={Boolean(statusTarget)} onClose={() => setStatusTarget(null)}>
        <DialogTitle>{statusDialogTitle}</DialogTitle>
        <DialogContent>
          {statusTarget?.row?.L1} / {statusTarget?.row?.L2} / {statusTarget?.row?.L3}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusTarget(null)}>Cancel</Button>
          <Button
            color={statusTarget?.nextActive === 'Y' ? 'success' : 'warning'}
            onClick={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            {statusTarget?.nextActive === 'Y' ? 'Activate' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
