import api from '../utils/axiosInstance';

// Create new audition evaluation
export const createAuditionEvaluation = async (evaluationData) => {
  const res = await api.post('/audition-evaluations', evaluationData);
  return res.data;
};

// Update existing audition evaluation
export const updateAuditionEvaluation = async (evaluationId, evaluationData) => {
  const res = await api.put(`/audition-evaluations/${evaluationId}`, evaluationData);
  return res.data;
};

// Get evaluation by candidate and audition slot
export const getAuditionEvaluation = async (candidateId, auditionSlotId) => {
  const res = await api.get(`/audition-evaluations/candidate/${candidateId}/slot/${auditionSlotId}`);
  return res.data;
};

// Get tessiture options based on candidate's gender
export const getTessitureOptions = async (candidateId) => {
  const res = await api.get(`/audition-evaluations/tessiture-options/${candidateId}`);
  return res.data;
};


export const getCandidateCharterStatus = async (candidateId) => {
  const res = await api.get(`/audition-evaluations/candidate/${candidateId}/charter-status`);
  return res.data;
};