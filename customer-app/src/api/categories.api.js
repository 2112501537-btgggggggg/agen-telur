import axiosClient from './axiosClient';

export const listCategories = () =>
  axiosClient.get('/categories').then((res) => res.data);
