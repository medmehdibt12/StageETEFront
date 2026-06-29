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

// ✅ UPDATED: Get final participants (now gets from finalParticipants field)
export const getFinalParticipantsForConcert = async (concertId) => {
  const res = await api.get(`/concerts/${concertId}/final-participants`);
  return res.data;
};

// ✅ NEW: Validate choriste for concert
export const validateChoristeForConcert = async (concertId, choristeId) => {
  const res = await api.post(`/concerts/${concertId}/validate/${choristeId}`);
  return res.data;
};

// ✅ NEW: Delete from final participants
export const deleteFromFinalParticipants = async (concertId, choristeId, reason) => {
  const res = await api.delete(`/concerts/${concertId}/final-participants/${choristeId}`, {
    data: { reason }
  });
  return res.data;
};


// ✅ NEW: Chef de pupitre final participants services

// Get concerts with final participants for chef de pupitre
export const getConcertsForChefFinalParticipants = async () => {
  const res = await api.get('/concerts/chef-pupitre/concerts-with-participants');
  return res.data;
};

// Get final participants for specific concert (chef de pupitre view)
export const getFinalParticipantsForChef = async (concertId) => {
  const res = await api.get(`/concerts/${concertId}/chef-pupitre/final-participants`);
  return res.data;
};

// Remove choriste from final participants (chef de pupitre action)
export const removeFromFinalParticipantsAsChef = async (concertId, choristeId) => {
  const res = await api.delete(`/concerts/${concertId}/chef-pupitre/final-participants/${choristeId}`);
  return res.data;
};


// ✅ NEW: Mark absence for concert
export const markConcertAbsence = async (concertId, reason = 'manual_absence') => {
  const res = await api.post(`/concerts/${concertId}/absence`, { reason });
  return res.data;
};

// ✅ NEW: Auto-mark absent for past concert (admin only)
export const autoMarkAbsentForPastConcert = async (concertId) => {
  const res = await api.post(`/concerts/${concertId}/auto-mark-absent`);
  return res.data;
};

// ✅ NEW: Get concert status for choriste
export const getConcertStatusForChoriste = async (concertId, choristeId) => {
  const res = await api.get(`/concerts/${concertId}/status/${choristeId}`);
  return res.data;
};

// ✅ NEW: Get current concert with filtered oeuvres for connected choriste
export const getCurrentConcertOeuvres = async () => {
  const res = await api.get('/concerts/current-oeuvres');
  return res.data;
};