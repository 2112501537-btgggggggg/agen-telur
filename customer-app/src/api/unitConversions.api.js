import axiosClient from './axiosClient';

export const listUnitConversions = () =>
  axiosClient.get('/unit-conversions').then((res) => res.data);
