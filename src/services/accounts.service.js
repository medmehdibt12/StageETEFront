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

