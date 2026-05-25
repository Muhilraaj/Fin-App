import Box from '@mui/material/Box';
import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import DropDown from '../../components/DropDown/DropDown';
import Stack from '@mui/material/Stack';
import Date from '../../components/Date/Date';
import dayjs from 'dayjs';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useGetExpenseLabelsForFilterQuery } from '../../stores/api/labelsApi';
import { useGetOnBehalfUsersQuery } from '../../stores/api/usersApi';
import { useGetExpensesQuery } from '../../stores/api/expenseApi';
import { useLabelFilter } from '../../hooks/useLabelFilter';

const columns = [
  {
    field: 'L1',
    width: 200,
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>L1</p>,
    editable: true,
  },
  {
    field: 'L2',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>L2</p>,
    width: 200,
    editable: true,
  },
  {
    field: 'L3',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>L3</p>,
    width: 200,
    editable: true,
  },
  {
    field: 'On-Behalf',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>On-Behalf</p>,
    width: 200,
    editable: true,
  },
  {
    field: 'Expense_Note',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>Expense Note</p>,
    width: 400,
    editable: true,
  },
  {
    field: 'Expense',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>Expense</p>,
    width: 200,
    editable: true,
  },
  {
    field: 'Timestamp',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>Timestamp</p>,
    width: 200,
    editable: true,
  },
];

export default function ExpenseDetails() {
  const { data: labels } = useGetExpenseLabelsForFilterQuery();
  const { data: onBehalfUsers } = useGetOnBehalfUsersQuery();

  const [L1Value, setL1Value] = useState('*');
  const [L2Value, setL2Value] = useState('*');
  const [L3Value, setL3Value] = useState('*');
  const [ObValue, setObValue] = useState('*');
  const [DatetimeValue, setDatetimeValue] = useState(dayjs());
  const [params, setParams] = useState({ monthYear: dayjs().format('YYYYMM') });
  const colDefs = useState(columns)[0];

  const { data: expenseResponse } = useGetExpensesQuery(params);
  const expenseData = expenseResponse?.data ?? [];
  const expense = expenseResponse?.totalExpense ?? [];

  const { l1Options, l2Options, l3Options } = useLabelFilter(
    labels,
    { l1: L1Value, l2: L2Value, l3: L3Value },
    3
  );
  const ObOptions = onBehalfUsers?.options ?? [];
  const UserKey = onBehalfUsers?.userKeyByName ?? {};

  const L1_Handler = (e) => {
    setL1Value(e.target.value);
    const tparams = { ...params };
    if (e.target.value === '*') {
      delete tparams.L1;
    } else {
      tparams.L1 = e.target.value;
    }
    setParams(tparams);
  };
  const L2_Handler = (e) => {
    setL2Value(e.target.value);
    const tparams = { ...params };
    if (e.target.value === '*') {
      delete tparams.L2;
    } else {
      tparams.L2 = e.target.value;
    }
    setParams(tparams);
  };
  const L3_Handler = (e) => {
    setL3Value(e.target.value);
    const tparams = { ...params };
    if (e.target.value === '*') {
      delete tparams.L3;
    } else {
      tparams.L3 = e.target.value;
    }
    setParams(tparams);
  };

  const OnBehalf_Handler = (e) => {
    setObValue(e.target.value);
    const tparams = { ...params };
    if (e.target.value === '*') {
      delete tparams.userKey;
    } else {
      tparams.userKey = UserKey[e.target.value];
    }
    setParams(tparams);
  };

  const Datetime_Handler = (e) => {
    setDatetimeValue(e);
    setParams((prev) => ({
      ...prev,
      monthYear: dayjs(e).format('YYYYMM'),
    }));
  };

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'auto', padding: 2 }}>
        <Stack direction="column" spacing={2} sx={{ display: { xs: 'flex', sm: 'none' } }}>
          <Stack direction="row" sx={{ display: 'flex' }} spacing={2} >
            <Box sx={{ display: 'flex' }}>
              <Card variant="outlined" sx={{ boxShadow: 5 }}>
                <CardContent>
                  <Typography level="title-md" sx={{ textAlign: 'left', fontWeight: 'bold', fontSize: 'h6.fontSize' }} >₹{expense}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
          </Stack>
          <Stack direction="row" sx={{ display: 'flex' }} spacing={2} >
            <DropDown id='L1' p={2.5} boxShadow={5} options={l1Options} value={L1Value} handler={L1_Handler} label={"L1"} />
            <DropDown id='L2' p={2.5} boxShadow={5} options={l2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
          </Stack>
          <Stack direction="row" sx={{ display: 'flex' }} spacing={2}>
            <DropDown id='L3' p={2.5} boxShadow={5} options={l3Options} value={L3Value} handler={L3_Handler} label={"L3"} />
            <DropDown id='Onbehalf' p={2.5} boxShadow={5} options={ObOptions} value={ObValue} handler={OnBehalf_Handler} label={"Onbehalf"} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }} >
          <Box sx={{ display: 'flex' }} style={{ alignSelf: 'flex-start' }}>
            <Card variant="outlined" sx={{ boxShadow: 5 }}>
              <CardContent>
                <Typography level="title-md" sx={{ textAlign: 'left', fontWeight: 'bold', fontSize: 'h6.fontSize' }} >₹{expense}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Stack style={{ marginLeft: 'auto' }} direction="row" spacing={2}>
            <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
            <DropDown id='L1' p={1} boxShadow={5} options={l1Options} value={L1Value} handler={L1_Handler} label={"L1"} />
            <DropDown id='L2' p={1} boxShadow={5} options={l2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
            <DropDown id='L3' p={1} boxShadow={5} options={l3Options} value={L3Value} handler={L3_Handler} label={"L3"} />
            <DropDown id='Onbehalf' p={1} boxShadow={5} options={ObOptions} value={ObValue} handler={OnBehalf_Handler} label={"Onbehalf"} />
          </Stack>
        </Stack>
        <Box sx={{ marginTop: 2, boxShadow: 5, boxDecorationBreak: 2 }}>
          <div
            className="ag-theme-quartz"
            style={{ height: 1000 }}
          >
            <AgGridReact
              rowData={expenseData}
              columnDefs={colDefs}
            />
          </div>
        </Box>
      </Box>
  );
}
