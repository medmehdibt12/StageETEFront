/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📋 Get all surveys (admin = all, choriste = active ones targeting them)
export const getSurveys = async () => {
  const res = await api.get('/surveys');
  return res.data;
};

// 🔍 Get survey by ID with questions
export const getSurveyById = async (id) => {
  const res = await api.get(`/surveys/${id}`);
  return res.data;
};

// 📝 Get predefined survey templates
export const getSurveyTemplates = async () => {
  const res = await api.get('/surveys/templates');
  return res.data;
};

// ➕ Create a new survey
export const createSurvey = async (data) => {
  const res = await api.post('/surveys', data);
  return res.data;
};

// ✏️ Update a survey (brouillon only)
export const updateSurvey = async (id, data) => {
  const res = await api.patch(`/surveys/${id}`, data);
  return res.data;
};

// 🔄 Change survey status: 'actif' | 'clos' | 'brouillon'
export const updateSurveyStatut = async (id, statut) => {
  const res = await api.patch(`/surveys/${id}/statut`, { statut });
  return res.data;
};

// ❌ Permanently delete a survey + its responses
export const deleteSurvey = async (id) => {
  const res = await api.delete(`/surveys/${id}`);
  return res.data;
};

// 📬 Submit choriste's response
export const respondToSurvey = async (id, reponses) => {
  const res = await api.post(`/surveys/${id}/repondre`, { reponses });
  return res.data;
};

// 🙋 Get current user's own response for a survey
export const getMaReponse = async (id) => {
  const res = await api.get(`/surveys/${id}/ma-reponse`);
  return res.data;
};

// 📊 Get aggregated results (admin / manager)
export const getSurveyResultats = async (id) => {
  const res = await api.get(`/surveys/${id}/resultats`);
  return res.data;
};
