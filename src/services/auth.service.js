/* eslint-disable prettier/prettier */
import api from '../utils/axiosInstance';

export const loginUnified = async ({ email, password }) => {
  try {
    const res = await api.post('/auth/login', { email, password });

    const { token } = res.data;
    localStorage.setItem('token', token);

    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};



export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};


export const updateCurrentUser = async (data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });

  const response = await api.patch('/auth/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
};


// Apply for membership
export const applyForMembership = async (applicationData) => {
  try {
    const response = await api.post('/auth/apply', applicationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Membership application failed' };
  }
};


// Send confirmation email to candidate
export const sendConfirmationEmail = async (email) => {
  const res = await api.post('/auth/send-email-confirmation', { email });
  return res.data;
};

export const checkEmailConfirmed = async (email) => {
  const res = await api.get(`/auth/check-email-confirmed?email=${email}`);
  return res.data;
};

export const confirmEmailToken = async (token) => {
  const res = await api.get(`/auth/confirm-email?token=${token}`);
  return res.data; // Return the confirmation message
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('name'); // Clean legacy if still exists
  localStorage.removeItem('role'); // Clean legacy if still exists
    // localStorage.removeItem('logout-event');
  // localStorage.setItem('logout-event', Date.now()); // for cross-tab logout
};
