// services/convocationService.js
import api from '../utils/axiosInstance';

// 🎯 GET: Fetch convocation details for response page
export const getConvocationResponse = async (candidateId) => {
  const res = await api.get(`/convocation/response/${candidateId}`);
  return res.data;
};

// 🎯 POST: Handle convocation response (confirm/decline/reschedule)
export const handleConvocationResponse = async (candidateId, action, rescheduleType = null, newStartTime = null) => {
  const res = await api.post(`/convocation/response/${candidateId}`, {
    action,
    rescheduleType,
    newStartTime
  });
  return res.data;
};

// 🆕 NEW: Get available time slots for same day reschedule
export const getAvailableTimes = async (candidateId) => {
  const res = await api.get(`/convocation/available-times/${candidateId}`);
  return res.data;
};

// 🎯 POST: Admin trigger for auto-decline expired convocations
export const triggerAutoDecline = async () => {
  const res = await api.post('/convocation/auto-decline');
  return res.data;
};

// 🎯 Helper: Confirm convocation
export const confirmConvocation = async (candidateId) => {
  return await handleConvocationResponse(candidateId, 'confirm');
};

// 🎯 Helper: Decline convocation
export const declineConvocation = async (candidateId) => {
  return await handleConvocationResponse(candidateId, 'decline');
};

// 🆕 NEW: Helper: Request different day reschedule
export const rescheduleConvocationDifferentDay = async (candidateId) => {
  return await handleConvocationResponse(candidateId, 'reschedule', 'different_day');
};

// 🆕 NEW: Helper: Request same day reschedule
export const rescheduleConvocationSameDay = async (candidateId, newStartTime) => {
  return await handleConvocationResponse(candidateId, 'reschedule', 'same_day', newStartTime);
};