import axiosClient from './axiosClient';

export const getAdminProducts = (params = {}) =>
  axiosClient.get('/admin/products', { params }).then((res) => res.data);

export const getProductById = (id) =>
  axiosClient.get(`/admin/products/${id}`).then((res) => res.data);

export const createProduct = (formData) =>
  axiosClient.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const updateProduct = (id, formData) =>
  axiosClient.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const deleteProduct = (id) =>
  axiosClient.delete(`/admin/products/${id}`).then((res) => res.data);

export const addVariant = (productId, data) =>
  axiosClient.post(`/admin/products/${productId}/variants`, data).then((res) => res.data);

export const updateVariant = (variantId, data) =>
  axiosClient.put(`/admin/products/variants/${variantId}`, data).then((res) => res.data);
