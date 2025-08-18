import api from '../utils/axiosInstance';

// Get all chefs de pupitre organized by pupitre
export const getChefsPupitre = async () => {
  const res = await api.get('/chef-pupitre');
  return res.data;
};

// Get available choristes for a specific pupitre
export const getAvailableChoristesForPupitre = async (pupitre) => {
  const res = await api.get(`/chef-pupitre/available/${pupitre}`);
  return res.data;
};

// Assign chef de pupitre
export const assignChefDePupitre = async (userId, pupitre) => {
  const res = await api.post(`/chef-pupitre/assign/${userId}`, { pupitre });
  return res.data;
};

// Remove chef de pupitre
export const removeChefDePupitre = async (userId) => {
  const res = await api.delete(`/chef-pupitre/remove/${userId}`);
  return res.data;
};

// Get statistics about chefs de pupitre
export const getChefsPupitreStats = async () => {
  const res = await api.get('/chef-pupitre/stats');
  return res.data;
};