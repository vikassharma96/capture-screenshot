const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'https://dev-api.focusro.com/api/v1/',
  timeout: 3000,
});

// apiClient.interceptors.request.use(request => {
//   console.log('Request', JSON.stringify(request, null, 2));
//   return request;
// });

apiClient.interceptors.request.use(request => {
  const headers = {
    ...request.headers.common,
    ...request.headers[request.method],
    ...request.headers,
  };
  ['common', 'get', 'post', 'head', 'put', 'patch', 'delete'].forEach(
    header => delete headers[header],
  );
  const requestLog = {
    baseUrl: request.baseURL,
    url: request.url,
    headers: headers,
    data: request.data,
  };
  console.log('Request Interceptors: ', JSON.stringify(requestLog));
  return request;
});

export default apiClient;
