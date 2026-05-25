import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { hideSnackbar } from '../stores/slices/snackbarSlice';

function SnackbarWrapper() {
  const dispatch = useDispatch();
  const snackbar = useSelector((state) => state.snackbar);

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => dispatch(hideSnackbar())}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={snackbar.type}
        onClose={() => dispatch(hideSnackbar())}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}

export default SnackbarWrapper;
