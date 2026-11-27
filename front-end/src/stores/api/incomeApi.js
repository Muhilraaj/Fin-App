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
    updateIncome: builder.mutation({
      query: ({ id, version, changes }) => ({
        url: `/income/${encodeURIComponent(id)}`,
        method: 'PATCH',
        headers: { 'If-Match': version },
        body: changes,
      }),
      invalidatesTags: ['Income'],
    }),
    deleteIncome: builder.mutation({
      query: ({ id, version }) => ({
        url: `/income/${encodeURIComponent(id)}`,
        method: 'DELETE',
        headers: { 'If-Match': version },
      }),
      invalidatesTags: ['Income'],
    }),
  }),
});

export const {
  useGetIncomeQuery,
  useSubmitIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
} = incomeApi;
