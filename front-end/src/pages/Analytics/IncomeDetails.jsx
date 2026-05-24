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
import { useGetIncomeLabelsQuery } from '../../stores/api/labelsApi';
import { useGetIncomeQuery } from '../../stores/api/incomeApi';
import { useLabelCascade } from '../../hooks/useLabelCascade';

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
    field: 'Income_Note',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>Income Note</p>,
    width: 400,
    editable: true,
  },
  {
    field: 'Income',
    renderHeader: () => <p style={{ fontWeight: 'bold' }}>Income</p>,
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

export default function IncomeDetails() {
  const { data: labels } = useGetIncomeLabelsQuery();

  const [L1Value, setL1Value] = useState('*');
  const [L2Value, setL2Value] = useState('*');
  const [DatetimeValue, setDatetimeValue] = useState(dayjs());
  const [params, setParams] = useState({ monthYear: dayjs().format('YYYYMM') });
  const colDefs = useState(columns)[0];

  const { data: incomeResponse } = useGetIncomeQuery(params);
  const incomeData = incomeResponse?.data ?? [];
  const income = incomeResponse?.totalIncome ?? [];

  const { l1Options, l2Options } = useLabelCascade(
    labels,
    { l1: L1Value, l2: L2Value },
    2
  );

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
                  <Typography level="title-md" sx={{ textAlign: 'left', fontWeight: 'bold', fontSize: 'h6.fontSize' }} >₹{income}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
          </Stack>
          <Stack direction="row" sx={{ display: 'flex' }} spacing={2} >
            <DropDown id='L1' p={2.5} boxShadow={5} options={l1Options} value={L1Value} handler={L1_Handler} label={"L1"} />
            <DropDown id='L2' p={2.5} boxShadow={5} options={l2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }} >
          <Box sx={{ display: 'flex' }} style={{ alignSelf: 'flex-start' }}>
            <Card variant="outlined" sx={{ boxShadow: 5 }}>
              <CardContent>
                <Typography level="title-md" sx={{ textAlign: 'left', fontWeight: 'bold', fontSize: 'h6.fontSize' }} >₹{income}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Stack style={{ marginLeft: 'auto' }} direction="row" spacing={2}>
            <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
            <DropDown id='L1' p={1} boxShadow={5} options={l1Options} value={L1Value} handler={L1_Handler} label={"L1"} />
            <DropDown id='L2' p={1} boxShadow={5} options={l2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
          </Stack>
        </Stack>
        <Box sx={{ marginTop: 2, boxShadow: 5, boxDecorationBreak: 2 }}>
          <div
            className="ag-theme-quartz"
            style={{ height: '100vh', width: '100%' }}
          >
            <AgGridReact
              rowData={incomeData}
              columnDefs={colDefs}
            />
          </div>
        </Box>
      </Box>
  );
}
