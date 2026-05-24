import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

export const incomeApi = createApi({
  reducerPath: 'incomeApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['Income'],
  endpoints: (builder) => ({
    getIncome: builder.query({
      query: (params) => ({
        url: '/income',
        params,
      }),
      providesTags: ['Income'],
    }),
    submitIncome: builder.mutation({
      query: (body) => ({
        url: '/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Income'],
    }),
  }),
});

export const { useGetIncomeQuery, useSubmitIncomeMutation } = incomeApi;
