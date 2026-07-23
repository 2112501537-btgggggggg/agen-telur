import axiosClient from './axiosClient';

export const getAdminOrders = (params = {}) =>
  axiosClient.get('/admin/orders', { params }).then((res) => res.data);

export const getAdminOrderById = (id) =>
  axiosClient.get(`/admin/orders/${id}`).then((res) => res.data);

export const updateOrderStatus = (id, status) =>
  axiosClient.put(`/admin/orders/${id}/status`, { status }).then((res) => res.data);

export const cancelOrder = (id) =>
  axiosClient.put(`/admin/orders/${id}/cancel`).then((res) => res.data);

export const confirmCodPayment = (id) =>
  axiosClient.put(`/admin/orders/${id}/confirm-cod-payment`).then((res) => res.data);
