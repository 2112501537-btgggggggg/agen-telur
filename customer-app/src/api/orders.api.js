import axiosClient from './axiosClient';

export const validateCheckout = (data) =>
  axiosClient.post('/orders/validate', data).then((res) => res.data);

export const createOrder = (data) =>
  axiosClient.post('/orders', data).then((res) => res.data);

export const listOrders = (params) =>
  axiosClient.get('/orders', { params }).then((res) => res.data);

export const getOrderDetail = (id) =>
  axiosClient.get(`/orders/${id}`).then((res) => res.data);

export const submitReview = (orderId, data) =>
  axiosClient.post(`/orders/${orderId}/reviews`, data).then((res) => res.data);
