import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { labelsApi } from './api/labelsApi';
import { usersApi } from './api/usersApi';
import { expenseApi } from './api/expenseApi';
import { incomeApi } from './api/incomeApi';
import { labelsAdminApi } from './api/labelsAdminApi';
import snackbarReducer from './slices/snackbarSlice';

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [labelsApi.reducerPath]: labelsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [incomeApi.reducerPath]: incomeApi.reducer,
    [labelsAdminApi.reducerPath]: labelsAdminApi.reducer,
    snackbar: snackbarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      authApi.middleware,
      labelsApi.middleware,
      usersApi.middleware,
      expenseApi.middleware,
      incomeApi.middleware,
      labelsAdminApi.middleware,
    ]),
});

export default store;
