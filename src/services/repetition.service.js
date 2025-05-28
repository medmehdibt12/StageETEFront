/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📥 Get all active repetitions
export const getRepetitions = async () => {
  const res = await api.get('/repetition');
  return res.data;
};

// ➕ Create a new repetition
export const createRepetition = async (data) => {
  const res = await api.post('/repetition', data);
  return res.data;
};

// ✏️ Update an existing repetition
export const updateRepetition = async (id, data) => {
  const res = await api.patch(`/repetition/${id}`, data);
  return res.data;
};

// 🗑️ Permanently delete a repetition
export const deleteRepetitionPermanent = async (id) => {
  const res = await api.delete(`/repetition/${id}/permanent`);
  return res.data;
};

// 📥 Get attendance for a specific concert
export const getAttendanceForConcert = async (concertId) => {
  const res = await api.get(`/repetition/attendance/${concertId}`);
  return res.data;
};


export const getRepetitionsByConcert = async (concertId) => {
  const res = await api.get(`/repetition/concert/${concertId}`);
  return res.data;
};


// 📌 Mark presence for a specific répétition
export const markRepetitionPresence = async (repetitionId) => {
  const res = await api.post(`/repetition/${repetitionId}/presence`);
  return res.data;
};



export const markRepetitionAbsence = async (repetitionId, reason) => {
  const res = await api.post(`/repetition/${repetitionId}/absence`, { reason });
  return res.data;
};