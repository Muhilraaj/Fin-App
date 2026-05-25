import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

export const labelsAdminApi = createApi({
  reducerPath: 'labelsAdminApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['AdminLabels', 'Labels'],
  endpoints: (builder) => ({
    getAdminExpenseLabels: builder.query({
      query: (scope) => `/manage-labels/expense?scope=${scope}`,
      providesTags: (_result, _error, scope) => [{ type: 'AdminLabels', id: `expense-${scope}` }],
    }),
    getAdminIncomeLabels: builder.query({
      query: () => '/manage-labels/income',
      providesTags: [{ type: 'AdminLabels', id: 'income' }],
    }),
    createExpenseLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/expense',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'AdminLabels', id: `expense-${body.Custom === 'Construction' ? 'construction' : 'regular'}` },
        { type: 'Labels', id: body.Custom === 'Construction' ? 'construction' : 'expense' },
      ],
    }),
    updateExpenseLabel: builder.mutation({
      query: ({ id, body }) => ({
        url: `/manage-labels/expense/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
        { type: 'Labels', id: scope === 'construction' ? 'construction' : 'expense' },
      ],
    }),
    deleteExpenseLabel: builder.mutation({
      query: ({ id, scope }) => ({
        url: `/manage-labels/expense/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
        { type: 'Labels', id: scope === 'construction' ? 'construction' : 'expense' },
      ],
    }),
    createIncomeLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminLabels', id: 'income' },
        { type: 'Labels', id: 'income' },
      ],
    }),
    updateIncomeLabel: builder.mutation({
      query: ({ id, body }) => ({
        url: `/manage-labels/income/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminLabels', id: 'income' },
        { type: 'Labels', id: 'income' },
      ],
    }),
    deleteIncomeLabel: builder.mutation({
      query: (id) => ({
        url: `/manage-labels/income/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AdminLabels', id: 'income' },
        { type: 'Labels', id: 'income' },
      ],
    }),
  }),
});

export const {
  useGetAdminExpenseLabelsQuery,
  useGetAdminIncomeLabelsQuery,
  useCreateExpenseLabelMutation,
  useUpdateExpenseLabelMutation,
  useDeleteExpenseLabelMutation,
  useCreateIncomeLabelMutation,
  useUpdateIncomeLabelMutation,
  useDeleteIncomeLabelMutation,
} = labelsAdminApi;
