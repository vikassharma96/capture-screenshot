import apiClient from './apiClient';

const configApi = (orgCode, token) =>
  apiClient.get(`sys-app/${orgCode}/configuration`, {
    headers: {Authorization: `Bearer ${token}`},
  });

export default configApi;
