/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

// 📥 Get all users
export const getUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

// 🔒 Get locked users
export const getLockedUsers = async () => {
  const res = await api.get('/users/locked');
  return res.data;
};

// 🔁 Restore locked user
export const restoreUser = async (id) => {
  const res = await api.post(`/users/restore/${id}`);
  return res.data;
};

// 📥 Get user by ID
export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// ➕ Create new user (used by admin)
export const createUser = async (userData) => {
  const res = await api.post('/users', userData);
  return res.data;
};

// ✏️ Update a user
export const updateUser = async (id, userData) => {
  const res = await api.patch(`/users/${id}`, userData);
  return res.data;
};

// ❌ Soft‑lock a user
export const lockUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};



// 🗑️ Permanently delete a user
export const deleteUserPermanent = async (id) => {
  const res = await api.delete(`/users/${id}/permanent`);
  return res.data;
};


// 📥 Eliminate choriste (lock + set status)
export const eliminateChoriste = async (id) => {
  const res = await api.post(`/users/eliminate/${id}`);
  return res.data;
};

// 📥 get membershipsub
export const getMembershipSubmissions = async (status = "Pending") => {
  const res = await api.get(`/users/membership-submissions?status=${status}`);
  return res.data;
};

// // 📬 Accept membership
export const acceptMembership = async (id) => {
  const res = await api.put(`/users/accept/${id}`);
  return res.data;
};

export const sendTestDates = async (startDate, endDate) => {
  const res = await api.post("/users/send-test-dates", { startDate, endDate });
  return res.data;
};


// 🚫 Refuse membership (with reason)
export const refuseMembership = async (id, reason) => {
  const res = await api.put(`/users/refuse/${id}`, { reason });
  return res.data;
};

// ✅ Get accepted choristers
export const getAcceptedMemberships = async () => {
  const res = await api.get('/users/accepted-memberships');
  return res.data;
};

export const updatePupitre = async (userId, pupitre) => {
  try {
    const response = await api.put(`/users/${userId}/voc-pupitre`, { pupitre });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour de la tessiture.");
  }
};


export const getActiveChoristes = async () => {
  try {
    const res = await api.get('/users/active');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erreur lors de la récupération des choristes actifs.");
  }
};