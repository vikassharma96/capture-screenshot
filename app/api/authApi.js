import apiClient from './apiClient';

const register = body => apiClient.post('/auth/employee', body);

export default {
  register,
};
