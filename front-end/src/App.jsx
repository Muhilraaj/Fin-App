//import logo from './logo.svg';
import './App.css';
import Form from 'react-bootstrap/Form';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState,useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import Container from '@mui/material/Container';
import axios from 'axios';
import jsonpAdapter from 'axios-jsonp';


let [data,setLabels]=['','']

const theme = createTheme({
  backgroundColor: '#bdbdbd',
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#000',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      light: '#0066ff',
      main: '#0044ff',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#ffcc00',
    },
    // Provide every color token (light, main, dark, and contrastText) when using
    // custom colors for props in Material UI's components.
    // Then you will be able to use it like this: `<Button color="custom">`
    // (For TypeScript, you need to add module augmentation for the `custom` value)
    custom: {
      light: '#ffa726',
      main: '#f57c00',
      dark: '#ef6c00',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
  },
});

class Labels {
  static L1 = '*';
  static L2 = '*';
  static L3 = '*';
  static d = data;
  static check(x) {
    return (x['L1'] === this.L1 || this.L1 === '*') && (x['L3'] === this.L3 || this.L3 === '*') && (x['L2'] === this.L2 || this.L2 === '*');
  }
  static getL1() {
    return data[this.L1][this.L2][this.L3]['L1'];
  }
  static getL2() {
    return data[this.L1][this.L2][this.L3]['L2'];
  }
  static getL3() {
    return data[this.L1][this.L2][this.L3]['L3'];
  }

  /*static getL1()
  {
    return Array.from(new Set(this.d.filter((x)=>{return this.check(x)}).map((x)=>{return x['L1']})));
  }
  static getL2()
  {
    return Array.from(new Set(this.d.filter((x)=>{return this.check(x)}).map((x)=>{return x['L2']})));
  }
  static getL3()
  {
    return Array.from(new Set(this.d.filter((x)=>{return this.check(x)}).map((x)=>{return x['L3']})));
  }
  */
}

function DropDown(props) {
  //console.log(data[0])
  return (
    <FormControl sx={{ minWidth: 250 }}  error={props.error}>
      <InputLabel id="demo-simple-select-label">{props.label}</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={props.value}
        label={props.label}
        onChange={(e) => { props.d_handler(e) }}
      >
        <MenuItem value="*">
          <em>Select Label</em>
        </MenuItem>
        {
          props.d_state.map(
            (d) => { return <MenuItem value={d}>{d}</MenuItem> }
          )
        }
      </Select>
      <FormHelperText>{props.error?'Select Something':''}</FormHelperText>
    </FormControl>
  );
}

function DateTime(props) {
  return (
    <FormControl sx={{ minWidth: 200 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}
      >
        <DemoContainer
          components={[
            'DateTimePicker',
          ]}
        >
          <DemoItem>
            <DateTimePicker label={props.label} 
            defaultValue={dayjs()}
            onError = {(e)=>{props.e_handler(e)}}
            slotProps={{
              textField: {
                helperText:props.e_message
              }
            }}
            required
            disableFuture/>
          </DemoItem>
        </DemoContainer>
      </LocalizationProvider>
    </FormControl>
  )
}

function App() {

  const [state1, handler1] = useState([]);
  const [state2, handler2] = useState([]);
  const [state3, handler3] = useState([]);
  let setState1;
  let setState2;
  let setState3;
  [Labels.L1, setState1] = useState('*');
  [Labels.L2, setState2] = useState('*');
  [Labels.L3, setState3] = useState('*');
  const [priceError, setPriceError] = useState(false);
  const [L1Error, setL1Error] = useState(false);
  const [L2Error, setL2Error] = useState(false);
  const [L3Error, setL3Error] = useState(false);
  const [behalfError, setbehalfError] = useState(false);
  const [datetimeError, setdatetimeError] = useState(null);
  const [datetimestateError, setdatetimestateError] = useState(false);
  const errorDateMessage = React.useMemo(() => {
    switch (datetimeError) {
      case 'disableFuture': {
        return 'Future Date Time Not Allowed';
      }
      default: {
        return '';
      }
    }
  }, [datetimeError]);


  const refreshState = () => {
    handler1(() => { return Labels.getL1() });
    handler2(() => { return Labels.getL2() });
    handler3(() => { return Labels.getL3() });
  }

  [data,setLabels]=useState();
  useEffect(() => {
    (async () => {
      try{
        let response = await axios.get(
        'https://myfinapi18.azurewebsites.net/api/labels?code=daSl1rP1F0w--C3A0DQXoltQrv8942H_aXTomPfyYZq3AzFu0xUD0A==',{ params: { answer: 42 } });
         response=JSON.parse(response.data);
         setLabels(response);
         handler1(response['*']['*']['*']['L1'])
         handler2(response['*']['*']['*']['L3'])
         handler3(response['*']['*']['*']['L3'])
    } catch (error) {
      console.error(error);
    }
    })();
  }, []);
  const L1_Handler = (e) => {
    setState1(e.target.value);
    refreshState();
    DropDown_ErrorHandler(e.target.value,setL1Error);
  }
  const L2_Handler = (e) => {
    setState2(e.target.value);
    refreshState();
    DropDown_ErrorHandler(e.target.value,setL2Error);
  }
  const L3_Handler = (e) => {
    setState3(e.target.value);
    refreshState();
    DropDown_ErrorHandler(e.target.value,setL3Error);
  }

  const Price_Handler = (e)=>{
    Price_ErrorHandler(e.target.value,setPriceError);
  }

  const Datetime_Handler = (e)=>{
    if(e!==''&&datetimeError!=='disableFuture')
    {
      setdatetimestateError(false);
    }
    else
    {
      setdatetimestateError(true);
    }
  }

  const Datetime_ErrorHandler = (e)=>{
    setdatetimeError(e);
  }
  
  const Price_ErrorHandler = (value,setter) => {
    if(isNaN(value)||value.length===0)
    {
      setter(true);
      return true;
    }
    else
    {
      setter(false);
      return false;
    }
  }

  const DropDown_ErrorHandler = (value,setter)=>{
    if(value==='*')
    {
      setter(true);
      return true;
    }
    else
    {
      setter(false);
      return false;
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const ps=Price_ErrorHandler(event.target.amount.value,setPriceError);
    const l1s=DropDown_ErrorHandler(event.target[2].value,setL1Error);
    const l2s=DropDown_ErrorHandler(event.target[4].value,setL2Error);
    const l3s=DropDown_ErrorHandler(event.target[6].value,setL3Error);
    if(event.target[12].value==='')
    {
      setdatetimestateError(true);
    }
    else
    {
      setdatetimestateError(false);
    }
    if(!(ps|l1s|l2s|l3s|behalfError)&&datetimeError===null&&event.target[12].value!=='')
    {
      console.log([event.target.amount.value,event.target[2].value,event.target[4].value,event.target[6].value,event.target[8].value,event.target.Comments.value,event.target[12].value])
    }
  };

  return (
    <ThemeProvider theme={theme} >
      <Stack spacing={5} direction="column">
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" component="div">
              Price Label
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ padding: '50px' }}
          width='700px'
          height='600px'
          alignContent="center"
          display="flex"
          
        >
          <Box sx={{ flexGrow: 1, padding: '50px' }}
            display="flex"
            border='solid'
          >
            <Form onSubmit={handleSubmit}>
              <Stack direction="column" spacing={2}>
                <FormControl error={priceError}>
                  <InputLabel htmlFor="amount">Amount</InputLabel>
                  <OutlinedInput
                    id="amount"
                    onChange={(e) => {Price_Handler(e)}}
                    startAdornment={<InputAdornment position="start">₹ </InputAdornment>}
                    label="Amount"
                  />
                  <FormHelperText>{priceError?'Enter a valid price(Eg: 10, 20.5)':''}</FormHelperText>
                </FormControl>
                <Stack spacing={2} direction="row">
                  <DropDown id='L1' d_state={state1} value={Labels.L1} d_handler={L1_Handler} error={L1Error} label={"L1"} />
                  <DropDown id='L2' d_state={state2} value={Labels.L2} d_handler={L2_Handler} error={L2Error} label={"L2"} />
                </Stack>
                <Stack spacing={2} direction="row">
                  <DropDown id='L3' d_state={state3} value={Labels.L3} d_handler={L3_Handler} error={L3Error} label={"L3"} />
                  <DropDown id='Onbehalf' d_state={state2} value={Labels.L2} d_handler={L2_Handler} label={"Onbehalf"} />
                </Stack>
                <TextField id="Comments" label="Comments" variant="outlined" />
                <Stack spacing={2} direction="row">
                  <DateTime id='Datetime' label={"Date Time"} d_handler={Datetime_Handler} e_message={errorDateMessage}></DateTime>
                  <Button type="submit" variant="contained" color="success" sx={{
                    width: 220,
                    height: 60
                  }}>
                    Submit
                  </Button>
                </Stack>
              </Stack>
              <FormHelperText error={datetimestateError}>{datetimestateError?'Datetime cannot be empty':''}</FormHelperText>
            </Form>
          </Box>
        </Box>
      </Stack>
    </ThemeProvider>
  );
}

export default App;