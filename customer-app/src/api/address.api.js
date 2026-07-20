import axiosClient from './axiosClient';

export const listAddresses = () =>
  axiosClient.get('/users/me/addresses').then((res) => res.data);

export const createAddress = (data) =>
  axiosClient.post('/users/me/addresses', data).then((res) => res.data);

export const updateAddress = (id, data) =>
  axiosClient.put(`/users/me/addresses/${id}`, data).then((res) => res.data);

export const deleteAddress = (id) =>
  axiosClient.delete(`/users/me/addresses/${id}`).then((res) => res.data);
