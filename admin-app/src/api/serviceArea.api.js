import axiosClient from './axiosClient';

export const getAdminServiceAreas = () =>
  axiosClient.get('/admin/service-areas').then((res) => res.data);

export const createServiceArea = (data) =>
  axiosClient.post('/admin/service-areas', data).then((res) => res.data);

export const updateServiceArea = (id, data) =>
  axiosClient.put(`/admin/service-areas/${id}`, data).then((res) => res.data);

export const deleteServiceArea = (id) =>
  axiosClient.delete(`/admin/service-areas/${id}`).then((res) => res.data);
