import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';

function DropDown(props) {
    //console.log(data[0])
    return (
      <FormControl sx={{ display:'flex',p:props.p,height:props.height,width:props.width,maxWidth:props.maxWidth,boxShadow:props.boxShadow }} error={props.error}>
        <InputLabel id="demo-simple-select-label" sx={{display:'flex',p:props.p }}>{props.label}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={props.value}
          label={props.label}
          onChange={(e) => { props.handler(e) }}
        >
          <MenuItem value="*">
            <em>Select Label</em>
          </MenuItem>
          {
            props.options.map(
              (d) => { return <MenuItem value={d}>{d}</MenuItem> }
            )
          }
        </Select>
        <FormHelperText>{props.error ? 'Select Something' : ''}</FormHelperText>
      </FormControl>
    );
  }

  export default DropDown;