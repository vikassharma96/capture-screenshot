import apiClient from './apiClient';

const configApi = token =>
  apiClient.get('sys-app/:organisationCode/configuration', {
    headers: {Authorization: `Bearer ${token}`},
  });

export default configApi;
