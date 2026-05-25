import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['Expenses'],
  endpoints: (builder) => ({
    getExpenses: builder.query({
      query: (params) => ({
        url: '/expense',
        params,
      }),
      providesTags: ['Expenses'],
    }),
    submitExpense: builder.mutation({
      query: (body) => ({
        url: '/expense',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses'],
    }),
  }),
});

export const { useGetExpensesQuery, useSubmitExpenseMutation } = expenseApi;
