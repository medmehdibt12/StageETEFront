import api from '../utils/axiosInstance';

// ✅ UPDATED: Get concert analysis with validation status
export const getConcertAbsenceReport = async (concertId) => {
  const res = await api.get(`/elimination/concert/${concertId}/validation-analysis`);
  return res.data;
};

// Send warning notifications to choristes at risk
export const sendWarningNotifications = async (concertId, choristeIds) => {
  const res = await api.post(`/elimination/concert/${concertId}/warnings`, {
    choristeIds
  });
  return res.data;
};

// ✅ NEW: Send comprehensive warning notifications (repetitions + concerts)
export const sendComprehensiveWarningNotifications = async (choristeIds, filterData = null) => {
  const res = await api.post('/elimination/send-comprehensive-warnings', {
    choristeIds,
    filterData
  });
  return res.data;
};

// Eliminate a choriste (absence-based)
export const eliminateChoristeForAbsence = async (choristeId, concertId, notes = '') => {
  const res = await api.post(`/elimination/eliminate/${choristeId}`, {
    reason: 'absence_threshold',
    concertId,
    notes
  });
  return res.data;
};

// Eliminate a choriste (disciplinary)
export const eliminateChoristeForDisciplinary = async (choristeId, concertId, notes) => {
  const res = await api.post(`/elimination/eliminate/${choristeId}`, {
    reason: 'disciplinary',
    concertId,
    notes
  });
  return res.data;
};

// Generic eliminate function
export const eliminateChoriste = async (choristeId, reason, options = {}) => {
  const payload = {
    reason,
    notes: options.notes || '',
    ...(reason === 'absence_threshold' && options.concertId && { concertId: options.concertId })
  };

  const res = await api.post(`/elimination/eliminate/${choristeId}`, payload);
  return res.data;
};

// Get overall absence statistics
export const getOverallAbsenceStatistics = async () => {
  const res = await api.get('/elimination/statistics');
  return res.data;
};

// Get detailed absence history for a specific choriste
export const getChoristeAbsenceDetails = async (choristeId) => {
  const res = await api.get(`/elimination/choriste/${choristeId}`);
  return res.data;
};
