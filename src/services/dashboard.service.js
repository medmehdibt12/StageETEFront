/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📊 Get Admin dashboard data
export const getAdminDashboard = async () => {
  const res = await api.get('/dashboard/admin');
  return res.data;
};

// 📊 Get Manager dashboard data
export const getManagerDashboard = async () => {
  const res = await api.get('/dashboard/manager');
  return res.data;
};

// 📊 Get Choriste & Chef de choeur dashboard data
// export const getChoristeChefDashboard = async () => {
//   const res = await api.get('/dashboard/choriste-chef');
//   return res.data;
// };
