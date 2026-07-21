import axiosClient from './axiosClient';

export const getMembershipInfo = () =>
  axiosClient.get('/membership-info').then((res) => res.data);
