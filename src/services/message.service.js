import api from '../utils/axiosInstance';

// ✅ Send manager broadcast message to all choristes
export const sendManagerBroadcast = async (messageData) => {
  try {
    const response = await api.post('/messages/manager/broadcast', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending manager broadcast:', error);
    throw error;
  }
};

// ✅ Send chef de pupitre message to pupitre members
export const sendChefPupitreMessage = async (messageData) => {
  try {
    const response = await api.post('/messages/chef-pupitre/message', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending chef pupitre message:', error);
    throw error;
  }
};
