//import logo from './logo.svg';
import Form from 'react-bootstrap/Form';
import dayjs from 'dayjs';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import React from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import DropDown from '../../components/DropDown/DropDown';
import DateTime from '../../components/DateTime/DateTime';
import API from '../../services/API'
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import theme from '../../assets/theme';

let [data, setLabels] = ['', '']
function IncomeForm() {
    [data, setLabels] = useState({ '*': { '*': { 'L1': [], 'L2': [] } } });

    const [L1Options, setL1Options] = useState([]);
    const [L2Options, setL2Options] = useState([]);
    const [L1Value, setL1Value] = useState('*');
    const [L2Value, setL2Value] = useState('*');
    const [DatetimeValue, setDatetimeValue] = useState(dayjs());
    const [incomeError, setincomeError] = useState(false);
    const [L1Error, setL1Error] = useState(false);
    const [L2Error, setL2Error] = useState(false);
    const [datetimeError, setdatetimeError] = useState(null);
    const [datetimestateError, setdatetimestateError] = useState(false);
    const [isFormSuccess, setIsFormSuccess] = useState(false);
    const [isFormError, setIsFormError] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await API.IncomeLabel();
                setLabels(response);
                setL1Options(response['*']['*']['L1'])
                setL2Options(response['*']['*']['L2'])
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    const resetForm = () => {
        setL2Value('*');
        setL1Value('*');
        setL2Error(false);
        setL1Error(false);
        setincomeError(false);
        setDatetimeValue(dayjs());
    }
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

    useMemo(() => {
        setL1Options(data[L1Value][L2Value]['L1']);
        setL2Options(data[L1Value][L2Value]['L2']);
    }, [L1Value, L2Value]);

    const L1_Handler = (e) => {
        setL1Value(e.target.value);
        DropDown_ErrorHandler(e.target.value, setL1Error);
    }
    const L2_Handler = (e) => {
        setL2Value(e.target.value);
        DropDown_ErrorHandler(e.target.value, setL2Error);
    }

    const income_Handler = (e) => {
        income_ErrorHandler(e.target.value, setincomeError);
    }

    const Datetime_ErrorHandler = (e) => {
        setdatetimeError(e);
    }

    const Datetime_Handler = (e) => {
        setDatetimeValue(e);
    }

    const income_ErrorHandler = (value, setter) => {
        if (isNaN(value) || value.length === 0) {
            setter(true);
            return true;
        }
        else {
            setter(false);
            return false;
        }
    }

    const DropDown_ErrorHandler = (value, setter) => {
        if (value === '*') {
            setter(true);
            return true;
        }
        else {
            setter(false);
            return false;
        }
    }
    const formatDatetime = (dt) => {
        dt = new Date(dt);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        };
        return dt.toLocaleString('en-US', options).replace(/,/g, '');
    }
    const handleCloseSuccess = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setIsFormSuccess(false);
    };

    const handleCloseError = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setIsFormError(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ps = income_ErrorHandler(event.target.amount.value, setincomeError);
        const l1s = DropDown_ErrorHandler(event.target[2].value, setL1Error);
        const l2s = DropDown_ErrorHandler(event.target[4].value, setL2Error);
        if (event.target[8].value === '') {
          setdatetimestateError(true);
        }
        else {
          setdatetimestateError(false);
        }
        if (!(ps | l1s | l2s ) && datetimeError === null && event.target[8].value !== '') {
          let e = {
            "Income": event.target.amount.value,
            "L1": event.target[2].value,
            "L2": event.target[4].value,
            "Income_Note": event.target.Comments.value,
            "Timestamp": formatDatetime(DatetimeValue)
          }
          e = JSON.stringify(e);
          try {
            await API.SubmitIncome(e);
            setIsFormSuccess(true);
            event.target.amount.value = '';
            event.target.Comments.value = '';
            resetForm();
          } catch (error) {
            console.log(error);
            setIsFormError(true);
          }
    
        }
      };

    const { vertical, horizontal } = { vertical: 'bottom', horizontal: 'right' };
    return (
        <ThemeProvider theme={theme} >
            <Stack spacing={5} direction="column">
                <AppBar position="static" width="100%">
                    <Toolbar variant="dense">
                        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" color="inherit" component="div">
                            Income
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box sx={{ display: 'flex' }} p={4}
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                >
                    <Box sx={{ display: 'flex' }} p={4}
                        display="flex"
                        border='solid'
                    >
                        <Form onSubmit={handleSubmit}>
                            <Stack direction="column" spacing={2}>
                                <FormControl error={incomeError}>
                                    <InputLabel htmlFor="amount">Income</InputLabel>
                                    <OutlinedInput
                                        id="amount"
                                        onChange={(e) => { income_Handler(e) }}
                                        startAdornment={<InputAdornment position="start">₹ </InputAdornment>}
                                        label="Expense"
                                    />
                                    <FormHelperText>{incomeError ? 'Enter a valid income(Eg: 10, 20.5)' : ''}</FormHelperText>
                                </FormControl>
                                <Stack spacing={2} direction="row">
                                    <DropDown id='L1' options={L1Options} value={L1Value} handler={L1_Handler} error={L1Error} label={"L1"} width='100%' maxWidth={550} />
                                    <DropDown id='L2' options={L2Options} value={L2Value} handler={L2_Handler} error={L2Error} label={"L2"} width='100%' maxWidth={550} />
                                </Stack>
                                <TextField id="Comments" label="Comments" variant="outlined" />
                                <Stack spacing={2} direction="row">
                                    <DateTime id='Datetime' label={"Date Time"} value={DatetimeValue} handler={Datetime_Handler} e_handler={Datetime_ErrorHandler} e_message={errorDateMessage}></DateTime>
                                    <Button type="submit" variant="contained" color="success" sx={{
                                        width: "100%"
                                    }}>
                                        Submit
                                    </Button>
                                </Stack>
                            </Stack>
                            <FormHelperText error={datetimestateError}>{datetimestateError ? 'Datetime cannot be empty' : ''}</FormHelperText>
                            <Snackbar open={isFormSuccess} anchorOrigin={{ vertical, horizontal }} autoHideDuration={6000} onClose={handleCloseSuccess}>
                                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                                    Form Submitted Successfully
                                </Alert>
                            </Snackbar>
                            <Snackbar open={isFormError} anchorOrigin={{ vertical, horizontal }} autoHideDuration={6000} onClose={handleCloseError}>
                                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                                    Error in Form Submission
                                </Alert>
                            </Snackbar>
                        </Form>
                    </Box>
                </Box>
            </Stack>
        </ThemeProvider>
    );
}

export default IncomeForm;
