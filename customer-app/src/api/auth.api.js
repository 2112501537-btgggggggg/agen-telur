import axiosClient from './axiosClient';

export const register = (data) => axiosClient.post('/auth/register', data).then(res => res.data);

export const login = (data) => axiosClient.post('/auth/login', data).then(res => res.data);

export const getMe = () => axiosClient.get('/auth/me').then(res => res.data);
