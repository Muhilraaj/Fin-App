import Form from 'react-bootstrap/Form';
import dayjs from 'dayjs';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import React from 'react';
import DropDown from '../../components/DropDown/DropDown';
import DateTime from '../../components/DateTime/DateTime';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { useDispatch } from 'react-redux';
import { useGetIncomeLabelsQuery } from '../../stores/api/labelsApi';
import { useSubmitIncomeMutation } from '../../stores/api/incomeApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import { useLabelFilter } from '../../hooks/useLabelFilter';

function IncomeForm() {
  const dispatch = useDispatch();
  const { data: labels } = useGetIncomeLabelsQuery();
  const [submitIncome, { isLoading: isSubmitting }] = useSubmitIncomeMutation();

  const [L1Value, setL1Value] = useState('*');
  const [L2Value, setL2Value] = useState('*');
  const [DatetimeValue, setDatetimeValue] = useState(dayjs());
  const [incomeError, setincomeError] = useState(false);
  const [L1Error, setL1Error] = useState(false);
  const [L2Error, setL2Error] = useState(false);
  const [datetimeError, setdatetimeError] = useState(null);
  const [datetimestateError, setdatetimestateError] = useState(false);

  const { l1Options, l2Options, selectedLabelId } = useLabelFilter(
    labels,
    { l1: L1Value, l2: L2Value },
    2
  );

  const resetForm = () => {
    setL2Value('*');
    setL1Value('*');
    setL2Error(false);
    setL1Error(false);
    setincomeError(false);
    setDatetimeValue(dayjs());
  };

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

  const L1_Handler = (e) => {
    setL1Value(e.target.value);
    DropDown_ErrorHandler(e.target.value, setL1Error);
  };
  const L2_Handler = (e) => {
    setL2Value(e.target.value);
    DropDown_ErrorHandler(e.target.value, setL2Error);
  };

  const income_Handler = (e) => {
    income_ErrorHandler(e.target.value, setincomeError);
  };

  const Datetime_ErrorHandler = (e) => {
    setdatetimeError(e);
  };

  const Datetime_Handler = (e) => {
    setDatetimeValue(e);
  };

  const income_ErrorHandler = (value, setter) => {
    if (isNaN(value) || value.length === 0) {
      setter(true);
      return true;
    }
    setter(false);
    return false;
  };

  const DropDown_ErrorHandler = (value, setter) => {
    if (value === '*') {
      setter(true);
      return true;
    }
    setter(false);
    return false;
  };

  const formatDatetime = (dt) => {
    dt = new Date(dt);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    };
    return dt.toLocaleString('en-US', options).replace(/,/g, '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ps = income_ErrorHandler(event.target.amount.value, setincomeError);
    const l1s = DropDown_ErrorHandler(event.target[2].value, setL1Error);
    const l2s = DropDown_ErrorHandler(event.target[4].value, setL2Error);
    if (event.target[8].value === '') {
      setdatetimestateError(true);
    } else {
      setdatetimestateError(false);
    }
    if (!(ps | l1s | l2s) && datetimeError === null && event.target[8].value !== '') {
      const payload = {
        Income: event.target.amount.value,
        Label_key: selectedLabelId,
        Income_Note: event.target.Comments.value,
        Timestamp: formatDatetime(DatetimeValue),
      };
      try {
        await submitIncome(payload).unwrap();
        dispatch(showSnackbar({ message: 'Form Submitted Successfully', type: 'success' }));
        event.target.amount.value = '';
        event.target.Comments.value = '';
        resetForm();
      } catch (error) {
        console.log(error);
        dispatch(showSnackbar({ message: 'Error in Form Submission', type: 'error' }));
      }
    }
  };

  return (
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
                    onChange={(e) => { income_Handler(e); }}
                    startAdornment={<InputAdornment position="start">₹ </InputAdornment>}
                    label="Expense"
                  />
                  <FormHelperText>{incomeError ? 'Enter a valid income(Eg: 10, 20.5)' : ''}</FormHelperText>
                </FormControl>
                <Stack spacing={2} direction="row">
                  <DropDown id='L1' options={l1Options} value={L1Value} handler={L1_Handler} error={L1Error} label={"L1"} width='100%' maxWidth={550} />
                  <DropDown id='L2' options={l2Options} value={L2Value} handler={L2_Handler} error={L2Error} label={"L2"} width='100%' maxWidth={550} />
                </Stack>
                <TextField id="Comments" label="Comments" variant="outlined" />
                <Stack spacing={2} direction="row">
                  <DateTime id='Datetime' label={"Date Time"} value={DatetimeValue} handler={Datetime_Handler} e_handler={Datetime_ErrorHandler} e_message={errorDateMessage}></DateTime>
                  <Button type="submit" variant="contained" color="success" disabled={isSubmitting} sx={{
                    width: "100%",
                  }}>
                    Submit
                  </Button>
                </Stack>
              </Stack>
              <FormHelperText error={datetimestateError}>{datetimestateError ? 'Datetime cannot be empty' : ''}</FormHelperText>
            </Form>
          </Box>
        </Box>
      </Stack>
  );
}

export default IncomeForm;
