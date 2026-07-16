import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Interceptor: attach token dari localStorage jika ada
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
