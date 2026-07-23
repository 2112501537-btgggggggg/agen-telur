import axiosClient from './axiosClient';

export const getSuppliers = () =>
  axiosClient.get('/admin/suppliers').then((res) => res.data);

export const createSupplier = (data) =>
  axiosClient.post('/admin/suppliers', data).then((res) => res.data);

export const updateSupplier = (id, data) =>
  axiosClient.put(`/admin/suppliers/${id}`, data).then((res) => res.data);

export const deleteSupplier = (id) =>
  axiosClient.delete(`/admin/suppliers/${id}`).then((res) => res.data);
