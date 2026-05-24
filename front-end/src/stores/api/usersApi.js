import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.REACT_APP_API_URL + '/api';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl, credentials: 'include' }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getOnBehalfUsers: builder.query({
      query: () => '/user',
      providesTags: ['Users'],
      transformResponse: (response) => {
        const options = [];
        const userKeyByName = {};
        response.forEach((entry) => {
          options.push(entry['On-Behalf']);
          userKeyByName[entry['On-Behalf']] = entry.userKey;
        });
        return { options, userKeyByName };
      },
    }),
  }),
});

export const { useGetOnBehalfUsersQuery } = usersApi;
