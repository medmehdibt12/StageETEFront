/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📥 Fetch current config (e.g., signupActive status)
export const getConfig = async () => {
  const res = await api.get('/config');
  return res.data;
};

// ✏️ Update signupActive flag (enable/disable registrations)
export const updateSignupActive = async (isActive) => {
  const res = await api.put('/config/update-signup-active', { signupActive: isActive });
  return res.data;
};


export const getParticipationThreshold = async () => {
  const res = await api.get("/config/threshold");
  return res.data.participationThreshold;
};

export const updateParticipationThreshold = async (value) => {
  const res = await api.put("/config/threshold", { participationThreshold: value });
  return res.data;
};