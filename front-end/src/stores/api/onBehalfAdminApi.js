import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { usersApi } from './usersApi';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

function upsertAdminOnBehalf(dispatch, newItem) {
  dispatch(
    onBehalfAdminApi.util.updateQueryData('getAdminOnBehalfUsers', undefined, (draft) => {
      const index = draft.findIndex((row) => row.id === newItem.id);
      if (index >= 0) {
        draft[index] = newItem;
      } else {
        draft.push(newItem);
      }
    })
  );
}

export const onBehalfAdminApi = createApi({
  reducerPath: 'onBehalfAdminApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['AdminOnBehalf', 'Users'],
  endpoints: (builder) => ({
    getAdminOnBehalfUsers: builder.query({
      query: () => '/manage-onbehalf',
      providesTags: [{ type: 'AdminOnBehalf', id: 'LIST' }],
    }),
    createOnBehalfUser: builder.mutation({
      query: (body) => ({
        url: '/manage-onbehalf',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newItem } = await queryFulfilled;
          upsertAdminOnBehalf(dispatch, newItem);
          dispatch(usersApi.util.invalidateTags(['Users']));
        } catch {
          // mutation failed
        }
      },
    }),
    updateOnBehalfUser: builder.mutation({
      query: ({ id, body }) => ({
        url: `/manage-onbehalf/${id}`,
        method: 'PUT',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedItem } = await queryFulfilled;
          upsertAdminOnBehalf(dispatch, updatedItem);
          dispatch(usersApi.util.invalidateTags(['Users']));
        } catch {
          // mutation failed
        }
      },
    }),
  }),
});

export const {
  useGetAdminOnBehalfUsersQuery,
  useCreateOnBehalfUserMutation,
  useUpdateOnBehalfUserMutation,
} = onBehalfAdminApi;
