/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';



export const getAllLeaves = async () => {
  try {
    const res = await api.get('/leave');
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message || 'Erreur serveur';
  }
};


export const declareLeave = async (userId, leaveData) => {
  try {
    const res = await api.post(`/leave/${userId}/declare-leave`, leaveData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message || 'Erreur serveur';
  }
};

export const acceptLeave = async (leaveId) => {
  try {
    const res = await api.put(`/leave/${leaveId}/accept`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message || 'Erreur serveur';
  }
};