import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import React, { useEffect, useState,useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import theme from '../../assets/theme';
import API from '../../services/API'
import DropDown from '../../components/DropDown/DropDown';
import Stack from '@mui/material/Stack';
import Date from '../../components/Date/Date';
import dayjs from 'dayjs';

const columns = [
  {
    field: 'L1',
    width: 200,
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>L1</p>
    },
    editable: true,
  },
  {
    field: 'L2',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>L2</p>
    },
    width: 200,
    editable: true,
  },
  {
    field: 'L3',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>L3</p>
    },
    width: 200,
    editable: true,
  },
  {
    field: 'On-Behalf',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>On-Behalf</p>
    },
    width: 200,
    editable: true,
  },
  {
    field: 'Expense_Note',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>Expense Note</p>
    },
    width: 200,
    editable: true,
  },
  {
    field: 'Expense',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>Expense</p>
    },
    width: 200,
    editable: true,
  },
  {
    field: 'Timestamp',
    renderHeader:(params)=>{
      return <p style={{ fontWeight: 'bold' }}>Timestamp</p>
    },
    width: 200,
    editable: true,
  }

];



export default function ExpenseDetails() {
    const [expense,setExpense] = useState([]);
    const [expenseData,setExpenseData] = useState([]);
    const [labels, setLabels] = useState({ '*': { '*': { '*': { 'L1': [], 'L2': [], 'L3': [] } } } });
    const [L1Options, setL1Options] = useState([]);
    const [L2Options, setL2Options] = useState([]);
    const [L3Options, setL3Options] = useState([]);
    const [ObOptions, setObOptions] = useState([]);
    const [UserKey, setUserKey] = useState({});
    const [L1Value, setL1Value] = useState('*');
    const [L2Value, setL2Value] = useState('*');
    const [L3Value, setL3Value] = useState('*');
    const [ObValue, setObValue] = useState('*');
    const [DatetimeValue, setDatetimeValue] = useState(dayjs());
    const [params,setParams] = useState({'monthYear':dayjs().format("YYYYMM")});

    useEffect(()=>{
    (async ()=>{
        const response = await API.ExpenseLabel();
        setLabels(response);
        setL1Options(response['*']['*']['*']['L1'])
        setL2Options(response['*']['*']['*']['L2'])
        setL3Options(response['*']['*']['*']['L3'])
        const response2 = await API.OnBehalf();
        setObOptions(response2[0]);
        setUserKey(response2[1]);
    })();
    },[]);
    useEffect(()=>{
      (
        async ()=>{
        const response = await API.GetExpense(params);
        setExpenseData(response.data);
        setExpense(response.totalExpense);
        }
      )();
    },[params]);
    useMemo(() => {
      setL1Options(labels[L1Value][L2Value][L3Value]['L1']);
      setL2Options(labels[L1Value][L2Value][L3Value]['L2']);
      setL3Options(labels[L1Value][L2Value][L3Value]['L3']);
    }, [L1Value, L2Value, L3Value]);
  
    const L1_Handler = (e) => {
      setL1Value(e.target.value);
      let tparams=Object.assign({},params);
      tparams['L1']=e.target.value;
      if(e.target.value==='*')
      {     
        delete tparams.L1;
      }
      setParams(tparams);
    }
    const L2_Handler = (e) => {
      setL2Value(e.target.value);
      let tparams=Object.assign({},params);
      tparams['L2']=e.target.value;
      if(e.target.value==='*')
      {     
        delete tparams.L2;
      }
      setParams(tparams);
    }
    const L3_Handler = (e) => {
      setL3Value(e.target.value);
      let tparams=Object.assign({},params);
      tparams['L3']=e.target.value;
      if(e.target.value==='*')
      {     
        delete tparams.L3;
      }
      setParams(tparams);
    }
  
    const OnBehalf_Handler = (e) => {
      setObValue(e.target.value);
      let tparams=Object.assign({},params);
      tparams['userKey']=UserKey[e.target.value];
      if(e.target.value==='*')
      {     
        delete tparams.userKey;
      }
      setParams(tparams);
    }

    const Datetime_Handler = (e) => {
      setDatetimeValue(e);
      const tparams = {'monthYear':dayjs(e).format("YYYYMM")}
      setParams(tparams);
    }
  return (
    <ThemeProvider theme={theme} >
      <Box sx={{ height: '100%', width: '100%', overflow: 'auto',padding:2}}>
        {/*mobile view*/}
        <Stack direction="column" spacing={2} sx={{ display: { xs: 'flex', sm: 'none' } }}>
          <Stack direction="row" sx={{display:'flex'}} spacing={2} >
              <Box sx={{display:'flex'}}>
                <Card variant="outlined" sx={{boxShadow:5}}>
                  <CardContent>
                    <Typography level="title-md" sx={{textAlign:'left',fontWeight: 'bold',fontSize: 'h6.fontSize'}} >₹{expense}</Typography>
                  </CardContent>
                </Card>
              </Box>
              <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
            </Stack>
            <Stack direction="row" sx={{display:'flex'}} spacing={2} >
              <DropDown id='L1' p={2.5} boxShadow={5} options={L1Options} value={L1Value} handler={L1_Handler} label={"L1"} />  
              <DropDown id='L2' p={2.5} boxShadow={5} options={L2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
            </Stack>
            <Stack direction="row" sx={{display:'flex'}} spacing={2}>
              <DropDown id='L3' p={2.5} boxShadow={5} options={L3Options} value={L3Value} handler={L3_Handler} label={"L3"} />
              <DropDown id='Onbehalf' p={2.5} boxShadow={5} options={ObOptions} value={ObValue} handler={OnBehalf_Handler} label={"Onbehalf"} />
            </Stack>
        </Stack>
        {/*desktop view*/}
        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', sm: 'flex' },alignItems: 'center' }} >
            <Box sx={{display:'flex'}} style={{ alignSelf: 'flex-start' }}>
              <Card variant="outlined" sx={{boxShadow:5}}>
                <CardContent>
                  <Typography level="title-md" sx={{textAlign:'left',fontWeight: 'bold',fontSize: 'h6.fontSize'}} >₹{expense}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Stack style={{ marginLeft: 'auto' }} direction="row" spacing={2}>
              <Date label={'Month Year'} p={1} boxShadow={5} defaultValue={DatetimeValue} views={['month', 'year']} handler={Datetime_Handler} />
              <DropDown id='L1' p={1} boxShadow={5} options={L1Options} value={L1Value} handler={L1_Handler} label={"L1"} />  
              <DropDown id='L2' p={1} boxShadow={5} options={L2Options} value={L2Value} handler={L2_Handler} label={"L2"} />
              <DropDown id='L3' p={1} boxShadow={5} options={L3Options} value={L3Value} handler={L3_Handler} label={"L3"} />
              <DropDown id='Onbehalf' p={1} boxShadow={5} options={ObOptions} value={ObValue} handler={OnBehalf_Handler} label={"Onbehalf"} />
            </Stack>
            
        </Stack>
        <Box sx={{ marginTop: 2,boxShadow:5,boxDecorationBreak:2 }}>
          <DataGrid
            getRowId={(row)=>row.Expense_Note}
            rows={expenseData}
            columns={columns}
            disableColumnFilter
            pagination={false}
          />
        </Box>
      </Box>
    </ThemeProvider>
   
  );
}