import axiosClient from './axiosClient';

export const validateCheckout = (data) =>
  axiosClient.post('/orders/validate', data).then((res) => res.data);

export const createOrder = (data) =>
  axiosClient.post('/orders', data).then((res) => res.data);
