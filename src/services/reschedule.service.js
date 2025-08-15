// services/adminRescheduleService.js
import api from '../utils/axiosInstance';

// 🎯 GET: Fetch all reschedule requests (both types)
export const getAllRescheduleRequests = async () => {
  const res = await api.get('/reschedule/requests');
  return res.data;
};

// 🎯 GET: Fetch reschedule statistics for dashboard
export const getRescheduleStatistics = async () => {
  const res = await api.get('/reschedule/statistics');
  return res.data;
};

// 🎯 GET: Fetch only same-day reschedule requests
export const getSameDayRescheduleRequests = async () => {
  const res = await api.get('/reschedule/same-day-requests');
  return res.data;
};

// 🎯 POST: Approve same-day reschedule request
export const approveSameDayReschedule = async (candidateId) => {
  const res = await api.post(`/reschedule/approve/${candidateId}`);
  return res.data;
};

// 🎯 POST: Reject same-day reschedule request
export const rejectSameDayReschedule = async (candidateId, reason = '') => {
  const res = await api.post(`/reschedule/reject/${candidateId}`, {
    reason
  });
  return res.data;
};

// 🎯 Helper: Get requests count by type
export const getRescheduleRequestsCount = async () => {
  const stats = await getRescheduleStatistics();
  return {
    sameDayCount: stats.sameDayReschedule,
    differentDayCount: stats.differentDayReschedule,
    totalPending: stats.sameDayReschedule + stats.differentDayReschedule
  };
};

// 🎯 Helper: Approve multiple requests (bulk action)
export const bulkApproveRequests = async (candidateIds) => {
  const results = [];
  for (const candidateId of candidateIds) {
    try {
      const result = await approveSameDayReschedule(candidateId);
      results.push({ candidateId, success: true, data: result });
    } catch (error) {
      results.push({ candidateId, success: false, error: error.message });
    }
  }
  return results;
};

// 🎯 Helper: Reject multiple requests (bulk action)
export const bulkRejectRequests = async (candidateIds, reason = '') => {
  const results = [];
  for (const candidateId of candidateIds) {
    try {
      const result = await rejectSameDayReschedule(candidateId, reason);
      results.push({ candidateId, success: true, data: result });
    } catch (error) {
      results.push({ candidateId, success: false, error: error.message });
    }
  }
  return results;
};