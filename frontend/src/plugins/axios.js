import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://nginx', // Point to the Nginx server
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;