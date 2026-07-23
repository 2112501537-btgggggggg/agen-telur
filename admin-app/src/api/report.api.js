import axiosClient from './axiosClient';

export const getSalesReport = (from, to) =>
  axiosClient.get('/admin/dashboard/sales-report', { params: { from, to } }).then((res) => res.data);

export const getDamagedReport = (limit) =>
  axiosClient.get('/admin/dashboard/damaged-report', { params: { limit } }).then((res) => res.data);
