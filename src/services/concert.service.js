/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📥 Get all concerts
export const getConcerts = async () => {
  const res = await api.get('/concerts');
  return res.data;
};

// ➕ Create a new concert
export const createConcert = async (concertData) => {
  const res = await api.post('/concerts', concertData);
  return res.data;
};

// ✏️ Update an existing concert
export const updateConcert = async (id, concertData) => {
  const res = await api.patch(`/concerts/${id}`, concertData);
  return res.data;
};

// ❌ Permanently delete a concert
export const deleteConcertPermanent = async (id) => {
  const res = await api.delete(`/concerts/${id}/permanent`);
  return res.data;
};


export const markConcertAvailability = async (concertId) => {
  const res = await api.patch(`/concerts/${concertId}/availability`);
  return res.data;
};


export const getConcertAttendanceEligibility = async (concertId, choristeId) => {
  const res = await api.get(`/concerts/${concertId}/attendance/${choristeId}`);
  return res.data;
};
