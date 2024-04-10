import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FormControl from '@mui/material/FormControl';


function Date(props) {
    return (
      <FormControl sx={{ display:'flex',boxShadow:props.boxShadow,p:props.p}}>
        <LocalizationProvider dateAdapter={AdapterDayjs}
        >
          <DemoContainer
            components={[
                'DatePicker',
            ]}
          >
            <DemoItem>
              <DatePicker label={props.label}
                defaultValue={props.defaultValue}
                views={props.views}
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

  export default Date;