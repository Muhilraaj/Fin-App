import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FormControl from '@mui/material/FormControl';


function DateTime(props) {
    return (
      <FormControl sx={{ width: "100%", minWidth: 240 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}
        >
          <DemoContainer
            components={[
              'DateTimePicker',
            ]}
          >
            <DemoItem>
              <DateTimePicker label={props.label}
                value={props.value}
                onChange={(e) => { props.handler(e) }}
                onError={(e) => props.e_handler(e)}
                slotProps={{
                  textField: {
                    helperText: props.e_message
                  }
                }}
                disableFuture />
            </DemoItem>
          </DemoContainer>
        </LocalizationProvider>
      </FormControl>
    )
  }

  export default DateTime;