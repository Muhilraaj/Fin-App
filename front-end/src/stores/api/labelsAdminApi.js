import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { labelsApi } from './labelsApi';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

function invalidateLabelCache(dispatch, labelId) {
  dispatch(labelsApi.util.invalidateTags([{ type: 'Labels', id: labelId }]));
}

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
      ],
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, body.Custom === 'Construction' ? 'construction' : 'expense');
      },
    }),
    updateExpenseLabel: builder.mutation({
      query: ({ id, body }) => ({
        url: `/manage-labels/expense/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, scope === 'construction' ? 'construction' : 'expense');
      },
    }),
    deleteExpenseLabel: builder.mutation({
      query: ({ id, scope }) => ({
        url: `/manage-labels/expense/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, scope === 'construction' ? 'construction' : 'expense');
      },
    }),
    createIncomeLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, 'income');
      },
    }),
    updateIncomeLabel: builder.mutation({
      query: ({ id, body }) => ({
        url: `/manage-labels/income/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, 'income');
      },
    }),
    deleteIncomeLabel: builder.mutation({
      query: (id) => ({
        url: `/manage-labels/income/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateLabelCache(dispatch, 'income');
      },
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
