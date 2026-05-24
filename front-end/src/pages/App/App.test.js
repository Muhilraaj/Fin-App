import snackbarReducer, { showSnackbar, hideSnackbar } from '../../stores/slices/snackbarSlice';

test('snackbar slice shows and hides messages', () => {
  let state = snackbarReducer(undefined, { type: '@@INIT' });
  expect(state).toEqual({ open: false, message: '', type: 'success' });

  state = snackbarReducer(state, showSnackbar({ message: 'Saved', type: 'success' }));
  expect(state.open).toBe(true);
  expect(state.message).toBe('Saved');

  state = snackbarReducer(state, hideSnackbar());
  expect(state.open).toBe(false);
});
