import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { labelsApi } from './labelsApi';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

function invalidateAllLabelCaches(dispatch, { kind, scope }) {
  const adminTags = [];
  const consumerTags = [];

  if (kind === 'expense') {
    adminTags.push({ type: 'AdminLabels', id: `expense-${scope}` });
    consumerTags.push({
      type: 'Labels',
      id: scope === 'construction' ? 'construction' : 'expense',
    });
  } else if (kind === 'income') {
    adminTags.push({ type: 'AdminLabels', id: 'income' });
    consumerTags.push({ type: 'Labels', id: 'income' });
  }

  dispatch(labelsAdminApi.util.invalidateTags(adminTags));
  dispatch(labelsApi.util.invalidateTags(consumerTags));
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
      query: ({ body }) => ({
        url: '/manage-labels/expense',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope, body }, { dispatch, queryFulfilled }) {
        try {
          const { data: newItem } = await queryFulfilled;
          dispatch(
            labelsAdminApi.util.updateQueryData('getAdminExpenseLabels', scope, (draft) => {
              if (!draft.some((row) => row.id === newItem.id)) {
                draft.push(newItem);
              }
            })
          );
          invalidateAllLabelCaches(dispatch, { kind: 'expense', scope });
        } catch {
          // mutation failed
        }
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
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'expense', scope });
        } catch {
          // mutation failed
        }
      },
    }),
    renameExpenseLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/expense',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'expense', scope });
        } catch {
          // mutation failed
        }
      },
    }),
    deleteExpenseLabel: builder.mutation({
      query: ({ id }) => ({
        url: `/manage-labels/expense/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'expense', scope });
        } catch {
          // mutation failed
        }
      },
    }),
    createIncomeLabel: builder.mutation({
      query: ({ body }) => ({
        url: '/manage-labels/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newItem } = await queryFulfilled;
          dispatch(
            labelsAdminApi.util.updateQueryData('getAdminIncomeLabels', undefined, (draft) => {
              if (!draft.some((row) => row.id === newItem.id)) {
                draft.push(newItem);
              }
            })
          );
          invalidateAllLabelCaches(dispatch, { kind: 'income' });
        } catch {
          // mutation failed
        }
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
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'income' });
        } catch {
          // mutation failed
        }
      },
    }),
    renameIncomeLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/income',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'income' });
        } catch {
          // mutation failed
        }
      },
    }),
    deleteIncomeLabel: builder.mutation({
      query: ({ id }) => ({
        url: `/manage-labels/income/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateAllLabelCaches(dispatch, { kind: 'income' });
        } catch {
          // mutation failed
        }
      },
    }),
  }),
});

export const {
  useGetAdminExpenseLabelsQuery,
  useGetAdminIncomeLabelsQuery,
  useCreateExpenseLabelMutation,
  useUpdateExpenseLabelMutation,
  useRenameExpenseLabelMutation,
  useDeleteExpenseLabelMutation,
  useCreateIncomeLabelMutation,
  useUpdateIncomeLabelMutation,
  useRenameIncomeLabelMutation,
  useDeleteIncomeLabelMutation,
} = labelsAdminApi;
