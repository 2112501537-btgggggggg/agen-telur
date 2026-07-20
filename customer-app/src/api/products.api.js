import axiosClient from './axiosClient';

export const listProducts = ({ categoryId, search, page, limit } = {}) => {
  const params = {};
  if (categoryId != null) params.categoryId = categoryId;
  if (search) params.search = search;
  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;

  return axiosClient.get('/products', { params }).then((res) => res.data);
};
