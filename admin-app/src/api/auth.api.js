import axiosClient from './axiosClient';

export const adminLogin = (data) => axiosClient.post('/auth/admin/login', data).then(res => res.data);

export const getMe = () => axiosClient.get('/auth/me').then(res => res.data);

export const refreshToken = (refreshToken) => axiosClient.post('/auth/refresh-token', { refreshToken }).then(res => res.data);
