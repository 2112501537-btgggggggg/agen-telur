import axiosClient from './axiosClient';

export const getCategories = () =>
  axiosClient.get('/categories').then((res) => res.data);

export const createCategory = (data) =>
  axiosClient.post('/admin/categories', data).then((res) => res.data);

export const updateCategory = (id, data) =>
  axiosClient.put(`/admin/categories/${id}`, data).then((res) => res.data);

export const deleteCategory = (id) =>
  axiosClient.delete(`/admin/categories/${id}`).then((res) => res.data);
