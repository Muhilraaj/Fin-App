import Form from 'react-bootstrap/Form';
import dayjs from 'dayjs';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import React from 'react';
import DropDown from '../../components/DropDown/DropDown';
import DateTime from '../../components/DateTime/DateTime';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { useDispatch } from 'react-redux';
import { useGetConstructionLabelsQuery } from '../../stores/api/labelsApi';
import { useGetOnBehalfUsersQuery } from '../../stores/api/usersApi';
import { useSubmitExpenseMutation } from '../../stores/api/expenseApi';
import { showSnackbar } from '../../stores/slices/snackbarSlice';
import { useLabelFilter } from '../../hooks/useLabelFilter';

function ConstructionExpenseForm() {
  const dispatch = useDispatch();
  const { data: labels } = useGetConstructionLabelsQuery();
  const { data: onBehalfUsers } = useGetOnBehalfUsersQuery();
  const [submitExpense, { isLoading: isSubmitting }] = useSubmitExpenseMutation();

  const [L1Value, setL1Value] = useState('*');
  const [L2Value, setL2Value] = useState('*');
  const [L3Value, setL3Value] = useState('*');
  const [ObValue, setObValue] = useState('*');
  const [DatetimeValue, setDatetimeValue] = useState(dayjs());
  const [priceError, setPriceError] = useState(false);
  const [L1Error, setL1Error] = useState(false);
  const [L2Error, setL2Error] = useState(false);
  const [L3Error, setL3Error] = useState(false);
  const [ObError, setObError] = useState(false);
  const [behalfError, setbehalfError] = useState(false);
  const [datetimeError, setdatetimeError] = useState(null);
  const [datetimestateError, setdatetimestateError] = useState(false);

  const { l1Options, l2Options, l3Options, selectedLabelId } = useLabelFilter(
    labels,
    { l1: L1Value, l2: L2Value, l3: L3Value },
    3
  );
  const ObOptions = onBehalfUsers?.options ?? [];

  const resetForm = () => {
    setL3Value('*');
    setL2Value('*');
    setL1Value('*');
    setObValue('*');
    setL3Error(false);
    setL2Error(false);
    setL1Error(false);
    setPriceError(false);
    setbehalfError(false);
    setObError(false);
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
  const L3_Handler = (e) => {
    setL3Value(e.target.value);
    DropDown_ErrorHandler(e.target.value, setL3Error);
  };

  const OnBehalf_Handler = (e) => {
    setObValue(e.target.value);
    DropDown_ErrorHandler(e.target.value, setObError);
  };

  const Price_Handler = (e) => {
    Price_ErrorHandler(e.target.value, setPriceError);
  };

  const Datetime_ErrorHandler = (e) => {
    setdatetimeError(e);
  };

  const Datetime_Handler = (e) => {
    setDatetimeValue(e);
  };

  const Price_ErrorHandler = (value, setter) => {
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
    const ps = Price_ErrorHandler(event.target.amount.value, setPriceError);
    const l1s = DropDown_ErrorHandler(event.target[2].value, setL1Error);
    const l2s = DropDown_ErrorHandler(event.target[4].value, setL2Error);
    const l3s = DropDown_ErrorHandler(event.target[6].value, setL3Error);
    const obs = DropDown_ErrorHandler(event.target[8].value, setObError);
    if (event.target[12].value === '') {
      setdatetimestateError(true);
    } else {
      setdatetimestateError(false);
    }
    if (!(ps | l1s | l2s | l3s | behalfError | obs) && datetimeError === null && event.target[12].value !== '') {
      const payload = {
        Expense: event.target.amount.value,
        Label_key: selectedLabelId,
        Onbehalf: event.target[8].value,
        Expense_Note: event.target.Comments.value,
        Timestamp: formatDatetime(DatetimeValue),
        Custom: 'Construction',
      };
      try {
        await submitExpense(payload).unwrap();
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
    <Box display="flex" justifyContent="center">
      <Box p={3} border="solid" borderColor="divider" borderRadius={1} bgcolor="background.paper">
        <Form onSubmit={handleSubmit}>
              <Stack direction="column" spacing={2}>
                <FormControl error={priceError}>
                  <InputLabel htmlFor="amount">Expense</InputLabel>
                  <OutlinedInput
                    id="amount"
                    onChange={(e) => { Price_Handler(e); }}
                    startAdornment={<InputAdornment position="start">₹ </InputAdornment>}
                    label="Expense"
                  />
                  <FormHelperText>{priceError ? 'Enter a valid price(Eg: 10, 20.5)' : ''}</FormHelperText>
                </FormControl>
                <Stack spacing={2} direction="row">
                  <DropDown id='L1' options={l1Options} value={L1Value} handler={L1_Handler} error={L1Error} width='100%' maxWidth={550} label={"L1"} />
                  <DropDown id='L2' options={l2Options} value={L2Value} handler={L2_Handler} error={L2Error} width='100%' maxWidth={550} label={"L2"} />
                </Stack>
                <Stack spacing={2} direction="row">
                  <DropDown id='L3' options={l3Options} value={L3Value} handler={L3_Handler} error={L3Error} width='100%' maxWidth={550} label={"L3"} />
                  <DropDown id='Onbehalf' options={ObOptions} value={ObValue} handler={OnBehalf_Handler} error={ObError} width='100%' maxWidth={550} label={"Onbehalf"} />
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
  );
}

export default ConstructionExpenseForm;
