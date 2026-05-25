import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { labelsApi } from './labelsApi';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

function consumerLabelTag(kind, scope) {
  if (kind === 'expense') {
    return { type: 'Labels', id: scope === 'construction' ? 'construction' : 'expense' };
  }
  return { type: 'Labels', id: 'income' };
}

function invalidateConsumerLabels(dispatch, { kind, scope }) {
  dispatch(labelsApi.util.invalidateTags([consumerLabelTag(kind, scope)]));
}

function upsertAdminLabel(dispatch, endpoint, arg, newItem) {
  dispatch(
    labelsAdminApi.util.updateQueryData(endpoint, arg, (draft) => {
      const index = draft.findIndex((row) => row.id === newItem.id);
      if (index >= 0) {
        draft[index] = newItem;
      } else {
        draft.push(newItem);
      }
    })
  );
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
      query: ({ scope, body }) => ({
        url: `/manage-labels/expense?scope=${scope}`,
        method: 'POST',
        body,
      }),
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        try {
          const { data: newItem } = await queryFulfilled;
          upsertAdminLabel(dispatch, 'getAdminExpenseLabels', scope, newItem);
          invalidateConsumerLabels(dispatch, { kind: 'expense', scope });
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
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedItem } = await queryFulfilled;
          upsertAdminLabel(dispatch, 'getAdminExpenseLabels', scope, updatedItem);
          invalidateConsumerLabels(dispatch, { kind: 'expense', scope });
        } catch {
          // mutation failed
        }
      },
    }),
    renameExpenseLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/expense/rename',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { scope }) => [
        { type: 'AdminLabels', id: `expense-${scope}` },
      ],
      async onQueryStarted({ scope }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateConsumerLabels(dispatch, { kind: 'expense', scope });
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
          invalidateConsumerLabels(dispatch, { kind: 'expense', scope });
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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newItem } = await queryFulfilled;
          upsertAdminLabel(dispatch, 'getAdminIncomeLabels', undefined, newItem);
          invalidateConsumerLabels(dispatch, { kind: 'income' });
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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedItem } = await queryFulfilled;
          upsertAdminLabel(dispatch, 'getAdminIncomeLabels', undefined, updatedItem);
          invalidateConsumerLabels(dispatch, { kind: 'income' });
        } catch {
          // mutation failed
        }
      },
    }),
    renameIncomeLabel: builder.mutation({
      query: (body) => ({
        url: '/manage-labels/income/rename',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLabels', id: 'income' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateConsumerLabels(dispatch, { kind: 'income' });
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
          invalidateConsumerLabels(dispatch, { kind: 'income' });
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
