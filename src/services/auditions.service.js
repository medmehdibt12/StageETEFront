import api from '../utils/axiosInstance';

export const listAuditionParameters = async () => {
  const res = await api.get('/auditions/parameters');
  return res.data;
};

export const getAuditionParametersById = async (id) => {
  const res = await api.get(`/auditions/parameters/${id}`);
  return res.data;
};

export const saveAuditionParameters = async (params) => {
  const res = await api.post('/auditions/parameters', params);
  return res.data;
};

export const updateAuditionParameters = async (id, params) => {
  const res = await api.put(`/auditions/parameters/${id}`, params);
  return res.data;
};

export const deleteAuditionParameters = async (id) => {
  const res = await api.delete(`/auditions/parameters/${id}`);
  return res.data;
};

export const generateAuditions = async (paramsId) => {
  const res = await api.post('/auditions/generate', { paramsId });
  return res.data;
};

// New functions for planning management
export const checkPlanningExists = async (paramsId) => {
  const res = await api.get(`/auditions/parameters/${paramsId}/slots`);
  return res.data;
};

export const getPlanningDetails = async (paramsId) => {
  const res = await api.get(`/auditions/parameters/${paramsId}/planning`);
  return res.data;
};

export const getConfirmedCandidatesForAudition = async (planningId) => {
  const res = await api.get(`/auditions/confirmed-candidates/${planningId}`);
  return res.data;
};
