import axiosClient from './axiosClient';

export const getDashboardSummary = () =>
  axiosClient.get('/admin/dashboard/summary').then((res) => res.data);

export const getSalesReport = (from, to) =>
  axiosClient.get('/admin/dashboard/sales-report', { params: { from, to } }).then((res) => res.data);
