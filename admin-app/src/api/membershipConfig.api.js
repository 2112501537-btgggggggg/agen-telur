import axiosClient from './axiosClient';

export const getMembershipConfig = () =>
  axiosClient.get('/admin/membership-config').then((res) => res.data);

export const updateMembershipConfig = (data) =>
  axiosClient.put('/admin/membership-config', data).then((res) => res.data);
