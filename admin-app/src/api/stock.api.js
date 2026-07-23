import axiosClient from './axiosClient';

export const getStockIns = (params = {}) =>
  axiosClient.get('/admin/stock-in', { params }).then((res) => res.data);

export const createStockIn = (data) =>
  axiosClient.post('/admin/stock-in', data).then((res) => res.data);

export const getStockAdjustments = (variantId) =>
  axiosClient.get(`/admin/products/variants/${variantId}/stock-adjustments`).then((res) => res.data);

export const createStockAdjustment = (variantId, data) =>
  axiosClient.post(`/admin/products/variants/${variantId}/stock-adjustment`, data).then((res) => res.data);
