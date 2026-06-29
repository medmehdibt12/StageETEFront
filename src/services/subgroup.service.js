import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const createSubgroup = async (subgroupData) => {
  const response = await axios.post(`${API_URL}/subgroups`, subgroupData, getHeaders());
  return response.data;
};

export const getSubgroups = async (status) => {
  const url = status ? `${API_URL}/subgroups?status=${status}` : `${API_URL}/subgroups`;
  const response = await axios.get(url, getHeaders());
  return response.data;
};

export const getSubgroupById = async (id) => {
  const response = await axios.get(`${API_URL}/subgroups/${id}`, getHeaders());
  return response.data;
};

export const updateSubgroup = async (id, subgroupData) => {
  const response = await axios.put(`${API_URL}/subgroups/${id}`, subgroupData, getHeaders());
  return response.data;
};

export const deleteSubgroup = async (id) => {
  const response = await axios.delete(`${API_URL}/subgroups/${id}`, getHeaders());
  return response.data;
};

export const addMembersToSubgroup = async (id, userIds) => {
  const response = await axios.post(`${API_URL}/subgroups/${id}/members`, { userIds }, getHeaders());
  return response.data;
};

export const removeMemberFromSubgroup = async (id, userId) => {
  const response = await axios.post(`${API_URL}/subgroups/${id}/members/remove`, { userId }, getHeaders());
  return response.data;
};

export const sendSubgroupAnnouncement = async (id, messageContent) => {
  const response = await axios.post(`${API_URL}/subgroups/${id}/announce`, { messageContent }, getHeaders());
  return response.data;
};

export const getAllChoristes = async () => {
  const response = await axios.get(`${API_URL}/users/active`, getHeaders());
  return response.data;
};
