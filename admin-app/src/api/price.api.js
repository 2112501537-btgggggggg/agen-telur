import axiosClient from './axiosClient';

export const getVariantPrices = () =>
  axiosClient.get('/admin/products/prices').then((res) => res.data);

export const updateVariantPrice = (variantId, newPrice) =>
  axiosClient.put(`/admin/products/variants/${variantId}/price`, { newPrice }).then((res) => res.data);

export const bulkUpdatePrices = (updates) =>
  axiosClient.put('/admin/products/prices/bulk', { updates }).then((res) => res.data);

export const getPriceHistory = (variantId) =>
  axiosClient.get(`/admin/products/variants/${variantId}/price-history`).then((res) => res.data);
