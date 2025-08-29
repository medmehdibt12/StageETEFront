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

// ✅ NEW: Chef de pupitre presence management functions
// 📥 Get choristes status from chef's pupitre for a specific repetition
export const getMyChoristesStatus = async (repetitionId) => {
  const res = await api.get(`/repetition/${repetitionId}/chef-pupitre/my-choristes`);
  return res.data;
};

// ➕ Add or update manual presence for a choriste
export const addManualPresence = async (repetitionId, data) => {
  const res = await api.post(`/repetition/${repetitionId}/chef-pupitre/manual-presence`, data);
  return res.data;
};

// 🗑️ Remove manual presence (revert to automatic status)
export const removeManualPresence = async (repetitionId, choristeId) => {
  const res = await api.delete(`/repetition/${repetitionId}/chef-pupitre/manual-presence/${choristeId}`);
  return res.data;
};

// ✅ EXISTING: Get manager absence report
export const getManagerAbsenceReport = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await api.get(`/repetition/manager/absence-report?${queryString}`);
  return res.data;
};

// ✅ NEW: Get comprehensive absence report (repetitions + concerts)
export const getComprehensiveAbsenceReport = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await api.get(`/repetition/comprehensive-absence-report?${queryString}`);
  return res.data;
};

export const getRepetitionsForManager = async () => {
  try {
    const response = await api.get('/repetition/manager/repetitions');
    return response.data;
  } catch (error) {
    console.error('Error fetching repetitions for manager:', error);
    throw error;
  }
};

// Modify repetition for manager's pupitre
export const modifyRepetitionForAllChoristes = async (repetitionId, modificationData) => {
  try {
    const response = await api.post(`/repetition/${repetitionId}/manager/modify`, modificationData);
    return response.data;
  } catch (error) {
    console.error('Error modifying repetition:', error);
    throw error;
  }
};
