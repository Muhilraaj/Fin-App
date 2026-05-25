import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

export const labelsApi = createApi({
  reducerPath: 'labelsApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['Labels'],
  endpoints: (builder) => ({
    getExpenseLabels: builder.query({
      query: () => '/labels/expense',
      providesTags: [{ type: 'Labels', id: 'expense' }],
      keepUnusedDataFor: 3600,
    }),
    getConstructionLabels: builder.query({
      query: () => '/labels/construction',
      providesTags: [{ type: 'Labels', id: 'construction' }],
      keepUnusedDataFor: 3600,
    }),
    getIncomeLabels: builder.query({
      query: () => '/labels/income',
      providesTags: [{ type: 'Labels', id: 'income' }],
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useGetExpenseLabelsQuery,
  useGetConstructionLabelsQuery,
  useGetIncomeLabelsQuery,
} = labelsApi;
